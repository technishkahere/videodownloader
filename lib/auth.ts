import { randomBytes, scrypt, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";

/**
 * Self-contained authentication.
 *
 * - Passwords are hashed with scrypt (salt + key), zero external deps.
 * - Sessions are stateless HMAC-signed cookies: `uid:expiry.signature`.
 * - Anonymous visitors get a signed "guest" cookie backed by a real User row
 *   (isGuest=true) so their free-trial downloads have an owner. On sign-up the
 *   guest row is upgraded in place, carrying that trial history into the account.
 *
 * Middleware only checks cookie *presence* (cheap, edge-safe). Real
 * authorization always happens here, server-side, via signature verification.
 */

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/* ----------------------------- passwords ----------------------------- */

const SCRYPT_KEYLEN = 64;

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null | undefined
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* --------------------------- token signing --------------------------- */

function sign(value: string): string {
  const sig = createHmac("sha256", config.authSecret).update(value).digest("base64url");
  return `${value}.${sig}`;
}

/** Verify the HMAC and return the original value, or null if tampered. */
function unsign(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", config.authSecret)
    .update(value)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

/** token = sign("<uid>:<expiryMs>") */
function makeToken(uid: string, ttlMs: number): string {
  return sign(`${uid}:${Date.now() + ttlMs}`);
}

function readToken(signed: string | undefined): string | null {
  const value = unsign(signed);
  if (!value) return null;
  const sep = value.indexOf(":");
  if (sep < 0) return null;
  const uid = value.slice(0, sep);
  const exp = Number(value.slice(sep + 1));
  if (!uid || !Number.isFinite(exp) || Date.now() > exp) return null;
  return uid;
}

/* ----------------------------- cookies ----------------------------- */

const isProd = process.env.NODE_ENV === "production";

function baseCookie(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

/** Start a logged-in session for a real user. */
export function createSession(userId: string): void {
  cookies().set(
    config.sessionCookie,
    makeToken(userId, config.sessionTtlMs),
    baseCookie(config.sessionTtlMs)
  );
}

export function destroySession(): void {
  cookies().set(config.sessionCookie, "", { ...baseCookie(0), maxAge: 0 });
}

function setGuestCookie(userId: string): void {
  // Guests persist for a year so the trial counter survives return visits.
  const ttl = 365 * 24 * 60 * 60 * 1000;
  cookies().set(config.guestCookie, makeToken(userId, ttl), baseCookie(ttl));
}

/** Drop the guest cookie (e.g. after a guest upgrades to a real account). */
export function clearGuestCookie(): void {
  cookies().set(config.guestCookie, "", { ...baseCookie(0), maxAge: 0 });
}

/* --------------------------- user lookups --------------------------- */

export type AuthUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

/** Shape a user for the client (never leaks passwordHash). */
export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    downloadsUsed: user.downloadsUsed,
    createdAt: user.createdAt.toISOString(),
  };
}

function loadUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      isGuest: true,
      downloadsUsed: true,
      createdAt: true,
      usage: {
        select: { trialDownloadsUsed: true, trialLimit: true },
      },
    },
  });
}

/** The signed-in real user, or null. Reads & verifies the session cookie. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const uid = readToken(cookies().get(config.sessionCookie)?.value);
  if (!uid) return null;
  const user = await loadUser(uid);
  if (!user || user.isGuest) return null;
  return user;
}

/** Like getAuthUser but throws for use in protected routes. */
export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * The current "actor" whose downloads/files we may read: the signed-in user if
 * present, otherwise the guest tied to the guest cookie. Read-only (never
 * creates anything) so it is safe to call from GET handlers.
 */
export async function getCurrentActor(): Promise<AuthUser | null> {
  const authed = await getAuthUser();
  if (authed) return authed;
  const guestId = readToken(cookies().get(config.guestCookie)?.value);
  if (!guestId) return null;
  const guest = await loadUser(guestId);
  return guest && guest.isGuest ? guest : null;
}

/**
 * Resolve the actor for a *mutating* request (starting a download), creating a
 * fresh guest identity if the visitor has none yet. May set the guest cookie.
 */
export async function ensureActor(): Promise<AuthUser> {
  const existing = await getCurrentActor();
  if (existing) return existing;

  const guest = await prisma.user.create({
    data: {
      isGuest: true,
      plan: "FREE",
      usage: { create: { trialLimit: config.trialLimit } },
    },
  });
  setGuestCookie(guest.id);
  const loaded = await loadUser(guest.id);
  // loaded is guaranteed non-null immediately after creation.
  return loaded as AuthUser;
}

import { z } from "zod";
import { errorJson, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { config } from "@/lib/config";
import {
  hashPassword,
  createSession,
  clearGuestCookie,
  getAuthUser,
  getCurrentActor,
  publicUser,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`signup:${ip}`, 10).ok) {
    return errorJson("Too many attempts. Please wait a moment.", 429);
  }

  // Already signed in? Nothing to do.
  if (await getAuthUser()) return errorJson("You're already signed in", 400);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return errorJson("Invalid request body");
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return errorJson(parsed.error.issues[0]?.message ?? "Invalid sign-up details");
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name ?? null;
  const passwordHash = await hashPassword(parsed.data.password);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) return errorJson("An account with that email already exists", 409);

  // If the visitor has been trying downloads as a guest, upgrade that row so
  // their trial history becomes part of the new account.
  const actor = await getCurrentActor();
  let userId: string;

  if (actor && actor.isGuest) {
    const upgraded = await prisma.user.update({
      where: { id: actor.id },
      data: { email, name, passwordHash, isGuest: false },
      select: { id: true },
    });
    userId = upgraded.id;
    clearGuestCookie();
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        isGuest: false,
        usage: { create: { trialLimit: config.trialLimit } },
      },
      select: { id: true },
    });
    userId = created.id;
  }

  createSession(userId);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      isGuest: true,
      downloadsUsed: true,
      createdAt: true,
      usage: { select: { trialDownloadsUsed: true, trialLimit: true } },
    },
  });

  return json({ user: publicUser(user) }, { status: 201 });
}

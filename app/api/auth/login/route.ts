import { z } from "zod";
import { errorJson, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyPassword, createSession, publicUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  // Tight limit to slow credential stuffing.
  if (!rateLimit(`login:${ip}`, 10).ok) {
    return errorJson("Too many attempts. Please wait a moment.", 429);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return errorJson("Invalid request body");
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) return errorJson("Enter your email and password");

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      isGuest: true,
      passwordHash: true,
      downloadsUsed: true,
      createdAt: true,
      usage: { select: { trialDownloadsUsed: true, trialLimit: true } },
    },
  });

  // Same generic error whether the email is unknown or the password is wrong.
  const ok =
    user && !user.isGuest && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!ok || !user) return errorJson("Invalid email or password", 401);

  createSession(user.id);
  return json({ user: publicUser(user) });
}

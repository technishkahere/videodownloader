import { z } from "zod";
import { errorJson, json, sanitizeText } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  requireAuthUser,
  UnauthorizedError,
  destroySession,
  publicUser,
} from "@/lib/auth";
import { removeFilesFor } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchBody = z.object({ name: z.string().trim().min(1).max(80) });

/** Update profile fields (currently just the display name). */
export async function PATCH(req: Request) {
  let user;
  try {
    user = await requireAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return errorJson("Sign in required", 401);
    throw e;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return errorJson("Invalid request body");
  }
  const parsed = PatchBody.safeParse(payload);
  if (!parsed.success) return errorJson("Enter a valid name");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: sanitizeText(parsed.data.name, 80) },
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

  return json({ user: publicUser(updated) });
}

/** Permanently delete the account, its downloads, and any stored files. */
export async function DELETE() {
  let user;
  try {
    user = await requireAuthUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) return errorJson("Sign in required", 401);
    throw e;
  }

  const rows = await prisma.videoDownload.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  await removeFilesFor(rows.map((r) => r.id));
  // Cascade deletes downloads + usage via the schema relations.
  await prisma.user.delete({ where: { id: user.id } });
  destroySession();

  return json({ ok: true });
}

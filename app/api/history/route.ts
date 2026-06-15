import { errorJson, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuthUser, UnauthorizedError } from "@/lib/auth";
import { removeFilesFor } from "@/lib/storage";
import type { HistoryRecord, PlatformId } from "@/lib/types";
import type { DownloadStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireUser(_req: Request) {
  return requireAuthUser();
}

export async function GET(req: Request) {
  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    if (e instanceof UnauthorizedError) return errorJson("Sign in required", 401);
    throw e;
  }

  const rows = await prisma.videoDownload.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const items: HistoryRecord[] = rows.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title ?? "Untitled video",
    thumbnail: r.thumbnail,
    creator: r.creator,
    duration: r.duration,
    platform: r.platform as PlatformId,
    quality: r.quality,
    format: r.format,
    status: r.status as DownloadStatus,
    progress: r.progress,
    fileUrl: r.status === "COMPLETED" ? r.fileUrl : null,
    fileSize: r.fileSize,
    createdAt: r.createdAt.toISOString(),
  }));

  return json({ items });
}

/** Clear the signed-in user's entire history (and remove any stored files). */
export async function DELETE(req: Request) {
  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    if (e instanceof UnauthorizedError) return errorJson("Sign in required", 401);
    throw e;
  }

  const rows = await prisma.videoDownload.findMany({
    where: { userId: user.id },
    select: { id: true },
  });

  await removeFilesFor(rows.map((r) => r.id));
  await prisma.videoDownload.deleteMany({ where: { userId: user.id } });

  return json({ ok: true, deleted: rows.length });
}

import { errorJson, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getLiveJob } from "@/lib/jobs";
import { getCurrentActor } from "@/lib/auth";
import type { JobStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentActor();
  if (!user) return errorJson("Sign in required", 401);

  const row = await prisma.videoDownload.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      userId: true,
      status: true,
      progress: true,
      step: true,
      fileUrl: true,
      fileSize: true,
      title: true,
      error: true,
    },
  });

  if (!row || row.userId !== user.id) {
    return errorJson("Download not found", 404);
  }

  // Prefer the live, in-memory state (sub-second progress) when present.
  const live = getLiveJob(row.id);
  const status: JobStatus = {
    id: row.id,
    status: live?.status ?? row.status,
    progress: live?.progress ?? row.progress,
    step: live?.step ?? row.step ?? "Processing...",
    fileUrl: live?.fileUrl ?? row.fileUrl,
    fileSize: live?.fileSize ?? row.fileSize,
    title: live?.title ?? row.title,
    error: live?.error ?? row.error,
  };

  return json(status);
}

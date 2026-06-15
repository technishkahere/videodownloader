import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { runDownload, YtDlpError } from "@/lib/ytdlp";
import type { DownloadStatus, Format, Quality } from "@/lib/types";

/**
 * In-memory live job state + concurrency control.
 *
 * Progress updates land here on every yt-dlp tick (cheap) and are flushed to
 * Postgres at milestones (durable). The status endpoint reads the live map
 * first and falls back to the DB, so it survives a server restart.
 *
 * A global singleton keeps the map stable across Next.js hot-reloads.
 */
interface LiveJob {
  progress: number;
  step: string;
  status: DownloadStatus;
  fileUrl: string | null;
  fileSize: string | null;
  title: string | null;
  error: string | null;
}

interface JobRuntime {
  live: Map<string, LiveJob>;
  active: number;
  queue: Array<() => void>;
  sweptAt: number;
}

const g = globalThis as unknown as { __grablyJobs?: JobRuntime };
const rt: JobRuntime =
  g.__grablyJobs ??
  (g.__grablyJobs = { live: new Map(), active: 0, queue: [], sweptAt: 0 });

/* ------------------------- concurrency ------------------------- */

function acquireSlot(): Promise<void> {
  if (rt.active < config.maxConcurrentJobs) {
    rt.active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => rt.queue.push(resolve));
}

function releaseSlot() {
  rt.active = Math.max(0, rt.active - 1);
  const next = rt.queue.shift();
  if (next) {
    rt.active++;
    next();
  }
}

/* ------------------------- file cleanup ------------------------- */

function scheduleDeletion(filePath: string) {
  if (config.fileTtlMs <= 0) return;
  const t = setTimeout(() => {
    fs.rm(filePath, { force: true }).catch(() => {});
  }, config.fileTtlMs);
  (t as { unref?: () => void }).unref?.();
}

/** Best-effort sweep of stale files (covers TTLs lost to restarts). */
async function sweepStorage() {
  if (config.fileTtlMs <= 0) return;
  const now = Date.now();
  if (now - rt.sweptAt < 5 * 60 * 1000) return;
  rt.sweptAt = now;
  try {
    const entries = await fs.readdir(config.storageDir);
    await Promise.all(
      entries.map(async (name) => {
        const p = path.join(config.storageDir, name);
        try {
          const st = await fs.stat(p);
          if (now - st.mtimeMs > config.fileTtlMs) await fs.rm(p, { force: true });
        } catch {
          /* ignore */
        }
      })
    );
  } catch {
    /* storage dir may not exist yet */
  }
}

/* ------------------------- public API ------------------------- */

export interface CreateJobParams {
  userId: string;
  url: string;
  platform: string;
  quality: Quality;
  format: Format;
  // Display-only metadata captured from /api/video-info (sanitized by caller).
  title?: string | null;
  thumbnail?: string | null;
  creator?: string | null;
  duration?: string | null;
}

export async function createDownloadJob(params: CreateJobParams): Promise<string> {
  void sweepStorage();

  const row = await prisma.videoDownload.create({
    data: {
      userId: params.userId,
      url: params.url,
      platform: params.platform,
      quality: params.format === "MP3" ? "Audio" : params.quality,
      format: params.format,
      title: params.title ?? null,
      thumbnail: params.thumbnail ?? null,
      creator: params.creator ?? null,
      duration: params.duration ?? null,
      status: "PROCESSING",
      progress: 0,
      step: "Queued...",
    },
    select: { id: true },
  });

  rt.live.set(row.id, {
    progress: 0,
    step: "Queued...",
    status: "PROCESSING",
    fileUrl: null,
    fileSize: null,
    title: params.title ?? null,
    error: null,
  });

  // Fire-and-forget worker.
  void runJob(row.id, params);
  return row.id;
}

async function runJob(id: string, params: CreateJobParams) {
  await acquireSlot();
  let lastFlush = 0;

  const setLive = (patch: Partial<LiveJob>) => {
    const cur = rt.live.get(id);
    if (cur) rt.live.set(id, { ...cur, ...patch });
  };

  try {
    const result = await runDownload({
      id,
      url: params.url,
      quality: params.quality,
      format: params.format,
      onProgress: (progress, step) => {
        setLive({ progress, step });
        // Throttle DB writes to ~1/sec; always allow the final tick.
        const now = Date.now();
        if (now - lastFlush > 1000) {
          lastFlush = now;
          prisma.videoDownload
            .update({ where: { id }, data: { progress, step } })
            .catch(() => {});
        }
      },
    });

    const fileUrl = `/api/download/${id}/file`;
    setLive({
      status: "COMPLETED",
      progress: 100,
      step: "Complete",
      fileUrl,
      fileSize: result.fileSize,
    });
    await prisma.videoDownload.update({
      where: { id },
      data: {
        status: "COMPLETED",
        progress: 100,
        step: "Complete",
        fileUrl,
        fileSize: result.fileSize,
      },
    });
    // Bump the owner's lifetime completed-download stat (best-effort).
    await prisma.user
      .update({
        where: { id: params.userId },
        data: { downloadsUsed: { increment: 1 } },
      })
      .catch(() => {});
    scheduleDeletion(result.filePath);
  } catch (err) {
    const message =
      err instanceof YtDlpError
        ? err.code === "NOT_INSTALLED"
          ? "Video processing is unavailable on the server"
          : err.message
        : "Something went wrong. Try again.";
    setLive({ status: "FAILED", step: "Failed", error: message });
    await prisma.videoDownload
      .update({
        where: { id },
        data: { status: "FAILED", step: "Failed", error: message },
      })
      .catch(() => {});
  } finally {
    releaseSlot();
    // Drop live entry shortly after terminal state so the map stays small.
    const t = setTimeout(() => rt.live.delete(id), 60_000);
    (t as { unref?: () => void }).unref?.();
  }
}

export function getLiveJob(id: string): LiveJob | undefined {
  return rt.live.get(id);
}

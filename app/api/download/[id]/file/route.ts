import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { errorJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { getCurrentActor } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".webm": "video/webm",
};

function safeFilename(title: string | null, ext: string): string {
  const base = (title || "video")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return `${base || "video"}${ext}`;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentActor();
  if (!user) return errorJson("Sign in required", 401);

  const row = await prisma.videoDownload.findUnique({
    where: { id: params.id },
    select: { userId: true, status: true, title: true },
  });

  if (!row || row.userId !== user.id) return errorJson("File not found", 404);
  if (row.status !== "COMPLETED")
    return errorJson("File is not ready yet", 409);

  // Resolve the on-disk file (constrained to storageDir; id is a cuid).
  let entries: string[];
  try {
    entries = await fs.readdir(config.storageDir);
  } catch {
    return errorJson("File has expired and is no longer available", 410);
  }
  const name = entries.find((f) => f.startsWith(`${params.id}.`));
  if (!name) return errorJson("File has expired and is no longer available", 410);

  const filePath = path.join(config.storageDir, name);
  // Defense-in-depth against path traversal.
  if (!filePath.startsWith(path.resolve(config.storageDir))) {
    return errorJson("Invalid file path", 400);
  }

  const stat = await fs.stat(filePath).catch(() => null);
  if (!stat) return errorJson("File has expired and is no longer available", 410);

  const ext = path.extname(name).toLowerCase();
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${safeFilename(row.title, ext)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

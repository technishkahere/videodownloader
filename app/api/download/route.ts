import { z } from "zod";
import { errorJson, json, sanitizeText, sanitizeThumbnail } from "@/lib/api";
import { sanitizeUrl } from "@/lib/url";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { ytDlpAvailable } from "@/lib/ytdlp";
import { createDownloadJob } from "@/lib/jobs";
import { ensureActor } from "@/lib/auth";
import { consumeQuota, refundQuota, QuotaExceededError } from "@/lib/quota";
import { ALL_QUALITIES } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  url: z.string().min(1).max(2048),
  quality: z.enum(ALL_QUALITIES as [string, ...string[]]).default("720p"),
  format: z.enum(["MP4", "MP3"]).default("MP4"),
  // Optional display metadata captured client-side from /api/video-info.
  title: z.string().max(500).optional(),
  thumbnail: z.string().max(2048).optional(),
  creator: z.string().max(300).optional(),
  duration: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`download:${ip}`, 8);
  if (!limit.ok) {
    return errorJson("Too many downloads started. Please wait a moment.", 429, {
      resetAt: limit.resetAt,
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return errorJson("Invalid request body");
  }

  const parsed = Body.safeParse(payload);
  if (!parsed.success) return errorJson("Invalid download request");

  const clean = sanitizeUrl(parsed.data.url);
  if (!clean.ok || !clean.url) {
    return errorJson(clean.reason ?? "Enter a valid video link");
  }

  if (!(await ytDlpAvailable())) {
    return errorJson(
      "Video processing is not available on this server. Install yt-dlp + ffmpeg to enable downloads.",
      503
    );
  }

  // Resolve the actor (signed-in user, or a guest for the free trial) and
  // claim one unit of their allowance before any work begins.
  const actor = await ensureActor();
  try {
    await consumeQuota(actor);
  } catch (e) {
    if (e instanceof QuotaExceededError) {
      return errorJson(e.message, 402, { code: "TRIAL_EXCEEDED" });
    }
    throw e;
  }

  let id: string;
  try {
    id = await createDownloadJob({
      userId: actor.id,
      url: clean.url,
      platform: clean.platform,
      quality: parsed.data.quality as (typeof ALL_QUALITIES)[number],
      format: parsed.data.format,
      title: sanitizeText(parsed.data.title, 500),
      thumbnail: sanitizeThumbnail(parsed.data.thumbnail),
      creator: sanitizeText(parsed.data.creator, 300),
      duration: sanitizeText(parsed.data.duration, 20),
    });
  } catch (e) {
    // Couldn't even enqueue — give the trial credit back.
    await refundQuota(actor);
    throw e;
  }

  return json({ id, status: "PROCESSING" }, { status: 202 });
}

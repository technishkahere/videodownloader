import { z } from "zod";
import { errorJson, json } from "@/lib/api";
import { sanitizeUrl } from "@/lib/url";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fetchMetadata, ytDlpAvailable, YtDlpError } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ url: z.string().min(1).max(2048) });

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = rateLimit(`video-info:${ip}`);
  if (!limit.ok) {
    return errorJson("Too many requests. Slow down a moment.", 429, {
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
  if (!parsed.success) return errorJson("Enter a valid video link");

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

  try {
    const meta = await fetchMetadata(clean.url);
    return json(meta);
  } catch (err) {
    if (err instanceof YtDlpError) {
      if (err.code === "NOT_INSTALLED") return errorJson(err.message, 503);
      if (err.code === "TIMEOUT")
        return errorJson("Timed out analyzing that video. Try again.", 504);
      return errorJson(err.message, 422);
    }
    return errorJson("Something went wrong. Try again.", 500);
  }
}

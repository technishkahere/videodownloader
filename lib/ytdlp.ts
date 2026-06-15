import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "@/lib/config";
import { ALL_QUALITIES, QUALITY_HEIGHT } from "@/lib/types";
import type { Format, Quality, VideoMeta } from "@/lib/types";
import { detectPlatform } from "@/lib/url";

/* ----------------------------- helpers ----------------------------- */

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function humanSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

class YtDlpError extends Error {
  code: "NOT_INSTALLED" | "FAILED" | "TIMEOUT" | "TOO_LARGE";
  constructor(message: string, code: YtDlpError["code"]) {
    super(message);
    this.name = "YtDlpError";
    this.code = code;
  }
}
export { YtDlpError };

let availability: boolean | null = null;

/** Cheap one-time check that the yt-dlp binary is on the host. */
export async function ytDlpAvailable(): Promise<boolean> {
  if (availability !== null) return availability;
  availability = await new Promise<boolean>((resolve) => {
    const p = spawn(config.ytDlpPath, ["--version"]);
    p.on("error", () => resolve(false));
    p.on("close", (code) => resolve(code === 0));
  });
  return availability;
}

/* --------------------------- metadata --------------------------- */

interface RawFormat {
  height?: number | null;
  vcodec?: string | null;
  acodec?: string | null;
  filesize?: number | null;
  filesize_approx?: number | null;
}
interface RawInfo {
  title?: string;
  thumbnail?: string;
  thumbnails?: { url: string }[];
  duration?: number;
  uploader?: string;
  channel?: string;
  uploader_id?: string;
  filesize_approx?: number;
  formats?: RawFormat[];
}

function runJson(args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(config.ytDlpPath, args, { windowsHide: true });
    let out = "";
    let err = "";
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
      reject(new YtDlpError("Timed out fetching metadata", "TIMEOUT"));
    }, timeoutMs);

    child.stdout.on("data", (d) => {
      out += d.toString();
      if (out.length > 25 * 1024 * 1024) {
        child.kill("SIGKILL");
        reject(new YtDlpError("Metadata response too large", "FAILED"));
      }
    });
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) =>
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new YtDlpError("yt-dlp is not installed on the server", "NOT_INSTALLED")
          : new YtDlpError(e.message, "FAILED")
      )
    );
    child.on("close", (code) => {
      clearTimeout(timer);
      if (killed) return;
      if (code === 0) resolve(out);
      else
        reject(
          new YtDlpError(
            err.trim().split("\n").slice(-1)[0] || "Could not analyze this video",
            "FAILED"
          )
        );
    });
  });
}

export async function fetchMetadata(cleanUrl: string): Promise<VideoMeta> {
  const args = [
    "-J",
    "--no-playlist",
    "--no-warnings",
    "--no-call-home",
    "--socket-timeout",
    "20",
    cleanUrl,
  ];
  const raw = await runJson(args, 30_000);

  let info: RawInfo;
  try {
    info = JSON.parse(raw) as RawInfo;
  } catch {
    throw new YtDlpError("Could not parse video metadata", "FAILED");
  }

  const formats = info.formats ?? [];
  const videoHeights = formats
    .filter((f) => f.vcodec && f.vcodec !== "none" && f.height)
    .map((f) => f.height as number);
  const hasAudio = formats.some((f) => f.acodec && f.acodec !== "none");
  const maxHeight = videoHeights.length ? Math.max(...videoHeights) : 0;

  let availableQualities: Quality[] = ALL_QUALITIES.filter(
    (q) => QUALITY_HEIGHT[q] <= Math.max(maxHeight, 360)
  );
  if (availableQualities.length === 0) availableQualities = ["360p"];

  const availableFormats: Format[] = hasAudio ? ["MP4", "MP3"] : ["MP4"];

  const thumbnail =
    info.thumbnail ||
    (info.thumbnails && info.thumbnails.length
      ? info.thumbnails[info.thumbnails.length - 1].url
      : null);

  const durationSeconds = Math.round(info.duration ?? 0);

  return {
    url: cleanUrl,
    title: info.title?.trim() || "Untitled video",
    thumbnail,
    duration: formatDuration(durationSeconds),
    durationSeconds,
    uploader:
      info.uploader || info.channel || info.uploader_id || "Unknown creator",
    platform: detectPlatform(cleanUrl),
    availableQualities,
    availableFormats,
    fileSizeEstimate: humanSize(info.filesize_approx),
  };
}

/* --------------------------- download --------------------------- */

function buildDownloadArgs(
  url: string,
  quality: Quality,
  format: Format,
  outTemplate: string
): string[] {
  const common = [
    "--no-playlist",
    "--no-warnings",
    "--no-call-home",
    "--newline",
    "--no-part",
    "--restrict-filenames",
    "--max-filesize",
    config.maxFileSize,
    "--socket-timeout",
    "20",
    "-o",
    outTemplate,
  ];

  if (format === "MP3") {
    return [
      ...common,
      "-f",
      "bestaudio/best",
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      url,
    ];
  }

  const h = QUALITY_HEIGHT[quality];
  return [
    ...common,
    "-f",
    `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${h}][ext=mp4]/best[height<=${h}]`,
    "--merge-output-format",
    "mp4",
    url,
  ];
}

export interface DownloadResult {
  filePath: string;
  fileName: string;
  fileSize: string | null;
}

export interface RunDownloadOptions {
  id: string;
  url: string;
  quality: Quality;
  format: Format;
  onProgress: (progress: number, step: string) => void;
  signal?: AbortSignal;
}

const DOWNLOAD_RE = /\[download\]\s+([\d.]+)%/;

export async function runDownload(
  opts: RunDownloadOptions
): Promise<DownloadResult> {
  const { id, url, quality, format, onProgress, signal } = opts;
  await fs.mkdir(config.storageDir, { recursive: true });
  const outTemplate = path.join(config.storageDir, `${id}.%(ext)s`);
  const args = buildDownloadArgs(url, quality, format, outTemplate);

  onProgress(2, "Analyzing video...");

  await new Promise<void>((resolve, reject) => {
    const child = spawn(config.ytDlpPath, args, { windowsHide: true });
    let stderr = "";
    let tooLarge = false;
    let converting = false;

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new YtDlpError("Download timed out", "TIMEOUT"));
    }, config.downloadTimeoutMs);

    const onAbort = () => {
      child.kill("SIGKILL");
      reject(new YtDlpError("Download cancelled", "FAILED"));
    };
    signal?.addEventListener("abort", onAbort);

    const handleLine = (line: string) => {
      const m = DOWNLOAD_RE.exec(line);
      if (m) {
        const pct = parseFloat(m[1]);
        // Reserve the last 8% for the convert/merge step.
        onProgress(Math.min(92, Math.round(pct * 0.92)), "Downloading...");
      } else if (/\[Merger\]|\[ExtractAudio\]|\[VideoConvertor\]/.test(line)) {
        converting = true;
        onProgress(96, "Converting...");
      }
      if (/File is larger than max-filesize|max-filesize/i.test(line)) {
        tooLarge = true;
      }
    };

    let buf = "";
    const pump = (chunk: Buffer) => {
      buf += chunk.toString();
      const lines = buf.split(/\r|\n/);
      buf = lines.pop() ?? "";
      for (const l of lines) if (l.trim()) handleLine(l);
    };
    child.stdout.on("data", pump);
    child.stderr.on("data", (d) => {
      stderr += d.toString();
      pump(d);
    });

    child.on("error", (e) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? new YtDlpError("yt-dlp is not installed on the server", "NOT_INSTALLED")
          : new YtDlpError(e.message, "FAILED")
      );
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (tooLarge)
        return reject(
          new YtDlpError("Video exceeds the maximum allowed size", "TOO_LARGE")
        );
      if (code === 0) {
        if (!converting) onProgress(96, "Converting...");
        resolve();
      } else {
        reject(
          new YtDlpError(
            stderr.trim().split("\n").slice(-1)[0] || "Download failed",
            "FAILED"
          )
        );
      }
    });
  });

  // Locate the finished file (yt-dlp removes intermediates after merge).
  const wantExt = format === "MP3" ? ".mp3" : ".mp4";
  const entries = await fs.readdir(config.storageDir);
  const candidates = entries.filter((f) => f.startsWith(`${id}.`));
  const chosen =
    candidates.find((f) => f.toLowerCase().endsWith(wantExt)) ?? candidates[0];

  if (!chosen) throw new YtDlpError("Output file was not produced", "FAILED");

  const filePath = path.join(config.storageDir, chosen);
  const stat = await fs.stat(filePath);
  onProgress(100, "Complete");

  return { filePath, fileName: chosen, fileSize: humanSize(stat.size) };
}

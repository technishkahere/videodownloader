import type { PlatformId } from "@/lib/url";
export type { PlatformId } from "@/lib/url";

export type Quality = "360p" | "480p" | "720p" | "1080p";
export type Format = "MP4" | "MP3";
export type DownloadStatus = "PROCESSING" | "COMPLETED" | "FAILED";

/** Metadata returned by POST /api/video-info */
export interface VideoMeta {
  url: string;
  title: string;
  thumbnail: string | null;
  duration: string; // mm:ss
  durationSeconds: number;
  uploader: string;
  platform: PlatformId;
  /** Resolutions actually offered by the source, e.g. ["360p","720p","1080p"]. */
  availableQualities: Quality[];
  /** Formats the server can produce, always ["MP4","MP3"] when audio+video exist. */
  availableFormats: Format[];
  fileSizeEstimate: string | null;
}

/** Live job state from GET /api/download/[id]/status */
export interface JobStatus {
  id: string;
  status: DownloadStatus;
  progress: number; // 0–100
  step: string;
  fileUrl: string | null;
  fileSize: string | null;
  title: string | null;
  error: string | null;
}

/** A row from GET /api/history */
export interface HistoryRecord {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  creator: string | null;
  duration: string | null;
  platform: PlatformId;
  quality: string;
  format: string;
  status: DownloadStatus;
  progress: number;
  fileUrl: string | null;
  fileSize: string | null;
  createdAt: string;
}

/** The signed-in account, as exposed to the client by /api/auth/me. */
export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  plan: "FREE" | "PRO";
  downloadsUsed: number;
  createdAt: string;
}

/** Trial/plan allowance for the current visitor. */
export interface QuotaInfo {
  kind: "guest" | "free" | "pro";
  unlimited: boolean;
  used: number;
  limit: number;
  /** null when unlimited. */
  remaining: number | null;
}

/** Response shape of GET /api/auth/me. */
export interface MeResponse {
  user: SessionUser | null;
  quota: QuotaInfo;
}

export const ALL_QUALITIES: Quality[] = ["360p", "480p", "720p", "1080p"];
export const QUALITY_HEIGHT: Record<Quality, number> = {
  "360p": 360,
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
};

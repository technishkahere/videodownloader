// Pure, dependency-free URL helpers shared by client and server.

export type PlatformId =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "unknown";

/** Hostnames we accept. Anything else is rejected before it ever reaches yt-dlp. */
export const ALLOWED_HOSTS: Record<Exclude<PlatformId, "unknown">, string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"],
  instagram: ["instagram.com", "www.instagram.com"],
  tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com"],
  twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com", "mobile.twitter.com"],
};

const ALL_ALLOWED = Object.values(ALLOWED_HOSTS).flat();

export function detectPlatform(url: string): PlatformId {
  const u = url.toLowerCase().trim();
  if (/(youtube\.com|youtu\.be)/.test(u)) return "youtube";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/(twitter\.com|x\.com)/.test(u)) return "twitter";
  return "unknown";
}

export function isValidUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/\S*)?$/.test(u);
}

export interface SanitizedUrl {
  ok: boolean;
  url?: string;
  platform: PlatformId;
  reason?: string;
}

/**
 * Strict, server-side URL sanitization:
 *  - parses with the WHATWG URL parser
 *  - forces http/https
 *  - checks the host against the allow-list (no SSRF to internal hosts)
 *  - strips credentials / ports
 */
export function sanitizeUrl(raw: unknown): SanitizedUrl {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, platform: "unknown", reason: "Enter a valid video link" };
  }
  let candidate = raw.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, platform: "unknown", reason: "Enter a valid video link" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, platform: "unknown", reason: "Only http(s) links are allowed" };
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALL_ALLOWED.includes(host)) {
    return {
      ok: false,
      platform: "unknown",
      reason: "This platform is not supported",
    };
  }

  // Rebuild a clean URL: drop username/password, keep path + query.
  const clean = `${parsed.protocol}//${host}${parsed.pathname}${parsed.search}`;
  return { ok: true, url: clean, platform: detectPlatform(clean) };
}

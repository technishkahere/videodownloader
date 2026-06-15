import path from "node:path";

/** Centralised, env-driven server configuration & resource limits. */
export const config = {
  // Where finished files are written. Use a persistent volume in production.
  storageDir:
    process.env.STORAGE_DIR ||
    process.env.STORAGE_URL ||
    path.join(process.cwd(), "downloads"),

  // Hard ceiling for a single download (yt-dlp --max-filesize). e.g. "500M".
  maxFileSize: process.env.MAX_FILE_SIZE || "500M",

  // Kill a stuck yt-dlp process after this many ms.
  downloadTimeoutMs: Number(process.env.DOWNLOAD_TIMEOUT_MS || 5 * 60 * 1000),

  // Max concurrent yt-dlp processes across the whole server instance.
  maxConcurrentJobs: Number(process.env.MAX_CONCURRENT_JOBS || 3),

  // Delete finished files this long after completion (ms). 0 = keep.
  fileTtlMs: Number(process.env.FILE_TTL_MS || 60 * 60 * 1000),

  // Rate limiting (per IP).
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000),
    maxRequests: Number(process.env.RATE_LIMIT_MAX || 20),
  },

  // Path to the yt-dlp binary (override if not on PATH).
  ytDlpPath: process.env.YT_DLP_PATH || "yt-dlp",

  // ----- Auth & sessions -----
  // Secret used to sign session / guest cookies (HMAC). MUST be set in prod.
  // A weak fallback keeps local dev working, but the app warns when it's used.
  authSecret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "grably-dev-insecure-secret-change-me",

  // Cookie names for the signed-in session and the anonymous guest identity.
  sessionCookie: process.env.SESSION_COOKIE || "grably_session",
  guestCookie: process.env.GUEST_COOKIE || "grably_guest",

  // How long a login session stays valid (ms). Default 30 days.
  sessionTtlMs: Number(process.env.SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000),

  // Free downloads an anonymous visitor gets before they must sign up.
  trialLimit: Number(process.env.TRIAL_LIMIT || 3),
} as const;

/** True when the signing secret is still the insecure dev fallback. */
export const usingInsecureSecret =
  !process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET;

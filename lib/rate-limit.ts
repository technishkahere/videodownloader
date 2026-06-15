import { config } from "@/lib/config";

/**
 * Lightweight in-memory fixed-window rate limiter (per IP).
 *
 * NOTE: in-memory means per server instance. For multi-instance / serverless
 * deployments, swap the Map for Redis/Upstash — the call sites stay the same.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  max = config.rateLimit.maxRequests,
  windowMs = config.rateLimit.windowMs
): RateResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: max - 1, resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= max;
  return { ok, remaining: Math.max(0, max - existing.count), resetAt: existing.resetAt };
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "anonymous";
}

// Periodically evict stale buckets so the Map can't grow unbounded.
if (typeof setInterval !== "undefined") {
  const t = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }, 5 * 60 * 1000);
  // Don't keep the event loop alive just for cleanup.
  (t as { unref?: () => void }).unref?.();
}

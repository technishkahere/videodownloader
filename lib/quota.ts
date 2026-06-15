import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import type { AuthUser } from "@/lib/auth";

/**
 * Trial / plan metering.
 *
 * Guests (anonymous visitors) get a small free allowance tracked on their
 * Usage row. Signed-in accounts are unlimited. The premium-lock screen on the
 * client keys off `code: "TRIAL_EXCEEDED"` returned by the download route.
 */

export interface QuotaState {
  /** "guest" while anonymous, otherwise the account plan. */
  kind: "guest" | "free" | "pro";
  unlimited: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export class QuotaExceededError extends Error {
  constructor() {
    super("Your free trial is complete. Create an account to keep downloading.");
    this.name = "QuotaExceededError";
  }
}

export function quotaStateFor(user: AuthUser): QuotaState {
  const used = user.usage?.trialDownloadsUsed ?? 0;
  const limit = user.usage?.trialLimit ?? config.trialLimit;

  // Real (signed-in) accounts download without limits.
  if (!user.isGuest) {
    return {
      kind: user.plan === "PRO" ? "pro" : "free",
      unlimited: true,
      used,
      limit,
      remaining: Number.POSITIVE_INFINITY,
    };
  }

  return {
    kind: "guest",
    unlimited: false,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Atomically claim one unit of quota for a download. Throws QuotaExceededError
 * when a guest has used their allowance. No-op (always allowed) for accounts.
 *
 * Uses a conditional updateMany so concurrent requests can't over-spend the
 * allowance: the increment only applies while used < limit.
 */
export async function consumeQuota(user: AuthUser): Promise<void> {
  if (!user.isGuest) return; // unlimited for real accounts

  const limit = user.usage?.trialLimit ?? config.trialLimit;
  const claimed = await prisma.usage.updateMany({
    where: { userId: user.id, trialDownloadsUsed: { lt: limit } },
    data: { trialDownloadsUsed: { increment: 1 } },
  });

  if (claimed.count === 0) throw new QuotaExceededError();
}

/** Roll a consumed unit back (e.g. the job failed to start). Best-effort. */
export async function refundQuota(user: AuthUser): Promise<void> {
  if (!user.isGuest) return;
  await prisma.usage
    .updateMany({
      where: { userId: user.id, trialDownloadsUsed: { gt: 0 } },
      data: { trialDownloadsUsed: { decrement: 1 } },
    })
    .catch(() => {});
}

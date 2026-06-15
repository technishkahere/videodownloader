"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Infinity as InfinityIcon, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

/**
 * Live trial/usage meter. Reads quota from the auth context, so it updates the
 * moment a download is started (the downloader refreshes the session).
 */
export function UsageCard({ className }: { className?: string }) {
  const { user, quota, ready } = useAuth();

  if (!ready || !quota) {
    return (
      <div
        className={cn(
          "h-[7.5rem] animate-pulse rounded-xl border border-border bg-card/60",
          className
        )}
        aria-hidden
      />
    );
  }

  // Signed-in accounts: unlimited.
  if (quota.unlimited) {
    return (
      <div
        className={cn(
          "rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-4",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <InfinityIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Unlimited downloads</p>
            <p className="text-xs text-muted-foreground">
              {user?.plan === "PRO" ? "Pro plan" : "Free account"}
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          {user?.downloadsUsed ?? 0} download
          {(user?.downloadsUsed ?? 0) === 1 ? "" : "s"} completed
        </p>
      </div>
    );
  }

  // Guests: show the trial meter.
  const limit = quota.limit || 1;
  const used = Math.min(quota.used, limit);
  const remaining = quota.remaining ?? Math.max(0, limit - used);
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const depleted = remaining <= 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/60 p-4",
        depleted && "border-amber-500/40 bg-amber-500/5",
        className
      )}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Free trial
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {used}/{limit} used
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            depleted ? "bg-amber-500" : "bg-primary"
          )}
        />
      </div>

      {depleted ? (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">
            Trial complete. Create a free account for unlimited downloads.
          </p>
          <Button asChild size="sm" className="mt-2.5 w-full">
            <Link href="/signup">Create free account</Link>
          </Button>
        </div>
      ) : (
        <p className="mt-2.5 text-xs text-muted-foreground">
          {remaining} free download{remaining === 1 ? "" : "s"} left.{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>{" "}
          for unlimited.
        </p>
      )}
    </div>
  );
}

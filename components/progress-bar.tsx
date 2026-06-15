"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number; // 0 - 100
  status: string;
  complete?: boolean;
  /** Show an animated, percentage-less bar (e.g. while analyzing). */
  indeterminate?: boolean;
}

export function ProgressBar({
  progress,
  status,
  complete,
  indeterminate,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          {complete ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
          {status}
        </span>
        {!indeterminate && (
          <motion.span
            key={Math.round(clamped)}
            className={cn(
              "font-mono text-sm tabular-nums",
              complete ? "text-success" : "text-primary"
            )}
          >
            {Math.round(clamped)}%
          </motion.span>
        )}
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        {indeterminate ? (
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-primary to-violet-400"
            animate={{ left: ["-33%", "100%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              complete
                ? "bg-success"
                : "bg-gradient-to-r from-primary to-violet-400"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          >
            {!complete && (
              <span className="absolute inset-0 shimmer rounded-full" />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PERKS = [
  "Unlimited downloads, no daily caps",
  "Saved history across all your devices",
  "Your personal downloads dashboard",
];

/**
 * Premium lock screen shown when an anonymous visitor exhausts the free trial.
 * Pure UI — the parent decides when to open it (on a TRIAL_EXCEEDED response).
 */
export function TrialLock({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Free trial complete"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="glow relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-7 text-center shadow-2xl"
          >
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[80px]" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative">
              <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Lock className="h-6 w-6" />
              </span>

              <h2 className="text-xl font-semibold tracking-tight">
                Your free trial is complete
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a free account to keep downloading — it only takes a few
                seconds.
              </p>

              <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left">
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-col gap-2.5">
                <Button asChild size="lg" className="w-full">
                  <Link href="/signup?next=/app">Sign up — it&apos;s free</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/login?next=/app">I already have an account</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

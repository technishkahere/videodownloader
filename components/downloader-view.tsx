"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Sparkles } from "lucide-react";
import { DownloaderCard } from "@/components/downloader-card";
import { UsageCard } from "@/components/usage-card";
import { HistoryCard } from "@/components/history-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useDownloads } from "@/components/use-downloads";

export function DownloaderView() {
  const params = useSearchParams();
  const initialUrl = params.get("url") ?? "";

  const { user, ready } = useAuth();
  const loggedIn = ready && !!user;
  const { history, removeItem, retry, refresh } = useDownloads(loggedIn);
  const recent = history.slice(0, 4);

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Downloader
        </h1>
        <p className="mt-1 text-muted-foreground">
          Paste a link to fetch the real video, pick a format, and download the
          file.
        </p>
      </motion.header>

      {/* Usage meter — inline on mobile (the sidebar hides it there). */}
      <UsageCard className="lg:hidden" />

      <DownloaderCard initialUrl={initialUrl} onChange={refresh} />

      {loggedIn ? (
        recent.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Recent downloads</h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/history">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {recent.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onRemove={removeItem}
                  onRetry={retry}
                />
              ))}
            </div>
          </section>
        )
      ) : (
        <SignUpToSave />
      )}
    </div>
  );
}

function SignUpToSave() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/30 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <p className="font-medium">Save your downloads</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a free account to keep a searchable history and download
          without limits.
        </p>
      </div>
      <div className="mt-1 flex gap-2.5">
        <Button asChild size="sm">
          <Link href="/signup?next=/app">Create free account</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/login?next=/app">Log in</Link>
        </Button>
      </div>
    </div>
  );
}

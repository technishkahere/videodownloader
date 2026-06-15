"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Search,
  Trash2,
  Inbox,
  CheckCircle2,
  Loader2,
  XCircle,
  ListFilter,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckItem,
} from "@/components/ui/dropdown-menu";
import { HistoryCard } from "@/components/history-card";
import { useAuth } from "@/components/auth-provider";
import { useDownloads } from "@/components/use-downloads";
import type { DownloadStatus } from "@/lib/types";

type StatusFilter = "All" | DownloadStatus;

const FILTERS: { value: StatusFilter; label: string; icon: React.ElementType }[] = [
  { value: "All", label: "All", icon: ListFilter },
  { value: "COMPLETED", label: "Completed", icon: CheckCircle2 },
  { value: "PROCESSING", label: "Processing", icon: Loader2 },
  { value: "FAILED", label: "Failed", icon: XCircle },
];

export function HistoryView() {
  const { user, ready } = useAuth();
  const loggedIn = ready && !!user;
  const { history, loaded, counts, removeItem, clearAll, retry } =
    useDownloads(loggedIn);

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<StatusFilter>("All");

  const filtered = React.useMemo(() => {
    return history.filter((h) => {
      const matchesQuery =
        !query ||
        h.title.toLowerCase().includes(query.toLowerCase()) ||
        (h.creator ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "All" || h.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [history, query, filter]);

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Download history
        </h1>
        <p className="mt-1 text-muted-foreground">
          Every video you&apos;ve grabbed, searchable and filterable.
        </p>
      </motion.header>

      {!loggedIn ? (
        ready ? (
          <LockedHistory />
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        )
      ) : (
        <>
          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.total, tone: "text-foreground" },
              { label: "Completed", value: counts.COMPLETED, tone: "text-success" },
              { label: "Processing", value: counts.PROCESSING, tone: "text-amber-500" },
              { label: "Failed", value: counts.FAILED, tone: "text-destructive" },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone}`}>
                  {s.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">All downloads</h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="h-10 pl-9"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    aria-label="Filter"
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FILTERS.map((f) => (
                    <DropdownMenuCheckItem
                      key={f.value}
                      checked={filter === f.value}
                      onSelect={() => setFilter(f.value)}
                    >
                      <span className="flex items-center gap-2">
                        <f.icon className="h-4 w-4 text-muted-foreground" />
                        {f.label}
                      </span>
                    </DropdownMenuCheckItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Clear history"
                disabled={history.length === 0}
                onClick={clearAll}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filter !== "All" && (
            <div>
              <button
                onClick={() => setFilter("All")}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
              >
                {FILTERS.find((f) => f.value === filter)?.label}
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {!loaded ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center rounded-xl border border-dashed border-border py-16 text-muted-foreground"
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading history…
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center"
                >
                  <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium">
                    {history.length === 0
                      ? "No downloads yet"
                      : "Nothing matches your filters"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {history.length === 0
                      ? "Paste a video link in the downloader to start."
                      : "Try a different search or status filter."}
                  </p>
                </motion.div>
              ) : (
                filtered.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    onRemove={removeItem}
                    onRetry={retry}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

function LockedHistory() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Lock className="h-5 w-5" />
      </span>
      <div>
        <p className="font-medium">Your history is private</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Sign in to view, search, and manage every download saved to your
          account.
        </p>
      </div>
      <div className="mt-1 flex gap-2.5">
        <Button asChild size="sm">
          <Link href="/signup?next=/app/history">Create free account</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/login?next=/app/history">Log in</Link>
        </Button>
      </div>
    </div>
  );
}

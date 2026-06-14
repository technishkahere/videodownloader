"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
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
import { DownloaderCard } from "@/components/downloader-card";
import { HistoryCard } from "@/components/history-card";
import { useLocalStorage } from "@/lib/use-local-storage";
import { SEED_HISTORY, type HistoryItem } from "@/lib/mock";

type StatusFilter = "All" | "Completed" | "Processing" | "Failed";

const FILTERS: { value: StatusFilter; icon: React.ElementType }[] = [
  { value: "All", icon: ListFilter },
  { value: "Completed", icon: CheckCircle2 },
  { value: "Processing", icon: Loader2 },
  { value: "Failed", icon: XCircle },
];

export function Dashboard() {
  const params = useSearchParams();
  const initialUrl = params.get("url") ?? "";

  const [history, setHistory, hydrated] = useLocalStorage<HistoryItem[]>(
    "grably:history",
    SEED_HISTORY
  );
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<StatusFilter>("All");

  const addToHistory = React.useCallback(
    (item: HistoryItem) => setHistory((prev) => [item, ...prev]),
    [setHistory]
  );

  const removeItem = React.useCallback(
    (id: string) => setHistory((prev) => prev.filter((h) => h.id !== id)),
    [setHistory]
  );

  const filtered = React.useMemo(() => {
    return history.filter((h) => {
      const matchesQuery =
        !query ||
        h.title.toLowerCase().includes(query.toLowerCase()) ||
        h.creator.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "All" || h.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [history, query, filter]);

  const counts = React.useMemo(
    () => ({
      total: history.length,
      Completed: history.filter((h) => h.status === "Completed").length,
      Processing: history.filter((h) => h.status === "Processing").length,
      Failed: history.filter((h) => h.status === "Failed").length,
    }),
    [history]
  );

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Downloader
        </h1>
        <p className="mt-1 text-muted-foreground">
          Paste a link to get started. Everything here is simulated — no files
          are actually downloaded.
        </p>
      </motion.div>

      <DownloaderCard initialUrl={initialUrl} onDownloaded={addToHistory} />

      {/* Stat chips */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total, tone: "text-foreground" },
          { label: "Completed", value: counts.Completed, tone: "text-success" },
          { label: "Processing", value: counts.Processing, tone: "text-amber-500" },
          { label: "Failed", value: counts.Failed, tone: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* History */}
      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Download history</h2>
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
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" aria-label="Filter">
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
                      {f.value}
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
              onClick={() => setHistory([])}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* active filter pill */}
        {filter !== "All" && (
          <div className="mb-3">
            <button
              onClick={() => setFilter("All")}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
            >
              {filter}
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {!hydrated ? null : filtered.length === 0 ? (
              <motion.div
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
                    ? "Your completed downloads will appear here."
                    : "Try a different search or status filter."}
                </p>
              </motion.div>
            ) : (
              filtered.map((item) => (
                <HistoryCard key={item.id} item={item} onRemove={removeItem} />
              ))
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

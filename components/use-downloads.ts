"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  getHistory,
  deleteHistoryItem,
  clearHistory,
  startDownload,
  ApiError,
} from "@/lib/api-client";
import type { HistoryRecord, Quality } from "@/lib/types";
import { ALL_QUALITIES } from "@/lib/types";

/**
 * Shared download-history state: fetch, live-poll while jobs run, and the
 * delete / clear / retry mutations. `enabled` is false for signed-out visitors
 * (the history API is account-only), so the hook stays idle for guests.
 */
export function useDownloads(enabled: boolean) {
  const [history, setHistory] = React.useState<HistoryRecord[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!enabled) {
      setHistory([]);
      setLoaded(true);
      return;
    }
    try {
      setHistory(await getHistory());
    } catch {
      /* keep prior state on transient errors */
    } finally {
      setLoaded(true);
    }
  }, [enabled]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while any job is processing so progress updates live.
  const hasProcessing = history.some((h) => h.status === "PROCESSING");
  React.useEffect(() => {
    if (!enabled || !hasProcessing) return;
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [enabled, hasProcessing, refresh]);

  const removeItem = React.useCallback(
    async (id: string) => {
      setHistory((prev) => prev.filter((h) => h.id !== id)); // optimistic
      try {
        await deleteHistoryItem(id);
      } catch {
        toast.error("Couldn't delete that item");
        refresh();
      }
    },
    [refresh]
  );

  const clearAll = React.useCallback(async () => {
    const prev = history;
    setHistory([]);
    try {
      await clearHistory();
      toast.success("History cleared");
    } catch {
      toast.error("Couldn't clear history");
      setHistory(prev);
    }
  }, [history]);

  const retry = React.useCallback(
    async (item: HistoryRecord) => {
      const format = item.format === "MP3" ? "MP3" : "MP4";
      const quality = (ALL_QUALITIES as string[]).includes(item.quality)
        ? (item.quality as Quality)
        : "720p";
      try {
        await startDownload({
          url: item.url,
          quality,
          format,
          title: item.title,
          thumbnail: item.thumbnail,
          creator: item.creator ?? undefined,
          duration: item.duration ?? undefined,
        });
        toast.success("Retrying download");
        refresh();
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't retry that download"
        );
      }
    },
    [refresh]
  );

  const counts = React.useMemo(
    () => ({
      total: history.length,
      COMPLETED: history.filter((h) => h.status === "COMPLETED").length,
      PROCESSING: history.filter((h) => h.status === "PROCESSING").length,
      FAILED: history.filter((h) => h.status === "FAILED").length,
    }),
    [history]
  );

  return { history, loaded, counts, refresh, removeItem, clearAll, retry };
}

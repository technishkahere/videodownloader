"use client";

import { motion } from "framer-motion";
import { Loader2, Download, RotateCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoThumb } from "@/components/video-thumb";
import { PLATFORMS } from "@/lib/platforms";
import { formatDate } from "@/lib/utils";
import type { HistoryItem } from "@/lib/mock";

const STATUS_VARIANT = {
  Completed: "success",
  Processing: "warning",
  Failed: "destructive",
} as const;

interface HistoryCardProps {
  item: HistoryItem;
  onRemove: (id: string) => void;
}

export function HistoryCard({ item, onRemove }: HistoryCardProps) {
  const platform = PLATFORMS[item.platform] ?? PLATFORMS.unknown;
  const PIcon = platform.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/20"
    >
      <VideoThumb
        gradient={item.thumbGradient}
        className="aspect-video w-24 shrink-0 sm:w-28"
        iconClassName="h-7 w-7"
        rounded="rounded-lg"
      />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <PIcon className={`h-3.5 w-3.5 ${platform.color}`} />
          <span className="truncate text-sm font-medium">{item.title}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{item.creator}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatDate(item.date)}</span>
          <span className="text-border">•</span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-medium">
            {item.quality}
          </span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-medium">
            {item.format}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Badge variant={STATUS_VARIANT[item.status]}>
          {item.status === "Processing" && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {item.status}
        </Badge>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {item.status === "Completed" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Re-download">
              <Download className="h-4 w-4" />
            </Button>
          )}
          {item.status === "Failed" && (
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Retry">
              <RotateCw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label="Remove"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Clock, User, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VideoThumb } from "@/components/video-thumb";
import { PLATFORMS } from "@/lib/platforms";
import { gradientFor } from "@/lib/utils";
import type { VideoMeta } from "@/lib/types";

export function VideoPreview({ info }: { info: VideoMeta }) {
  const platform = PLATFORMS[info.platform] ?? PLATFORMS.unknown;
  const PIcon = platform.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/40 p-4 sm:flex-row"
    >
      <VideoThumb
        gradient={gradientFor(info.url)}
        src={info.thumbnail}
        duration={info.duration}
        className="aspect-video w-full shrink-0 sm:w-52"
        iconClassName="h-12 w-12"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <Badge className={platform.badge}>
            <PIcon className="h-3 w-3" />
            {platform.name}
          </Badge>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {info.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            {info.uploader}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {info.duration}
          </span>
          {info.fileSizeEstimate && (
            <span className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              {info.fileSizeEstimate}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

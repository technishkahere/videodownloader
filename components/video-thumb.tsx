"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbProps {
  gradient: string;
  src?: string | null;
  duration?: string;
  className?: string;
  iconClassName?: string;
  rounded?: string;
}

/**
 * Thumbnail surface. Renders the real upstream thumbnail when `src` is given,
 * with a deterministic gradient as the loading/fallback background.
 */
export function VideoThumb({
  gradient,
  src,
  duration,
  className,
  iconClassName,
  rounded = "rounded-xl",
}: VideoThumbProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [errored, setErrored] = React.useState(false);
  const showImage = !!src && !errored;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        gradient,
        rounded,
        className
      )}
    >
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30",
          iconClassName ?? "h-10 w-10"
        )}
      >
        <Play className="h-1/2 w-1/2 translate-x-[1px] fill-white text-white" />
      </span>
      {duration && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {duration}
        </span>
      )}
    </div>
  );
}

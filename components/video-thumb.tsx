import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbProps {
  gradient: string;
  duration?: string;
  className?: string;
  iconClassName?: string;
  rounded?: string;
}

/** Mock thumbnail: a gradient surface with a play glyph and optional duration chip. */
export function VideoThumb({
  gradient,
  duration,
  className,
  iconClassName,
  rounded = "rounded-xl",
}: VideoThumbProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        gradient,
        rounded,
        className
      )}
    >
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

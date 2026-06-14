"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  Link2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { VideoPreview } from "@/components/video-preview";
import { QualitySelector } from "@/components/quality-selector";
import { ProgressBar } from "@/components/progress-bar";
import {
  detectPlatform,
  isValidUrl,
  PLATFORMS,
  type PlatformId,
} from "@/lib/platforms";
import { mockVideoInfo, type Format, type Quality, type VideoInfo, type HistoryItem } from "@/lib/mock";
import { cn } from "@/lib/utils";

type Phase = "idle" | "analyzing" | "ready" | "downloading" | "complete" | "error";

interface DownloaderCardProps {
  initialUrl?: string;
  onDownloaded?: (item: HistoryItem) => void;
  className?: string;
}

const ANALYZE_STEPS = ["Connecting to source...", "Fetching metadata...", "Analyzing video..."];
const DOWNLOAD_STEPS = ["Preparing download...", "Processing stream...", "Finalizing file..."];

export function DownloaderCard({
  initialUrl = "",
  onDownloaded,
  className,
}: DownloaderCardProps) {
  const [url, setUrl] = React.useState(initialUrl);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [info, setInfo] = React.useState<VideoInfo | null>(null);
  const [quality, setQuality] = React.useState<Quality>("720p");
  const [format, setFormat] = React.useState<Format>("MP4");
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");

  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const interval = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  React.useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const platformId: PlatformId = React.useMemo(
    () => (url.trim() ? detectPlatform(url) : "unknown"),
    [url]
  );
  const platform = PLATFORMS[platformId];
  const PIcon = platform.icon;

  function runProgress(
    steps: string[],
    duration: number,
    onDone: () => void
  ) {
    setProgress(0);
    let p = 0;
    const stepSize = 100 / (steps.length || 1);
    interval.current = setInterval(() => {
      p += Math.random() * 4 + 1.5;
      if (p >= 100) p = 100;
      setProgress(p);
      const idx = Math.min(steps.length - 1, Math.floor(p / stepSize));
      setStatusText(steps[idx]);
      if (p >= 100) {
        if (interval.current) clearInterval(interval.current);
        interval.current = null;
        timers.current.push(setTimeout(onDone, 350));
      }
    }, duration / 45);
  }

  function handleAnalyze(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setErrorMsg("Enter a valid video link");
      setPhase("error");
      toast.error("Enter a valid video link", {
        description: "The URL field is empty.",
      });
      return;
    }
    if (!isValidUrl(trimmed)) {
      setErrorMsg("Enter a valid video link");
      setPhase("error");
      toast.error("That doesn't look like a URL", {
        description: "Check the link and try again.",
      });
      return;
    }
    const detected = detectPlatform(trimmed);
    if (detected === "unknown") {
      setErrorMsg("This platform is not supported");
      setPhase("error");
      toast.error("Unsupported platform", {
        description: "Try a YouTube, Instagram, TikTok, or X link.",
      });
      return;
    }

    setErrorMsg("");
    setPhase("analyzing");
    clearAllTimers();
    runProgress(ANALYZE_STEPS, 1800, () => {
      // 12% simulated failure for realism on a special keyword
      if (/fail|error|broken/i.test(trimmed)) {
        setPhase("error");
        setErrorMsg("Something went wrong. Try again.");
        toast.error("Processing failed", {
          description: "We couldn't analyze that video.",
        });
        return;
      }
      setInfo(mockVideoInfo(trimmed, detected));
      setPhase("ready");
    });
  }

  function handleDownload() {
    if (!info) return;
    setPhase("downloading");
    clearAllTimers();
    runProgress(DOWNLOAD_STEPS, 2600, () => {
      setStatusText("Complete");
      setPhase("complete");
      toast.success("Download complete", {
        description: `${info.title} · ${format === "MP3" ? "MP3" : quality}`,
      });
      onDownloaded?.({
        id: `dl-${Date.now()}`,
        title: info.title,
        creator: info.creator,
        date: new Date().toISOString(),
        quality,
        format,
        platform: info.platform,
        status: "Completed",
        thumbGradient: info.thumbGradient,
      });
    });
  }

  function reset(keepUrl = false) {
    clearAllTimers();
    if (!keepUrl) setUrl("");
    setPhase("idle");
    setInfo(null);
    setProgress(0);
    setStatusText("");
    setErrorMsg("");
  }

  const inputLocked = phase === "analyzing" || phase === "downloading";

  return (
    <Card
      className={cn(
        "glow w-full overflow-hidden p-5 sm:p-7",
        className
      )}
    >
      {/* URL input row */}
      <form onSubmit={handleAnalyze} className="space-y-3">
        <div className="relative flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              disabled={inputLocked}
              onChange={(e) => {
                setUrl(e.target.value);
                if (phase === "error") setPhase("idle");
              }}
              placeholder="Paste your video link here..."
              className={cn(
                "h-12 pl-10 pr-28 text-sm",
                phase === "error" && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {/* live platform badge */}
            <AnimatePresence>
              {url.trim() && platformId !== "unknown" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Badge className={platform.badge}>
                    <PIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{platform.name}</span>
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {phase === "idle" || phase === "error" ? (
            <Button type="submit" size="lg" className="h-12 sm:w-auto">
              <Download className="h-4 w-4" />
              Download
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 sm:w-auto"
              onClick={() => reset(true)}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>

        {/* inline error card */}
        <AnimatePresence>
          {phase === "error" && errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Analyzing progress */}
      <AnimatePresence mode="wait">
        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <ProgressBar progress={progress} status={statusText || "Analyzing video..."} />
          </motion.div>
        )}

        {/* Ready: preview + quality + download */}
        {(phase === "ready" || phase === "downloading" || phase === "complete") &&
          info && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 space-y-6"
            >
              <VideoPreview info={info} />

              {phase === "ready" && (
                <>
                  <QualitySelector
                    quality={quality}
                    format={format}
                    onQualityChange={setQuality}
                    onFormatChange={setFormat}
                  />
                  <Button onClick={handleDownload} size="lg" className="w-full">
                    <Download className="h-4 w-4" />
                    Download {format === "MP3" ? "MP3" : `${quality} MP4`}
                  </Button>
                </>
              )}

              {phase === "downloading" && (
                <ProgressBar
                  progress={progress}
                  status={statusText || "Preparing download..."}
                />
              )}

              {phase === "complete" && (
                <div className="space-y-4">
                  <ProgressBar progress={100} status="Complete" complete />
                  <div className="flex flex-col gap-3 rounded-xl border border-success/30 bg-success/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span>
                        Saved as{" "}
                        <span className="font-medium">
                          {info.title.slice(0, 28)}
                          {info.title.length > 28 ? "…" : ""}.
                          {format.toLowerCase()}
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setPhase("ready")}>
                        Change options
                      </Button>
                      <Button size="sm" onClick={() => reset(false)}>
                        <RotateCcw className="h-4 w-4" />
                        New
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
      </AnimatePresence>
    </Card>
  );
}

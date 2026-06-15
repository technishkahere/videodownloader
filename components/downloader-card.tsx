"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  Link2,
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
import { TrialLock } from "@/components/trial-lock";
import { useAuth } from "@/components/auth-provider";
import {
  detectPlatform,
  isValidUrl,
  PLATFORMS,
  type PlatformId,
} from "@/lib/platforms";
import {
  getVideoInfo,
  startDownload,
  getJobStatus,
  ApiError,
} from "@/lib/api-client";
import type { Format, Quality, VideoMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "analyzing" | "ready" | "downloading" | "complete" | "error";

interface DownloaderCardProps {
  initialUrl?: string;
  /** Called when a job is created or reaches a terminal state, to refresh history. */
  onChange?: () => void;
  className?: string;
}

export function DownloaderCard({
  initialUrl = "",
  onChange,
  className,
}: DownloaderCardProps) {
  const [url, setUrl] = React.useState(initialUrl);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [meta, setMeta] = React.useState<VideoMeta | null>(null);
  const [quality, setQuality] = React.useState<Quality>("720p");
  const [format, setFormat] = React.useState<Format>("MP4");
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [lockOpen, setLockOpen] = React.useState(false);

  const { refresh: refreshAuth } = useAuth();
  const poll = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = React.useCallback(() => {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  }, []);

  React.useEffect(() => () => stopPolling(), [stopPolling]);

  const platformId: PlatformId = React.useMemo(
    () => (url.trim() ? detectPlatform(url) : "unknown"),
    [url]
  );
  const platform = PLATFORMS[platformId];
  const PIcon = platform.icon;

  async function handleAnalyze(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = url.trim();

    // Instant client-side guards for snappy UX (server re-validates anyway).
    if (!trimmed) return fail("Enter a valid video link", "The URL field is empty.");
    if (!isValidUrl(trimmed))
      return fail("Enter a valid video link", "Check the link and try again.");
    if (detectPlatform(trimmed) === "unknown")
      return fail(
        "This platform is not supported",
        "Try a YouTube, Instagram, TikTok, or X link."
      );

    setErrorMsg("");
    setPhase("analyzing");
    setProgress(0);
    setStatusText("Analyzing video...");

    try {
      const info = await getVideoInfo(trimmed);
      setMeta(info);
      // Pick a sensible default quality from what's actually available.
      const preferred: Quality = info.availableQualities.includes("720p")
        ? "720p"
        : info.availableQualities[info.availableQualities.length - 1] ?? "360p";
      setQuality(preferred);
      setFormat(info.availableFormats[0] ?? "MP4");
      setPhase("ready");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      fail(message);
    }
  }

  function fail(message: string, description?: string) {
    stopPolling();
    setErrorMsg(message);
    setPhase("error");
    toast.error(message, description ? { description } : undefined);
  }

  async function handleDownload() {
    if (!meta) return;
    setPhase("downloading");
    setProgress(0);
    setStatusText("Starting...");
    setFileUrl(null);

    let id: string;
    try {
      const res = await startDownload({
        url: meta.url,
        quality,
        format,
        title: meta.title,
        thumbnail: meta.thumbnail,
        creator: meta.uploader,
        duration: meta.duration,
      });
      id = res.id;
      refreshAuth(); // a trial download was just consumed — update the meter
      onChange?.(); // surface the PROCESSING row in history immediately
    } catch (err) {
      // Free trial exhausted → show the premium lock instead of an error.
      if (err instanceof ApiError && err.code === "TRIAL_EXCEEDED") {
        setPhase("ready");
        setProgress(0);
        setStatusText("");
        setLockOpen(true);
        refreshAuth();
        return;
      }
      return fail(
        err instanceof ApiError ? err.message : "Could not start the download."
      );
    }

    // Poll the job status until it reaches a terminal state.
    poll.current = setInterval(async () => {
      try {
        const s = await getJobStatus(id);
        setProgress(s.progress);
        setStatusText(s.step || "Processing...");

        if (s.status === "COMPLETED") {
          stopPolling();
          setProgress(100);
          setStatusText("Complete");
          setFileUrl(s.fileUrl);
          setPhase("complete");
          toast.success("Download ready", {
            description: `${meta.title.slice(0, 40)}${
              meta.title.length > 40 ? "…" : ""
            }`,
          });
          onChange?.();
          refreshAuth();
        } else if (s.status === "FAILED") {
          stopPolling();
          fail(s.error || "Something went wrong. Try again.");
          onChange?.();
        }
      } catch (err) {
        stopPolling();
        fail(
          err instanceof ApiError ? err.message : "Lost connection to the server."
        );
      }
    }, 1000);
  }

  function reset(keepUrl = false) {
    stopPolling();
    if (!keepUrl) setUrl("");
    setPhase("idle");
    setMeta(null);
    setProgress(0);
    setStatusText("");
    setErrorMsg("");
    setFileUrl(null);
  }

  const inputLocked = phase === "analyzing" || phase === "downloading";

  return (
    <>
    <Card className={cn("glow w-full overflow-hidden p-5 sm:p-7", className)}>
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
                phase === "error" &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            />
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

      <AnimatePresence mode="wait">
        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <ProgressBar progress={progress} status={statusText || "Analyzing video..."} indeterminate />
          </motion.div>
        )}

        {(phase === "ready" || phase === "downloading" || phase === "complete") &&
          meta && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 space-y-6"
            >
              <VideoPreview info={meta} />

              {phase === "ready" && (
                <>
                  <QualitySelector
                    quality={quality}
                    format={format}
                    onQualityChange={setQuality}
                    onFormatChange={setFormat}
                    availableQualities={meta.availableQualities}
                    availableFormats={meta.availableFormats}
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
                      <span>Your file is ready to download.</span>
                    </div>
                    <div className="flex gap-2">
                      {fileUrl && (
                        <Button asChild size="sm">
                          <a href={fileUrl} download>
                            <Download className="h-4 w-4" />
                            Save file
                          </a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => reset(false)}>
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
    <TrialLock open={lockOpen} onClose={() => setLockOpen(false)} />
    </>
  );
}

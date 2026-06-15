"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Film, Music, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { Format, Quality } from "@/lib/types";

const QUALITY_META: Record<Quality, { note: string }> = {
  "360p": { note: "Data saver" },
  "480p": { note: "Standard" },
  "720p": { note: "HD" },
  "1080p": { note: "Full HD" },
};
const ORDER: Quality[] = ["360p", "480p", "720p", "1080p"];

interface QualitySelectorProps {
  quality: Quality;
  format: Format;
  onQualityChange: (q: Quality) => void;
  onFormatChange: (f: Format) => void;
  /** Resolutions the source actually offers. Others render disabled. */
  availableQualities?: Quality[];
  availableFormats?: Format[];
}

export function QualitySelector({
  quality,
  format,
  onQualityChange,
  onFormatChange,
  availableQualities = ORDER,
  availableFormats = ["MP4", "MP3"],
}: QualitySelectorProps) {
  const isAudio = format === "MP3";
  const qSet = new Set(availableQualities);

  return (
    <div className="space-y-5">
      {/* Format toggle */}
      <div>
        <p className="mb-2 text-sm font-medium">Format</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "MP4", label: "MP4 · Video", icon: Film },
              { value: "MP3", label: "MP3 · Audio", icon: Music },
            ] as const
          ).map((f) => {
            const active = format === f.value;
            const disabled = !availableFormats.includes(f.value);
            return (
              <button
                key={f.value}
                type="button"
                disabled={disabled}
                onClick={() => onFormatChange(f.value)}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                  active
                    ? "border-primary bg-accent/60 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-accent/30",
                  disabled && "cursor-not-allowed opacity-40 hover:border-border hover:bg-transparent"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{f.label}</span>
                {active && (
                  <motion.span
                    layoutId="format-check"
                    className="absolute right-3 top-3 text-primary"
                  >
                    <Check className="h-4 w-4" />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality radio cards */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Quality</p>
          {isAudio && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Audio uses best available bitrate
            </span>
          )}
        </div>
        <RadioGroup
          value={quality}
          onValueChange={(v) => onQualityChange(v as Quality)}
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-4",
            isAudio && "pointer-events-none select-none opacity-50"
          )}
        >
          {ORDER.map((q) => {
            const supported = qSet.has(q);
            const active = quality === q && !isAudio;
            return (
              <label
                key={q}
                htmlFor={`q-${q}`}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-all",
                  active
                    ? "border-primary bg-accent/60 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-accent/30",
                  !supported &&
                    "pointer-events-none cursor-not-allowed opacity-40 hover:border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{q}</span>
                  <RadioGroupItem
                    value={q}
                    id={`q-${q}`}
                    disabled={!supported}
                    className="h-4 w-4"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {supported ? QUALITY_META[q].note : "Unavailable"}
                </span>
              </label>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}

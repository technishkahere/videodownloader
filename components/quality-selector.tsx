"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Film, Music, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { Format, Quality } from "@/lib/mock";

const QUALITIES: { value: Quality; label: string; note: string; size: string }[] = [
  { value: "360p", label: "360p", note: "Data saver", size: "~12 MB" },
  { value: "480p", label: "480p", note: "Standard", size: "~24 MB" },
  { value: "720p", label: "720p", note: "HD", size: "~48 MB" },
  { value: "1080p", label: "1080p", note: "Full HD", size: "~96 MB" },
];

interface QualitySelectorProps {
  quality: Quality;
  format: Format;
  onQualityChange: (q: Quality) => void;
  onFormatChange: (f: Format) => void;
}

export function QualitySelector({
  quality,
  format,
  onQualityChange,
  onFormatChange,
}: QualitySelectorProps) {
  const isAudio = format === "MP3";

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
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onFormatChange(f.value)}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                  active
                    ? "border-primary bg-accent/60 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-accent/30"
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
          {QUALITIES.map((q) => {
            const active = quality === q.value && !isAudio;
            return (
              <label
                key={q.value}
                htmlFor={`q-${q.value}`}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-all",
                  active
                    ? "border-primary bg-accent/60 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-accent/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{q.label}</span>
                  <RadioGroupItem
                    value={q.value}
                    id={`q-${q.value}`}
                    className="h-4 w-4"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{q.note}</span>
                <span className="text-[11px] font-medium text-muted-foreground/80">
                  {q.size}
                </span>
              </label>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}

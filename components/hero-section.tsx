"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Link2, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_PLATFORMS } from "@/lib/platforms";

export function HeroSection() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const q = url.trim() ? `?url=${encodeURIComponent(url.trim())}` : "";
    router.push(`/app${q}`);
  }

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="container relative pb-16 pt-20 sm:pb-24 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Now supporting 4 platforms · No sign-up required
          </span>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Download any video,{" "}
            <span className="text-gradient animate-gradient-pan">beautifully</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Paste a link from YouTube, Instagram, TikTok or X and grab it in the
            quality and format you want — fast, clean, and private.
          </p>

          {/* Hero URL input */}
          <motion.form
            onSubmit={go}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your video link here..."
                className="h-12 pl-10"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 shrink-0">
              Download
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" /> Instant processing
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Privacy-first
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Up to 1080p · MP4 & MP3
            </span>
          </div>

          {/* platform pills */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            {SUPPORTED_PLATFORMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-2 text-sm backdrop-blur"
                >
                  <Icon className={`h-4 w-4 ${p.color}`} />
                  {p.name}
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

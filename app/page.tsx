"use client";

import Link from "next/link";
import {
  Zap,
  MousePointerClick,
  FileVideo,
  SlidersHorizontal,
  ShieldCheck,
  Infinity as InfinityIcon,
  ClipboardPaste,
  ListChecks,
  DownloadCloud,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { FeatureCard } from "@/components/feature-card";
import { FAQAccordion } from "@/components/faq-accordion";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast processing",
    description:
      "Links are analyzed and prepared in seconds. No queues, no waiting around, no friction.",
  },
  {
    icon: MousePointerClick,
    title: "Simple interface",
    description:
      "Paste, pick, download. A developer-grade UI that stays out of your way and just works.",
  },
  {
    icon: FileVideo,
    title: "Multiple formats",
    description:
      "Save full-quality MP4 video or extract crisp MP3 audio from any supported link.",
  },
  {
    icon: SlidersHorizontal,
    title: "Quality selection",
    description:
      "Choose exactly what you need — from data-saving 360p up to sharp 1080p Full HD.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy focused",
    description:
      "Your history lives only in your browser. Nothing is tracked, stored, or shared.",
  },
  {
    icon: InfinityIcon,
    title: "No limits, no sign-up",
    description:
      "Start instantly. No account, no credit card, no daily caps to slow you down.",
  },
];

const STEPS = [
  {
    icon: ClipboardPaste,
    title: "Paste URL",
    description:
      "Copy a link from YouTube, Instagram, TikTok or X and drop it into the input. We detect the platform automatically.",
  },
  {
    icon: ListChecks,
    title: "Choose format",
    description:
      "Pick MP4 or MP3 and select your preferred quality. We show you the estimated file size before you commit.",
  },
  {
    icon: DownloadCloud,
    title: "Download",
    description:
      "Hit download and watch the progress in real time. Your file is ready in moments — and saved to your history.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />

        {/* Features */}
        <section id="features" className="container scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-sm font-medium text-primary">Features</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to grab video
            </h2>
            <p className="mt-3 text-muted-foreground">
              A premium toolkit wrapped in a clean, minimal interface that feels
              right at home next to your favorite developer tools.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} index={i} {...f} />
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-border bg-card/30 py-20 sm:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="mb-2 text-sm font-medium text-primary">How it works</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Three steps. That&apos;s it.
              </h2>
            </div>
            <div className="relative grid gap-8 md:grid-cols-3">
              <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
              {STEPS.map((s, i) => (
                <div key={s.title} className="relative text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                    <s.icon className="h-6 w-6 text-primary" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <p className="mb-2 text-sm font-medium text-primary">FAQ</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>
            <FAQAccordion />
          </div>
        </section>

        {/* CTA */}
        <section className="container pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[100px]" />
            <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to grab your first video?
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
              Jump into the app — no account needed. It only takes a few seconds.
            </p>
            <div className="relative mt-7 flex justify-center">
              <Button asChild size="lg">
                <Link href="/app">
                  Open the downloader
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

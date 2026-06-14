# Grably — Premium Video Downloader UI

A polished, **frontend-only** SaaS prototype for a video downloader, inspired by the design language of Linear, Vercel, Stripe, and Notion. Every action — platform detection, analysis, progress, downloads, history — is **simulated with frontend state and mock data**. There is no backend, no API, and no real downloading.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with custom design tokens (light/dark)
- **shadcn/ui-style** primitives (built on Radix UI)
- **Framer Motion** for animations
- **next-themes** for persisted dark/light mode
- **sonner** for toast notifications
- **lucide-react** icons

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Routes

- `/` — Landing page: hero with live URL input, features, how-it-works, FAQ, CTA, footer.
- `/app` — Dashboard: the downloader, stats, and a searchable/filterable download history.

## What's simulated

- **Platform detection** from the pasted URL (YouTube, Instagram, TikTok, Twitter/X).
- **Mock metadata** (title, creator, duration, file size, thumbnail) derived deterministically from the URL.
- **Multi-stage progress** for "Analyzing…" and "Downloading…" using frontend timers.
- **Download states**: default → processing → complete → error.
- **Error handling**: empty input, invalid URL, unsupported platform, and a simulated failure (paste a link containing `fail`, `error`, or `broken` to trigger it).
- **History** persisted in `localStorage`, with search, status filter, and clear.
- **Theme** persisted in `localStorage` with a smooth transition.

## Component structure

```
components/
  navbar.tsx          theme-toggle.tsx     theme-provider.tsx
  hero-section.tsx    downloader-card.tsx  video-preview.tsx
  quality-selector.tsx progress-bar.tsx    history-card.tsx
  feature-card.tsx    faq-accordion.tsx    footer.tsx
  dashboard.tsx       video-thumb.tsx      toaster.tsx
  ui/                 (button, card, input, badge, radio-group,
                       dropdown-menu, accordion)
lib/
  platforms.tsx  mock.ts  use-local-storage.ts  utils.ts
```

> Note: This is a UI demo. No videos are downloaded. Please respect creators'
> rights and each platform's terms of service.

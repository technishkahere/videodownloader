# Grably — Full-Stack Video Downloader

A production-style video downloader SaaS. Paste a YouTube / Instagram / TikTok / X
link, fetch real metadata with **yt-dlp**, pick a quality and format, and download
the actual file. Built on **Next.js (App Router)**, **TypeScript**, **Tailwind**,
**Prisma**, and **PostgreSQL**, with the original premium UI kept intact.

> The frontend was previously a mock prototype. It is now wired to a real backend:
> no simulated timers, no fake history — everything runs through real API routes,
> a real yt-dlp process, and a real database.

## Architecture

```
Browser (React/Tailwind UI)
   │  fetch()
   ▼
Next.js API routes  (app/api/*, Node runtime)
   │
   ├── lib/url.ts        URL sanitization + allow-listed hosts (anti-SSRF)
   ├── lib/ytdlp.ts      spawns yt-dlp: metadata + download, progress parsing
   ├── lib/jobs.ts       in-memory job state, concurrency, DB sync, file TTL
   ├── lib/rate-limit.ts per-IP fixed-window limiter
   ├── lib/auth.ts       scrypt passwords + signed-cookie sessions + guest identity
   ├── lib/quota.ts      free-trial metering (guests limited, accounts unlimited)
   └── Prisma  ──►  PostgreSQL   (users, usage, video_downloads)
                    │
                    ▼
              STORAGE_DIR (temporary files, auto-deleted after FILE_TTL_MS)
```

### API routes

| Method | Route | Purpose |
| ------ | ----- | ------- |
| POST | `/api/video-info` | Validate URL, detect platform, return real metadata (title, thumbnail, duration, uploader, available qualities/formats). |
| POST | `/api/download` | Create a download job, start yt-dlp, return `{ id }` (202). |
| GET | `/api/download/[id]/status` | Live status: `PROCESSING / COMPLETED / FAILED`, progress %, current step, file URL. |
| GET | `/api/download/[id]/file` | Stream the finished file (`Content-Disposition: attachment`). |
| GET | `/api/history` | The signed-in user's downloads (account-only). |
| DELETE | `/api/history` | Clear all history (+ remove files). |
| DELETE | `/api/history/[id]` | Delete one item (+ remove file). |
| POST | `/api/auth/signup` | Create an account (upgrades the guest in place). |
| POST | `/api/auth/login` | Email + password sign-in. |
| POST | `/api/auth/logout` | Clear the session cookie. |
| GET | `/api/auth/me` | Current account + trial/usage allowance. |
| PATCH | `/api/account` | Update profile (display name). |
| DELETE | `/api/account` | Delete the account, downloads, and files. |

### Database (Prisma → PostgreSQL)

- **`User`** — `id, email?, name?, passwordHash?, plan, isGuest, downloadsUsed,
  createdAt`. Anonymous trial visitors are real rows with `isGuest = true`; on
  sign-up the guest is **upgraded in place** so trial downloads become account
  history.
- **`Usage`** — `id, userId, trialDownloadsUsed, trialLimit, timestamps`. The
  per-user trial counter; guests are gated by it, accounts are unlimited.
- **`VideoDownload`** — `id, userId, url, title, thumbnail, creator, duration,
  platform, quality, format, status, progress, step, fileUrl, fileSize, error,
  timestamps`. Every attempt is persisted through `PROCESSING → COMPLETED / FAILED`.

## Prerequisites

- **Node 20+**
- **PostgreSQL 14+** (local, or Neon / Supabase / Railway / RDS)
- **yt-dlp** and **ffmpeg** on the host (ffmpeg is needed to merge video+audio and to produce MP3)

```bash
# macOS
brew install yt-dlp ffmpeg
# Debian/Ubuntu
sudo apt-get install -y ffmpeg && sudo curl -L \
  https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
  -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp
```

## Local setup

```bash
npm install                 # installs deps + runs `prisma generate`
cp .env.example .env        # set DATABASE_URL and AUTH_SECRET (openssl rand -base64 48)
npm run db:push             # create the tables
npm run dev                 # http://localhost:3000
```

Open `/app`, paste a link, and download. If yt-dlp/ffmpeg aren't installed the API
responds with a clear `503` and the UI shows an error instead of crashing.

## Security & resource protection

Implemented and configurable via env: WHATWG-URL parsing with an **allow-list of
hosts** (blocks unsupported domains and SSRF to internal addresses), **Zod** body
validation, **per-IP rate limiting**, **`--max-filesize`** ceiling, **download
timeout** (kills stuck processes), **max concurrent jobs** (queued beyond the
limit), **temporary storage with automatic TTL deletion**, path-traversal-safe
file serving, and control-character sanitization of stored display strings.

On the auth side: **scrypt-hashed passwords** (never stored in plaintext),
**HMAC-signed httpOnly/SameSite session cookies**, generic "invalid email or
password" responses (no account enumeration), **rate-limited** login/signup
endpoints, atomic trial-quota claims that can't be raced past the limit, and
hardening response headers (`X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`) from `middleware.ts`.

## Authentication & free trial

Self-contained email + password auth with **zero external dependencies** — Node's
`crypto` does scrypt password hashing and HMAC-signs a stateless session cookie
(`lib/auth.ts`). No OAuth keys or third-party provider to configure; just set
`AUTH_SECRET`.

**Free trial.** Anonymous visitors get a signed *guest* identity (a real `User`
row with `isGuest = true`) and **3 free downloads** (`TRIAL_LIMIT`), metered on
their `Usage` row. On the next attempt the API returns `402` with
`code: "TRIAL_EXCEEDED"` and the UI shows a premium lock screen. When a guest
signs up, their row is upgraded in place — trial downloads carry into the new
account as history. Signed-in accounts are unlimited.

**Protected vs. public.** The downloader and trial work with no account. History,
the account page, and per-user files are authorized server-side via the signed
session cookie (`requireAuthUser` / `getCurrentActor`). `middleware.ts` adds
hardening headers; it does not gate routes, since authorization lives in the
handlers. Flow: `lib/auth.ts` (sessions/passwords/guests), `lib/quota.ts`
(metering), `components/auth-provider.tsx` (client session state).

## Deployment

**Database** — any managed PostgreSQL; set `DATABASE_URL` and run
`npm run db:deploy`.

**App (recommended: a Node host that allows binaries)** — Render, Railway, Fly.io,
or a VM. A `Dockerfile` is included that bundles **ffmpeg + yt-dlp** and runs the
Next.js standalone server:

```bash
docker build -t grably .
docker run -p 3000:3000 --env-file .env -v grably_dl:/app/downloads grably
```

**Vercel note.** Vercel can host the frontend and light API routes, but its
serverless functions can't run the long-lived `yt-dlp`/`ffmpeg` processes or keep
local files. For real downloads, run the app (or just the download routes) on a
Node host as above. The code is structured so the yt-dlp layer (`lib/ytdlp.ts`)
can also be split into a separate Python/Node worker service without touching the
UI — the API contract stays the same.

## Storage

Files are written to `STORAGE_DIR` and **auto-deleted** after `FILE_TTL_MS`
(default 1 hour). A startup sweep also removes stale files left by restarts.
Nothing is stored permanently. For multi-instance setups, point `STORAGE_DIR` at a
shared volume or adapt `lib/storage.ts` to S3/R2.

## Scripts

`npm run dev` · `npm run build` (runs `prisma generate`) · `npm run start` ·
`npm run db:push` · `npm run db:migrate` · `npm run db:deploy` · `npm run db:studio`

---

Respect creators' rights and each platform's Terms of Service. This project is for
personal/educational use; you are responsible for how you use it.

import type { PlatformId } from "./platforms";

export interface VideoInfo {
  title: string;
  creator: string;
  duration: string;
  platform: PlatformId;
  fileSize: string;
  thumbGradient: string;
}

export type Quality = "360p" | "480p" | "720p" | "1080p";
export type Format = "MP4" | "MP3";

export interface HistoryItem {
  id: string;
  title: string;
  creator: string;
  date: string;
  quality: Quality;
  format: Format;
  platform: PlatformId;
  status: "Completed" | "Processing" | "Failed";
  thumbGradient: string;
}

const GRADIENTS = [
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-rose-500 via-pink-500 to-orange-400",
  "from-sky-500 via-cyan-500 to-emerald-400",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-indigo-500 via-blue-500 to-cyan-400",
  "from-emerald-500 via-teal-500 to-sky-500",
];

export function gradientFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const TITLES: Record<PlatformId, { title: string; creator: string }[]> = {
  youtube: [
    { title: "Building a Design System from Scratch", creator: "Vercel" },
    { title: "The Future of Web Performance in 2026", creator: "Fireship" },
    { title: "I Rebuilt My Studio in 48 Hours", creator: "Peter McKinnon" },
  ],
  instagram: [
    { title: "Sunset timelapse over the coast", creator: "@wander.frames" },
    { title: "3 minimal desk setup ideas", creator: "@deskscape" },
  ],
  tiktok: [
    { title: "POV: shipping on a Friday 🚀", creator: "@devlife" },
    { title: "60s pasta everyone's making", creator: "@quickbites" },
  ],
  twitter: [
    { title: "Thread: how we scaled to 1M users", creator: "@startuplog" },
    { title: "Live demo of our new editor", creator: "@buildinpublic" },
  ],
  unknown: [{ title: "Untitled video", creator: "Unknown creator" }],
};

const DURATIONS = ["0:42", "1:18", "3:05", "8:21", "12:47", "0:58"];
const SIZES = ["6.2 MB", "18.4 MB", "42.9 MB", "94.1 MB", "128 MB"];

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

/** Deterministic-ish mock metadata derived from the URL so previews feel real. */
export function mockVideoInfo(url: string, platform: PlatformId): VideoInfo {
  let seed = 0;
  for (let i = 0; i < url.length; i++) seed = (seed + url.charCodeAt(i)) >>> 0;
  const pool = TITLES[platform] ?? TITLES.unknown;
  const meta = pick(pool, seed);
  return {
    title: meta.title,
    creator: meta.creator,
    duration: pick(DURATIONS, seed),
    platform,
    fileSize: pick(SIZES, seed >> 2),
    thumbGradient: gradientFor(url),
  };
}

export const SEED_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    title: "Building a Design System from Scratch",
    creator: "Vercel",
    date: "2026-06-12T10:24:00Z",
    quality: "1080p",
    format: "MP4",
    platform: "youtube",
    status: "Completed",
    thumbGradient: gradientFor("h1seed"),
  },
  {
    id: "h2",
    title: "Sunset timelapse over the coast",
    creator: "@wander.frames",
    date: "2026-06-11T18:02:00Z",
    quality: "720p",
    format: "MP4",
    platform: "instagram",
    status: "Completed",
    thumbGradient: gradientFor("h2seed"),
  },
  {
    id: "h3",
    title: "POV: shipping on a Friday 🚀",
    creator: "@devlife",
    date: "2026-06-10T09:15:00Z",
    quality: "480p",
    format: "MP3",
    platform: "tiktok",
    status: "Processing",
    thumbGradient: gradientFor("h3seed"),
  },
  {
    id: "h4",
    title: "Thread: how we scaled to 1M users",
    creator: "@startuplog",
    date: "2026-06-08T14:48:00Z",
    quality: "720p",
    format: "MP4",
    platform: "twitter",
    status: "Failed",
    thumbGradient: gradientFor("h4seed"),
  },
];

import { Youtube, Instagram, Music2, Twitter, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PlatformId = "youtube" | "instagram" | "tiktok" | "twitter" | "unknown";

export interface Platform {
  id: PlatformId;
  name: string;
  icon: LucideIcon;
  /** Tailwind classes for the badge accent */
  color: string;
  badge: string;
}

export const PLATFORMS: Record<PlatformId, Platform> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "text-red-500",
    badge: "bg-red-500/10 text-red-500 ring-red-500/20",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    badge: "bg-pink-500/10 text-pink-500 ring-pink-500/20",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    color: "text-foreground",
    badge: "bg-foreground/10 text-foreground ring-foreground/20",
  },
  twitter: {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    color: "text-sky-500",
    badge: "bg-sky-500/10 text-sky-500 ring-sky-500/20",
  },
  unknown: {
    id: "unknown",
    name: "Unknown",
    icon: Globe,
    color: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground ring-border",
  },
};

export const SUPPORTED_PLATFORMS = [
  PLATFORMS.youtube,
  PLATFORMS.instagram,
  PLATFORMS.tiktok,
  PLATFORMS.twitter,
];

/** Lightweight, purely-frontend URL detection. */
export function detectPlatform(url: string): PlatformId {
  const u = url.toLowerCase().trim();
  if (/(youtube\.com|youtu\.be)/.test(u)) return "youtube";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/(twitter\.com|x\.com)/.test(u)) return "twitter";
  return "unknown";
}

export function isValidUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  // Accept things that at least look like a URL
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/\S*)?$/.test(u);
}

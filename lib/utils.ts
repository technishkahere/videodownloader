import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const GRADIENTS = [
  "from-violet-500 via-purple-500 to-fuchsia-500",
  "from-rose-500 via-pink-500 to-orange-400",
  "from-sky-500 via-cyan-500 to-emerald-400",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-indigo-500 via-blue-500 to-cyan-400",
  "from-emerald-500 via-teal-500 to-sky-500",
];

/** Deterministic gradient used as a thumbnail fallback when no image exists. */
export function gradientFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

import { NextResponse } from "next/server";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorJson(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Remove ASCII control characters (0x00–0x1F and 0x7F). */
function stripControlChars(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code > 31 && code !== 127) out += ch;
  }
  return out;
}

/** Clamp untrusted display strings before persisting them. */
export function sanitizeText(value: unknown, max = 300): string | null {
  if (typeof value !== "string") return null;
  const trimmed = stripControlChars(value).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** Only allow http(s) thumbnail URLs from the upstream platforms. */
export function sanitizeThumbnail(value: unknown): string | null {
  const s = sanitizeText(value, 2048);
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? s : null;
  } catch {
    return null;
  }
}

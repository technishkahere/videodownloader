import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight edge middleware.
 *
 * The app is intentionally public: anonymous visitors can use the free trial,
 * and every protected resource (history, account, files) is authorized
 * server-side in the route handlers via the signed session cookie. So rather
 * than gate routes here, middleware just attaches a few hardening headers.
 */
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

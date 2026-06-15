import { json } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  destroySession();
  return json({ ok: true });
}

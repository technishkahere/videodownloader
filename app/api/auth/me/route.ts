import { json } from "@/lib/api";
import { getAuthUser, getCurrentActor, publicUser } from "@/lib/auth";
import { quotaStateFor } from "@/lib/quota";
import { config } from "@/lib/config";
import type { MeResponse, QuotaInfo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toQuotaInfo(state: ReturnType<typeof quotaStateFor>): QuotaInfo {
  return {
    kind: state.kind,
    unlimited: state.unlimited,
    used: state.used,
    limit: state.limit,
    remaining: state.unlimited ? null : state.remaining,
  };
}

/** Current account + trial allowance. Drives the navbar and usage card. */
export async function GET(): Promise<Response> {
  const authed = await getAuthUser();
  if (authed) {
    const body: MeResponse = {
      user: publicUser(authed),
      quota: toQuotaInfo(quotaStateFor(authed)),
    };
    return json(body);
  }

  // Anonymous: report the guest's trial usage (or a fresh allowance).
  const guest = await getCurrentActor();
  const quota: QuotaInfo = guest
    ? toQuotaInfo(quotaStateFor(guest))
    : {
        kind: "guest",
        unlimited: false,
        used: 0,
        limit: config.trialLimit,
        remaining: config.trialLimit,
      };

  const body: MeResponse = { user: null, quota };
  return json(body);
}

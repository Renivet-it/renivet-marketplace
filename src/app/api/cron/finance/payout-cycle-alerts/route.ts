import { runPayoutCycleAlerts } from "@/lib/finance/payouts";
import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth/cron-access";

export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const result = await runPayoutCycleAlerts("cron");
    return NextResponse.json(result);
}

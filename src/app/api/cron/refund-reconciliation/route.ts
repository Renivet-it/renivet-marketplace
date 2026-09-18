import { runRefundReconciliation } from "@/lib/finance/refund-reconciliation";
import { requireCronSecret } from "@/lib/auth/cron-access";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const orderIds = req.nextUrl.searchParams.getAll("orderId");
    const result = await runRefundReconciliation({
        actorId: "cron",
        orderIds: orderIds.length ? orderIds : undefined,
    });

    return NextResponse.json({
        ok: true,
        data: {
            checked: result.results.length,
            mismatches: result.mismatches.length,
            results: result.results,
        },
    });
}

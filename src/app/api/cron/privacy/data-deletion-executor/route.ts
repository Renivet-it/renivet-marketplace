import { executeDeletionRequest } from "@/lib/finance/dpdp";
import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth/cron-access";

export async function POST(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const requestId = body.requestId as string | undefined;
    if (!requestId) {
        return NextResponse.json({ ok: false, error: "requestId is required" }, { status: 400 });
    }

    const updated = await executeDeletionRequest(requestId, "cron");
    return NextResponse.json({ ok: true, data: updated });
}

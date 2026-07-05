import { executeDeletionRequest } from "@/lib/finance/dpdp";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return process.env.NODE_ENV !== "production";

    const authHeader = req.headers.get("authorization");
    const querySecret = req.nextUrl.searchParams.get("secret");
    return authHeader === `Bearer ${secret}` || querySecret === secret;
}

export async function POST(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestId = body.requestId as string | undefined;
    if (!requestId) {
        return NextResponse.json({ ok: false, error: "requestId is required" }, { status: 400 });
    }

    const updated = await executeDeletionRequest(requestId, "cron");
    return NextResponse.json({ ok: true, data: updated });
}

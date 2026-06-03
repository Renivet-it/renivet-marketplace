import { monitoringSlaQueries } from "@/lib/db/queries";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return process.env.NODE_ENV !== "production";

    const authHeader = req.headers.get("authorization");
    const querySecret = req.nextUrl.searchParams.get("secret");
    return authHeader === `Bearer ${secret}` || querySecret === secret;
}

export async function GET(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const run = await monitoringSlaQueries.runSlaCheck("cron");
        return NextResponse.json({
            ok: true,
            data: {
                runKey: run.runKey,
                status: run.status,
                checkedCount: Number(run.checkedCount),
                breachCount: Number(run.breachCount),
                finishedAt: run.finishedAt,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown SLA check error",
            },
            { status: 500 }
        );
    }
}

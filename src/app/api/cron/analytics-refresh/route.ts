import { env } from "@/../env";
import { refreshSnapshots } from "@/lib/reports/admin-analytics-advanced";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest) {
    const secret = env.ANALYTICS_CRON_SECRET;
    if (!secret) return true;

    const headerSecret = request.headers.get("x-cron-secret");
    return headerSecret === secret;
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                ok: false,
                error: "Unauthorized",
            },
            { status: 401 }
        );
    }

    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    try {
        const result = await refreshSnapshots({
            startDate,
            endDate,
            timezone: "Asia/Kolkata",
            currency: "INR",
        });

        return NextResponse.json({
            ok: true,
            message: "Analytics snapshots refreshed",
            data: result,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

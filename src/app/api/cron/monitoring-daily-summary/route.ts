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

    const snapshot = await monitoringSlaQueries.saveDailySnapshot("cron");
    await monitoringSlaQueries.createAlert({
        type: "daily_health_summary",
        severity: "info",
        entityType: "daily_health_snapshot",
        entityId: snapshot.snapshotDate,
        title: "Daily health summary generated",
        message: `Daily health is ${snapshot.status}. Snapshot ${snapshot.snapshotDate} is available in Monitoring/SLA.`,
        ownerId: "cron",
        ownerRole: "all_team",
        channels: ["admin", "email", "whatsapp"],
        dedupeKey: `daily-health-summary:${snapshot.snapshotDate}`,
        metadata: { metrics: snapshot.metrics },
    });

    return NextResponse.json({ ok: true, data: snapshot });
}

import { monitoringSlaQueries } from "@/lib/db/queries";
import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth/cron-access";

export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

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

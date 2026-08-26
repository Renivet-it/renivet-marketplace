import { monitoringSlaQueries } from "@/lib/db/queries";
import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth/cron-access";

export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const pack = await monitoringSlaQueries.generateWeeklyPack("cron");
    await monitoringSlaQueries.createAlert({
        type: "weekly_compliance_review_summary",
        severity: "info",
        entityType: "weekly_reporting_pack",
        entityId: pack.id,
        title: "Weekly compliance review summary generated",
        message: `Weekly pack ${pack.weekStart} to ${pack.weekEnd} is ready for review.`,
        ownerId: "cron",
        ownerRole: "all_team",
        channels: ["admin", "email", "whatsapp"],
        dedupeKey: `weekly-compliance-summary:${pack.weekStart}:${pack.weekEnd}`,
        metadata: {
            weekStart: pack.weekStart,
            weekEnd: pack.weekEnd,
            actionItems: pack.actionItems,
        },
    });

    return NextResponse.json({ ok: true, data: pack });
}

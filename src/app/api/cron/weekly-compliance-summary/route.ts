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

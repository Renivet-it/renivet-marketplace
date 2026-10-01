import { requireCronSecret } from "@/lib/auth/cron-access";
import { runDelayedWhatsAppAlertsFromDatabase } from "@/lib/services/delayed-whatsapp-alerts";
import { NextRequest, NextResponse } from "next/server";

/**
 * Daily delayed fulfillment digest.
 * External scheduler: 0 17 * * * UTC (23:00 Asia/Kolkata).
 */
export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const startedAt = new Date();

    try {
        const result = await runDelayedWhatsAppAlertsFromDatabase(startedAt);

        return NextResponse.json({
            ok: true,
            startedAt,
            timezone: "Asia/Kolkata",
            schedule: "0 17 * * * UTC",
            ...result,
        });
    } catch (error) {
        console.error("Delayed WhatsApp alert cron failed", error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

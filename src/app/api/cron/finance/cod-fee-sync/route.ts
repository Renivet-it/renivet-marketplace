import { syncCarrierFeeSchedule } from "@/lib/finance/cod";
import { requireCronSecret } from "@/lib/auth/cron-access";
import { NextRequest, NextResponse } from "next/server";

/**
 * COD Fee Sync Cron Job
 * Trigger this via your scheduler with the configured CRON_SECRET.
 *
 * Suggested schedule: every Monday at 9:00 AM IST
 */
export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    try {
        console.log("COD Fee Sync Cron Job Started");
        console.log(
            "Triggered at:",
            new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );

        const result = await syncCarrierFeeSchedule("cron");

        console.log("COD Fee Sync Cron Job Completed Successfully");
        return NextResponse.json({
            ok: true,
            ...result,
        });
    } catch (error) {
        console.error("COD Fee Sync Cron Job Error:", error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

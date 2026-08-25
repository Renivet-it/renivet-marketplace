import { runTdsFinancialYearRollover } from "@/lib/finance/tds";
import { requireCronSecret } from "@/lib/auth/cron-access";
import { NextRequest, NextResponse } from "next/server";

/**
 * TDS FY Rollover Cron Job
 * Trigger this via your scheduler with the configured CRON_SECRET.
 *
 * Suggested schedule: April 1 at 12:05 AM IST
 */
export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    try {
        console.log("TDS FY Rollover Cron Job Started");
        console.log(
            "Triggered at:",
            new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );

        const result = await runTdsFinancialYearRollover("cron");

        console.log("TDS FY Rollover Cron Job Completed Successfully");
        return NextResponse.json({
            ok: true,
            ...result,
        });
    } catch (error) {
        console.error("TDS FY Rollover Cron Job Error:", error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

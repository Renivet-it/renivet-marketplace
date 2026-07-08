import { runTdsFinancialYearRollover } from "@/lib/finance/tds";
import { NextResponse } from "next/server";

/**
 * TDS FY Rollover Cron Job
 * Trigger this via your scheduler without a secret, same pattern as other finance cron jobs.
 *
 * Suggested schedule: April 1 at 12:05 AM IST
 */
export async function GET() {
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

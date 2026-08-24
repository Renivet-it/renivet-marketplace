import { sendDailyOrderSummary } from "@/actions/send-daily-order-summary";
import { requireCronSecret } from "@/lib/auth/cron-access";
import { NextRequest, NextResponse } from "next/server";

/**
 * Daily Order Summary Cron Job
 * This endpoint should be triggered daily at 10 PM IST via an external cron service
 * (e.g., cron-job.org, Vercel Cron, etc.)
 *
 * Schedule: 0 22 * * * (10 PM IST daily)
 * Converts to UTC: 0 16 30 * * * (4:30 PM UTC, which is 10 PM IST)
 */
export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    try {
        console.log("🔔 Daily Order Summary Cron Job Started");
        console.log(
            "⏰ Triggered at:",
            new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        );

        const result = await sendDailyOrderSummary();

        if (result.success) {
            console.log(
                "✅ Daily Order Summary Cron Job Completed Successfully"
            );
            return NextResponse.json({
                ok: true,
                message: result.message,
                data: {
                    orderCount: result.count,
                    recipientCount: result.recipients,
                },
            });
        } else {
            console.error(
                "❌ Daily Order Summary Cron Job Failed:",
                result.error
            );
            return NextResponse.json(
                {
                    ok: false,
                    error: result.error,
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Daily Order Summary Cron Job Error:", error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

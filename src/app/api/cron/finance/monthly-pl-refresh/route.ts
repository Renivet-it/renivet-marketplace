import { refreshMonthlyPl } from "@/lib/finance/pl";
import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/auth/cron-access";

function getMonthKey(date: Date) {
    return date.toISOString().slice(0, 7);
}

export async function GET(req: NextRequest) {
    const denied = requireCronSecret(req);
    if (denied) return denied;

    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const months = [getMonthKey(previous), getMonthKey(now)];

    const results = await Promise.all(
        months.map(async (monthKey) => ({
            monthKey,
            result: await refreshMonthlyPl(monthKey, "cron"),
        }))
    );

    return NextResponse.json({
        ok: true,
        refreshedMonths: months,
        results,
    });
}

import { refreshMonthlyPl } from "@/lib/finance/pl";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return process.env.NODE_ENV !== "production";

    const authHeader = req.headers.get("authorization");
    const querySecret = req.nextUrl.searchParams.get("secret");
    return authHeader === `Bearer ${secret}` || querySecret === secret;
}

function getMonthKey(date: Date) {
    return date.toISOString().slice(0, 7);
}

export async function GET(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

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

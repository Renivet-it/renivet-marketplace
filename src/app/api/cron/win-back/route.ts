import { db } from "@/lib/db";
import { marketingAutomationRuns, orders, users } from "@/lib/db/schema";
import {
    buildUnsubscribeUrl,
    sendMarketingEmail,
    upsertAutomationRun,
} from "@/lib/marketing/email";
import WinBackEmail from "@/lib/resend/emails/win-back";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET() {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const monthKey = new Date().toISOString().slice(0, 7);

    const rows = await db
        .select({
            userId: users.id,
            email: users.email,
            firstName: users.firstName,
            lastOrderAt: sql<Date>`max(${orders.createdAt})`,
        })
        .from(users)
        .innerJoin(orders, eq(orders.userId, users.id))
        .groupBy(users.id, users.email, users.firstName)
        .orderBy(desc(sql`max(${orders.createdAt})`));

    let eligible = 0;
    let sent = 0;
    let skipped = 0;

    for (const row of rows) {
        if (!row.lastOrderAt || new Date(row.lastOrderAt) > cutoff) continue;

        const automationKey = `win_back:${row.userId}:${monthKey}`;
        const existing = await db.query.marketingAutomationRuns.findFirst({
            where: eq(marketingAutomationRuns.automationKey, automationKey),
        });

        if (existing?.status === "sent") {
            skipped += 1;
            continue;
        }

        eligible += 1;
        const unsubscribeUrl = await buildUnsubscribeUrl(row.email);
        const result = await sendMarketingEmail({
            email: row.email,
            firstName: row.firstName,
            name: row.firstName,
            subject: "We miss you at Renivet",
            emailContent:
                "It has been a while since your last Renivet order. Explore what's new.",
            campaignType: "win_back",
            automationKey,
            stepNumber: 1,
            source: "win_back",
            react: React.createElement(WinBackEmail, {
                firstName: row.firstName,
                ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shop`,
                unsubscribeUrl,
            }),
            metadata: {
                lastOrderAt: new Date(row.lastOrderAt).toISOString(),
            },
        });

        await upsertAutomationRun({
            automationType: "win_back",
            automationKey,
            email: row.email,
            userId: row.userId,
            subscriberId: result.log.subscriberId ?? null,
            stepNumber: 1,
            status: result.ok ? "sent" : "skipped",
            error: result.ok ? null : result.log.error,
            metadata: {
                lastOrderAt: new Date(row.lastOrderAt).toISOString(),
            },
            sentAt: result.ok ? new Date() : null,
        });

        if (result.ok) sent += 1;
        else skipped += 1;
    }

    return NextResponse.json({ ok: true, eligible, sent, skipped });
}

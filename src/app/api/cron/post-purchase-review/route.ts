import { db } from "@/lib/db";
import {
    marketingAutomationRuns,
    orders,
    orderShipments,
    users,
} from "@/lib/db/schema";
import {
    buildUnsubscribeUrl,
    sendMarketingEmail,
    upsertAutomationRun,
} from "@/lib/marketing/email";
import PostPurchaseReviewEmail from "@/lib/resend/emails/post-purchase-review";
import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import React from "react";

export const dynamic = "force-dynamic";

export async function GET() {
    const threshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const rows = await db
        .select({
            orderId: orders.id,
            userId: users.id,
            email: users.email,
            firstName: users.firstName,
        })
        .from(orderShipments)
        .innerJoin(orders, eq(orderShipments.orderId, orders.id))
        .innerJoin(users, eq(orders.userId, users.id))
        .where(
            and(
                eq(orderShipments.status, "delivered"),
                lte(orderShipments.updatedAt, threshold)
            )
        );

    let eligible = 0;
    let sent = 0;
    let skipped = 0;

    for (const row of rows) {
        const automationKey = `post_purchase_review:${row.orderId}`;
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
            subject: "How was your Renivet order?",
            emailContent: "We'd love to hear how your order experience went.",
            campaignType: "post_purchase_review",
            automationKey,
            stepNumber: 1,
            source: "post_purchase_review",
            react: React.createElement(PostPurchaseReviewEmail, {
                firstName: row.firstName,
                reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile/orders`,
                unsubscribeUrl,
            }),
            metadata: {
                orderId: row.orderId,
            },
        });

        await upsertAutomationRun({
            automationType: "post_purchase_review",
            automationKey,
            email: row.email,
            userId: row.userId,
            subscriberId: result.log.subscriberId ?? null,
            stepNumber: 1,
            status: result.ok ? "sent" : "skipped",
            error: result.ok ? null : result.log.error,
            metadata: { orderId: row.orderId },
            sentAt: result.ok ? new Date() : null,
        });

        if (result.ok) sent += 1;
        else skipped += 1;
    }

    return NextResponse.json({ ok: true, eligible, sent, skipped });
}

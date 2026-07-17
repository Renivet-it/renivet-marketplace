import { couponQueries } from "@/lib/db/queries";
import { db } from "@/lib/db";
import {
    carts,
    marketingAutomationRuns,
    orders,
    users,
} from "@/lib/db/schema";
import {
    buildUnsubscribeUrl,
    sendMarketingEmail,
    upsertAutomationRun,
} from "@/lib/marketing/email";
import AbandonedCartEmail from "@/lib/resend/emails/abandoned-cart-email";
import { generateId } from "@/lib/utils";
import { and, eq, getTableColumns, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import React from "react";

export const dynamic = "force-dynamic";

const STEPS = [
    { step: 1, delayHours: 2 },
    { step: 2, delayHours: 26 },
    { step: 3, delayHours: 74 },
] as const;

function buildCartSignature(
    items: Array<{ id: string; productId: string; variantId: string | null; updatedAt: Date }>
) {
    return items
        .map(
            (item) =>
                `${item.id}:${item.productId}:${item.variantId ?? "none"}:${item.updatedAt.toISOString()}`
        )
        .sort()
        .join("|");
}

export async function GET() {
    const activeCarts = await db
        .select({
            ...getTableColumns(carts),
            userEmail: users.email,
            userFirstName: users.firstName,
        })
        .from(carts)
        .innerJoin(users, eq(carts.userId, users.id))
        .where(eq(carts.status, true));

    const grouped = activeCarts.reduce(
        (acc, cart) => {
            const key = cart.userId;
            if (!acc[key]) {
                acc[key] = {
                    userId: cart.userId,
                    email: cart.userEmail,
                    firstName: cart.userFirstName,
                    items: [] as typeof activeCarts,
                };
            }
            acc[key].items.push(cart);
            return acc;
        },
        {} as Record<
            string,
            {
                userId: string;
                email: string;
                firstName: string;
                items: typeof activeCarts;
            }
        >
    );

    let eligible = 0;
    let sent = 0;
    let skipped = 0;
    let stoppedAfterPurchase = 0;

    for (const group of Object.values(grouped)) {
        const lastUpdatedAt = new Date(
            Math.max(...group.items.map((item) => new Date(item.updatedAt).getTime()))
        );
        const cartSignature = buildCartSignature(
            group.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId ?? null,
                updatedAt: new Date(item.updatedAt),
            }))
        );
        const cartSnapshotKey = `${group.userId}:${cartSignature}`;
        const existingPurchase = await db.query.orders.findFirst({
            where: and(
                eq(orders.userId, group.userId),
                eq(orders.paymentStatus, "paid"),
                gte(orders.createdAt, lastUpdatedAt)
            ),
        });

        if (existingPurchase) {
            stoppedAfterPurchase += 1;
            continue;
        }

        for (const step of STEPS) {
            const sendAt = new Date(
                lastUpdatedAt.getTime() + step.delayHours * 60 * 60 * 1000
            );
            if (sendAt > new Date()) continue;

            const automationKey = `abandoned_cart:${cartSnapshotKey}:step${step.step}`;
            const existingRun = await db.query.marketingAutomationRuns.findFirst({
                where: eq(marketingAutomationRuns.automationKey, automationKey),
            });
            if (existingRun?.status === "sent" || existingRun?.status === "stopped") {
                skipped += 1;
                continue;
            }

            if (step.step > 1) {
                const previousKey = `abandoned_cart:${cartSnapshotKey}:step${step.step - 1}`;
                const previousRun = await db.query.marketingAutomationRuns.findFirst({
                    where: eq(marketingAutomationRuns.automationKey, previousKey),
                });
                if (previousRun?.status !== "sent") {
                    skipped += 1;
                    continue;
                }
            }

            eligible += 1;

            let couponCode: string | null = null;
            if (step.step === 3) {
                couponCode =
                    (existingRun?.metadata?.couponCode as string | undefined) ?? null;
                if (!couponCode) {
                    const coupon = await couponQueries.createCoupon({
                        code: generateId({ casing: "upper", length: 10 }),
                        description: "Recovered cart incentive",
                        discountType: "fixed",
                        discountValue: 100,
                        minOrderAmount: 0,
                        maxDiscountAmount: 100,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        maxUses: 1,
                        categoryId: null,
                        subCategoryId: null,
                        productTypeId: null,
                    });
                    couponCode = coupon.code;
                }
            }

            const unsubscribeUrl = await buildUnsubscribeUrl(group.email);
            const result = await sendMarketingEmail({
                email: group.email,
                firstName: group.firstName,
                name: group.firstName,
                subject:
                    step.step === 3
                        ? "Last chance to recover your Renivet cart"
                        : `You left ${group.items.length} item${group.items.length > 1 ? "s" : ""} behind`,
                emailContent:
                    step.step === 3
                        ? "A small incentive is waiting in your cart if you're still thinking it over."
                        : "Your cart is still waiting for you at Renivet.",
                campaignType: "abandoned_cart",
                automationKey,
                stepNumber: step.step,
                source: "abandoned_cart",
                react: React.createElement(AbandonedCartEmail, {
                    customerName: group.firstName,
                    checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/mycart`,
                    unsubscribeUrl,
                    headline:
                        step.step === 2
                            ? `Still thinking it over, ${group.firstName}?`
                            : step.step === 3
                              ? `Last chance to recover your cart, ${group.firstName}`
                              : undefined,
                    body:
                        step.step === 2
                            ? "Your Renivet cart is still here if you want to come back and finish the order."
                            : step.step === 3
                              ? "We saved your cart for one more nudge. Use the coupon below before it expires."
                              : undefined,
                    couponCode,
                }),
                metadata: {
                    cartSnapshotKey,
                    itemCount: group.items.length,
                    couponCode,
                },
            });

            await upsertAutomationRun({
                automationType: "abandoned_cart",
                automationKey,
                email: group.email,
                userId: group.userId,
                subscriberId: result.log.subscriberId ?? null,
                stepNumber: step.step,
                status: result.ok ? "sent" : "skipped",
                error: result.ok ? null : result.log.error,
                metadata: {
                    cartSnapshotKey,
                    itemCount: group.items.length,
                    couponCode,
                },
                sentAt: result.ok ? new Date() : null,
            });

            if (result.ok) sent += 1;
            else skipped += 1;
        }
    }

    return NextResponse.json({
        ok: true,
        eligible,
        sent,
        skipped,
        stopped_after_purchase: stoppedAfterPurchase,
    });
}

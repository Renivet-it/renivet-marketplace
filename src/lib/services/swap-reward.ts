import { env } from "@/../env";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { orderQueries, swapRewardQueries } from "@/lib/db/queries";
import {
    notifications,
    orderReturnRequests,
    orderShipments,
    orders,
    refunds,
    rewardRedemptions,
    swapRewardEvents,
    userSwapRewards,
} from "@/lib/db/schema";
import { posthog } from "@/lib/posthog/client";
import { resend } from "@/lib/resend";
import {
    SwapRewardRedeemedEmail,
    SwapRewardStampEarnedEmail,
    SwapRewardUnlockedEmail,
} from "@/lib/resend/emails";
import { userCache } from "@/lib/redis/methods";
import { sendPlainWhatsAppMessage } from "@/lib/whatsapp";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";

const REWARD_STAMP_TARGET = 5;
const REWARD_PRICE_CAP_PAISE = 1499 * 100;

function buildProfileHref() {
    return "/profile";
}

function buildRewardCheckoutHref(redemptionId: string) {
    return `/checkout?swap_reward=true&redemption=${redemptionId}`;
}

async function runSideEffect(task: () => Promise<unknown>) {
    try {
        await task();
    } catch (error) {
        console.error("swap reward side effect failed", error);
    }
}

function formatIndianPhone(phone: string | null | undefined) {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("91") && cleaned.length === 12) return `+${cleaned}`;
    if (cleaned.length === 10) return `+91${cleaned}`;

    return null;
}

type HistoricalRewardOrder = {
    userId: string;
    orderId: string;
    deliveredAt: Date | string;
    orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    paymentStatus:
        | "pending"
        | "paid"
        | "failed"
        | "refund_pending"
        | "refunded"
        | "refund_failed";
    shouldRevoke: boolean;
    revokeReason: "refund_processed" | "return_completed" | "order_cancelled";
};

type HistoricalRewardUserState = {
    totalStampCount: number;
    currentCycleStampCount: number;
    rewardStatus: "locked" | "unlocked" | "redeemed";
    unlockedAt: string | null;
    redeemedAt: string | null;
    totalRewardsEarned: number;
    activeRewardCycle: number;
    lastStampOrderId: string | null;
};

const INITIAL_HISTORICAL_STATE: HistoricalRewardUserState = {
    totalStampCount: 0,
    currentCycleStampCount: 0,
    rewardStatus: "locked",
    unlockedAt: null,
    redeemedAt: null,
    totalRewardsEarned: 0,
    activeRewardCycle: 1,
    lastStampOrderId: null,
};

function cloneHistoricalState(): HistoricalRewardUserState {
    return {
        ...INITIAL_HISTORICAL_STATE,
    };
}

function toIsoTimestamp(value: Date | string) {
    if (value instanceof Date) {
        return value.toISOString();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid historical delivery timestamp: ${String(value)}`);
    }

    return parsed.toISOString();
}

async function createInAppNotification(input: {
    recipientId: string;
    type: string;
    title: string;
    body: string;
    href?: string;
    metadata?: Record<string, unknown>;
}) {
    await db.insert(notifications).values({
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        metadata: input.metadata ?? null,
    });
}

async function notifyStampEarned(input: {
    userId: string;
    orderId: string;
    stampCount: number;
}) {
    const user = await userCache.get(input.userId);
    if (!user) return;

    const body = `You now have ${input.stampCount} out of 5 stamps. Keep swapping to unlock your reward.`;

    await createInAppNotification({
        recipientId: user.id,
        type: "swap_reward.stamp_earned",
        title: "You've earned a new Renivet Stamp",
        body,
        href: buildProfileHref(),
        metadata: {
            orderId: input.orderId,
            stampCount: input.stampCount,
        },
    });

    await resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to: user.email,
        subject: "You've earned a new Renivet Stamp",
        react: SwapRewardStampEarnedEmail({
            firstName: user.firstName,
            stampCount: input.stampCount,
        }),
    });

    const phone = formatIndianPhone(user.phone);
    if (phone) {
        await sendPlainWhatsAppMessage({
            recipientPhoneNumber: phone,
            message: `You earned a new Renivet stamp. You now have ${input.stampCount} out of 5 stamps. Keep swapping to unlock your reward.`,
        });
    }
}

async function notifyRewardUnlocked(input: {
    userId: string;
    rewardCycle: number;
}) {
    const user = await userCache.get(input.userId);
    if (!user) return;

    const body =
        "You've completed 5 swaps and unlocked a free product worth up to Rs. 1,499.";

    await createInAppNotification({
        recipientId: user.id,
        type: "swap_reward.unlocked",
        title: "Your Renivet Reward is Ready",
        body,
        href: buildProfileHref(),
        metadata: {
            rewardCycle: input.rewardCycle,
        },
    });

    await resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to: user.email,
        subject: "Your Renivet Reward is Ready",
        react: SwapRewardUnlockedEmail({
            firstName: user.firstName,
        }),
    });

    const phone = formatIndianPhone(user.phone);
    if (phone) {
        await sendPlainWhatsAppMessage({
            recipientPhoneNumber: phone,
            message:
                "Your Renivet reward is ready. You completed 5 swaps and unlocked a free product worth up to Rs. 1,499.",
        });
    }
}

async function notifyRewardRedeemed(input: {
    userId: string;
    productTitle: string;
}) {
    const user = await userCache.get(input.userId);
    if (!user) return;

    await createInAppNotification({
        recipientId: user.id,
        type: "swap_reward.redeemed",
        title: "Reward redeemed successfully",
        body: `Your reward order for ${input.productTitle} has been placed successfully.`,
        href: "/profile/orders",
        metadata: {
            productTitle: input.productTitle,
        },
    });

    await resend.emails.send({
        from: env.RESEND_EMAIL_FROM,
        to: user.email,
        subject: "Your Renivet reward has been redeemed",
        react: SwapRewardRedeemedEmail({
            firstName: user.firstName,
            productTitle: input.productTitle,
        }),
    });
}

class SwapRewardService {
    async getStatus(userId: string) {
        return swapRewardQueries.getOrCreateUserReward(userId);
    }

    async earnStampForOrder(orderId: string) {
        const order = await orderQueries.getOrderById(orderId);
        if (!order || order.status !== "delivered" || order.isSwapRewardOrder) {
            return null;
        }

        const existingEarnEvent = await swapRewardQueries.getRewardEventByOrder(
            order.userId,
            order.id,
            "stamp_earned"
        );
        if (existingEarnEvent) {
            return swapRewardQueries.getOrCreateUserReward(order.userId);
        }

        const state = await swapRewardQueries.getOrCreateUserReward(order.userId);

        if (state.rewardStatus === "unlocked") {
            return state;
        }

        const nextCycleCount = Math.min(
            REWARD_STAMP_TARGET,
            state.currentCycleStampCount + 1
        );
        const nextStatus =
            nextCycleCount >= REWARD_STAMP_TARGET ? "unlocked" : "locked";
        const nowIso = new Date().toISOString();

        await swapRewardQueries.createRewardEvent({
            userId: order.userId,
            orderId: order.id,
            rewardCycle: state.activeRewardCycle,
            type: "stamp_earned",
            stampDelta: 1,
            metadata: {
                orderStatus: order.status,
            },
        });

        const updated = await swapRewardQueries.updateUserReward(order.userId, {
            totalStampCount: state.totalStampCount + 1,
            currentCycleStampCount: nextCycleCount,
            rewardStatus:
                state.rewardStatus === "redeemed" && nextStatus === "locked"
                    ? "locked"
                    : nextStatus,
            unlockedAt: nextStatus === "unlocked" ? nowIso : state.unlockedAt,
            lastStampOrderId: order.id,
        });

        posthog.capture({
            distinctId: order.userId,
            event: POSTHOG_EVENTS.SWAP_REWARD.STAMP_EARNED,
            properties: {
                orderId: order.id,
                stampCount: updated.currentCycleStampCount,
                rewardCycle: updated.activeRewardCycle,
            },
        });

        await runSideEffect(() =>
            notifyStampEarned({
                userId: order.userId,
                orderId: order.id,
                stampCount: updated.currentCycleStampCount,
            })
        );

        if (updated.rewardStatus === "unlocked") {
            await swapRewardQueries.createRewardEvent({
                userId: order.userId,
                orderId: order.id,
                rewardCycle: updated.activeRewardCycle,
                type: "reward_unlocked",
                stampDelta: 0,
                metadata: {
                    threshold: REWARD_STAMP_TARGET,
                },
            });

            posthog.capture({
                distinctId: order.userId,
                event: POSTHOG_EVENTS.SWAP_REWARD.REWARD_UNLOCKED,
                properties: {
                    orderId: order.id,
                    rewardCycle: updated.activeRewardCycle,
                },
            });

            await runSideEffect(() =>
                notifyRewardUnlocked({
                    userId: order.userId,
                    rewardCycle: updated.activeRewardCycle,
                })
            );
        }

        return updated;
    }

    async revokeStampForOrder(orderId: string, reason: string) {
        const order = await orderQueries.getOrderById(orderId);
        if (!order) return null;

        const earnedEvent = await swapRewardQueries.getRewardEventByOrder(
            order.userId,
            order.id,
            "stamp_earned"
        );
        if (!earnedEvent) {
            return swapRewardQueries.getOrCreateUserReward(order.userId);
        }

        const revokeEvent = await swapRewardQueries.getRewardEventByOrder(
            order.userId,
            order.id,
            "stamp_revoked"
        );
        if (revokeEvent) {
            return swapRewardQueries.getOrCreateUserReward(order.userId);
        }

        const state = await swapRewardQueries.getOrCreateUserReward(order.userId);

        if (earnedEvent.rewardCycle < state.activeRewardCycle) {
            return state;
        }

        await swapRewardQueries.createRewardEvent({
            userId: order.userId,
            orderId: order.id,
            rewardCycle: earnedEvent.rewardCycle,
            type: "stamp_revoked",
            stampDelta: -1,
            metadata: {
                reason,
            },
        });

        const nextCycleCount = Math.max(0, state.currentCycleStampCount - 1);
        const shouldRelock =
            state.rewardStatus === "unlocked" &&
            earnedEvent.rewardCycle === state.activeRewardCycle &&
            nextCycleCount < REWARD_STAMP_TARGET;

        const updated = await swapRewardQueries.updateUserReward(order.userId, {
            totalStampCount: Math.max(0, state.totalStampCount - 1),
            currentCycleStampCount: nextCycleCount,
            rewardStatus: shouldRelock ? "locked" : state.rewardStatus,
            unlockedAt: shouldRelock ? null : state.unlockedAt,
        });

        if (shouldRelock) {
            await swapRewardQueries.createRewardEvent({
                userId: order.userId,
                orderId: order.id,
                rewardCycle: earnedEvent.rewardCycle,
                type: "reward_relocked",
                stampDelta: 0,
                metadata: {
                    reason,
                },
            });
        }

        posthog.capture({
            distinctId: order.userId,
            event: POSTHOG_EVENTS.SWAP_REWARD.STAMP_REVOKED,
            properties: {
                orderId: order.id,
                reason,
                rewardCycle: earnedEvent.rewardCycle,
            },
        });

        return updated;
    }

    async listEligibleRewardProducts(search?: string) {
        return swapRewardQueries.listEligibleRewardProducts(search);
    }

    async prepareRewardRedemption(input: {
        userId: string;
        productId: string;
        variantId?: string;
    }) {
        const state = await swapRewardQueries.getOrCreateUserReward(input.userId);
        if (state.rewardStatus !== "unlocked") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Reward is not unlocked yet",
            });
        }

        const selection = await swapRewardQueries.getEligibleRewardSelection({
            productId: input.productId,
            variantId: input.variantId,
        });
        if (!selection) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Selected reward is not eligible",
            });
        }

        const existing = await swapRewardQueries.getRewardRedemptionByUserCycle(
            input.userId,
            state.activeRewardCycle
        );
        if (existing?.status === "completed") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This reward has already been redeemed",
            });
        }

        const redemption = existing
            ? await db
                  .update(rewardRedemptions)
                  .set({
                      productId: selection.product.id,
                      variantId: selection.variant?.id ?? null,
                      rewardValue: selection.rewardValue,
                      updatedAt: new Date(),
                  })
                  .where(eq(rewardRedemptions.id, existing.id))
                  .returning()
                  .then((rows) => rows[0])
            : await swapRewardQueries.createRewardRedemption({
                  userId: input.userId,
                  productId: selection.product.id,
                  variantId: selection.variant?.id ?? null,
                  rewardCycle: state.activeRewardCycle,
                  rewardValue: selection.rewardValue,
                  status: "initiated",
              });

        return {
            redemptionId: redemption.id,
            checkoutHref: buildRewardCheckoutHref(redemption.id),
        };
    }

    async getRewardCheckoutSelection(userId: string, redemptionId: string) {
        const state = await swapRewardQueries.getOrCreateUserReward(userId);
        const redemption = await db.query.rewardRedemptions.findFirst({
            where: and(
                eq(rewardRedemptions.id, redemptionId),
                eq(rewardRedemptions.userId, userId)
            ),
        });

        if (!redemption) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Reward checkout session not found",
            });
        }

        if (redemption.status === "completed") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Reward already redeemed",
            });
        }

        const selection = await swapRewardQueries.getEligibleRewardSelection({
            productId: redemption.productId,
            variantId: redemption.variantId ?? undefined,
        });
        if (!selection) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Selected reward is no longer eligible",
            });
        }

        return {
            state,
            redemption,
            selection,
        };
    }

    async completeRewardRedemption(input: {
        userId: string;
        redemptionId: string;
        orderId: string;
    }) {
        const checkoutSelection = await this.getRewardCheckoutSelection(
            input.userId,
            input.redemptionId
        );

        const state = await swapRewardQueries.getOrCreateUserReward(input.userId);
        if (state.rewardStatus !== "unlocked") {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Reward is no longer unlocked",
            });
        }

        await swapRewardQueries.completeRewardRedemption(input.redemptionId, {
            orderId: input.orderId,
            status: "completed",
        });

        const nowIso = new Date().toISOString();
        const updated = await swapRewardQueries.updateUserReward(input.userId, {
            rewardStatus: "redeemed",
            currentCycleStampCount: 0,
            redeemedAt: nowIso,
            totalRewardsEarned: state.totalRewardsEarned + 1,
            activeRewardCycle: state.activeRewardCycle + 1,
            unlockedAt: null,
            lastStampOrderId: null,
        });

        await swapRewardQueries.createRewardEvent({
            userId: input.userId,
            orderId: input.orderId,
            rewardCycle: state.activeRewardCycle,
            type: "reward_redeemed",
            stampDelta: 0,
            metadata: {
                redemptionId: input.redemptionId,
                productId: checkoutSelection.selection.product.id,
                rewardValue: checkoutSelection.selection.rewardValue,
            },
        });

        posthog.capture({
            distinctId: input.userId,
            event: POSTHOG_EVENTS.SWAP_REWARD.REWARD_REDEEMED,
            properties: {
                orderId: input.orderId,
                rewardCycle: state.activeRewardCycle,
                redemptionId: input.redemptionId,
            },
        });

        await runSideEffect(() =>
            notifyRewardRedeemed({
                userId: input.userId,
                productTitle: checkoutSelection.selection.product.title,
            })
        );

        return updated;
    }

    async getAnalytics() {
        return swapRewardQueries.getRewardAnalytics();
    }

    getRewardPriceCapPaise() {
        return REWARD_PRICE_CAP_PAISE;
    }

    async backfillHistoricalRewards(options?: { userId?: string; dryRun?: boolean }) {
        const snapshots = await this.getHistoricalRewardOrders(options?.userId);
        const groupedSnapshots = new Map<string, HistoricalRewardOrder[]>();

        for (const snapshot of snapshots) {
            const existing = groupedSnapshots.get(snapshot.userId) ?? [];
            existing.push(snapshot);
            groupedSnapshots.set(snapshot.userId, existing);
        }

        const userIds = Array.from(groupedSnapshots.keys());
        const skippedUserIds = await this.getUsersWithRewardRedemptions(userIds);
        const rebuildableUserIds = userIds.filter((userId) => !skippedUserIds.has(userId));

        const summaries = rebuildableUserIds.map((userId) => {
            const state = cloneHistoricalState();
            const events: Array<typeof swapRewardEvents.$inferInsert> = [];
            const userSnapshots = groupedSnapshots.get(userId) ?? [];

            for (const snapshot of userSnapshots) {
                this.applyHistoricalOrderSnapshot(state, snapshot, events);
            }

            return {
                userId,
                state,
                events,
                processedOrderCount: userSnapshots.length,
            };
        });

        if (!options?.dryRun) {
            for (const summary of summaries) {
                await db.transaction(async (tx) => {
                    await tx
                        .delete(swapRewardEvents)
                        .where(eq(swapRewardEvents.userId, summary.userId));

                    await tx
                        .insert(userSwapRewards)
                        .values({
                            userId: summary.userId,
                            ...summary.state,
                        })
                        .onConflictDoUpdate({
                            target: userSwapRewards.userId,
                            set: {
                                ...summary.state,
                                updatedAt: new Date(),
                            },
                        });

                    if (summary.events.length > 0) {
                        await tx.insert(swapRewardEvents).values(summary.events);
                    }
                });
            }
        }

        return {
            dryRun: options?.dryRun ?? false,
            processedUsers: summaries.length,
            skippedUsers: skippedUserIds.size,
            processedOrders: summaries.reduce(
                (count, summary) => count + summary.processedOrderCount,
                0
            ),
            totalStampedOrders: summaries.reduce(
                (count, summary) =>
                    count +
                    summary.events.filter((event) => event.type === "stamp_earned")
                        .length,
                0
            ),
            totalRevokedOrders: summaries.reduce(
                (count, summary) =>
                    count +
                    summary.events.filter((event) => event.type === "stamp_revoked")
                        .length,
                0
            ),
            unlockedUsers: summaries.filter(
                (summary) => summary.state.rewardStatus === "unlocked"
            ).length,
            skippedUserIds: Array.from(skippedUserIds),
        };
    }

    private async getHistoricalRewardOrders(userId?: string) {
        const deliveredAtExpr = sql<Date>`coalesce(${orderShipments.shipmentDate}, ${orderShipments.updatedAt}, ${orders.createdAt})`;
        const hasProcessedRefundExpr = sql<boolean>`exists (
            select 1
            from ${refunds}
            where ${refunds.orderId} = ${orders.id}
              and ${refunds.status} = 'processed'
        )`;
        const hasCompletedReturnExpr = sql<boolean>`exists (
            select 1
            from ${orderReturnRequests}
            where ${orderReturnRequests.orderId} = ${orders.id}
              and ${orderReturnRequests.requestType} = 'return'
              and ${orderReturnRequests.status} = 'completed'
        )`;

        const rows = await db
            .select({
                userId: orders.userId,
                orderId: orders.id,
                deliveredAt: deliveredAtExpr,
                orderStatus: orders.status,
                paymentStatus: orders.paymentStatus,
                hasProcessedRefund: hasProcessedRefundExpr,
                hasCompletedReturn: hasCompletedReturnExpr,
            })
            .from(orderShipments)
            .innerJoin(orders, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    eq(orderShipments.status, "delivered"),
                    eq(orders.isSwapRewardOrder, false),
                    userId ? eq(orders.userId, userId) : undefined
                )
            )
            .orderBy(asc(deliveredAtExpr), asc(orders.createdAt), asc(orders.id));

        return rows.map((row) => {
            const revokeReason = row.hasProcessedRefund
                ? "refund_processed"
                : row.hasCompletedReturn
                  ? "return_completed"
                  : "order_cancelled";

            return {
                userId: row.userId,
                orderId: row.orderId,
                deliveredAt: row.deliveredAt,
                orderStatus: row.orderStatus,
                paymentStatus: row.paymentStatus,
                shouldRevoke:
                    row.orderStatus === "cancelled" ||
                    row.paymentStatus === "refunded" ||
                    row.hasProcessedRefund ||
                    row.hasCompletedReturn,
                revokeReason,
            } satisfies HistoricalRewardOrder;
        });
    }

    private async getUsersWithRewardRedemptions(userIds: string[]) {
        if (userIds.length === 0) return new Set<string>();

        const redemptions = await db
            .select({
                userId: rewardRedemptions.userId,
            })
            .from(rewardRedemptions)
            .where(
                and(
                    inArray(rewardRedemptions.userId, userIds),
                    eq(rewardRedemptions.status, "completed")
                )
            );

        return new Set(redemptions.map((entry) => entry.userId));
    }

    private applyHistoricalOrderSnapshot(
        state: HistoricalRewardUserState,
        snapshot: HistoricalRewardOrder,
        events: Array<typeof swapRewardEvents.$inferInsert>
    ) {
        const deliveredAtIso = toIsoTimestamp(snapshot.deliveredAt);
        const rewardCycle = state.activeRewardCycle;
        const nextCycleCount = Math.min(
            REWARD_STAMP_TARGET,
            state.currentCycleStampCount + 1
        );
        const unlockedNow = nextCycleCount >= REWARD_STAMP_TARGET;

        events.push({
            userId: snapshot.userId,
            orderId: snapshot.orderId,
            rewardCycle,
            type: "stamp_earned",
            stampDelta: 1,
            metadata: {
                source: "historical_backfill",
                deliveredAt: deliveredAtIso,
                orderStatus: snapshot.orderStatus,
                paymentStatus: snapshot.paymentStatus,
            },
        });

        state.totalStampCount += 1;
        state.currentCycleStampCount = nextCycleCount;
        state.rewardStatus = unlockedNow ? "unlocked" : "locked";
        state.unlockedAt = unlockedNow ? deliveredAtIso : state.unlockedAt;
        state.lastStampOrderId = snapshot.orderId;

        if (unlockedNow) {
            events.push({
                userId: snapshot.userId,
                orderId: snapshot.orderId,
                rewardCycle,
                type: "reward_unlocked",
                stampDelta: 0,
                metadata: {
                    source: "historical_backfill",
                    deliveredAt: deliveredAtIso,
                    threshold: REWARD_STAMP_TARGET,
                },
            });
        }

        if (!snapshot.shouldRevoke) return;

        events.push({
            userId: snapshot.userId,
            orderId: snapshot.orderId,
            rewardCycle,
            type: "stamp_revoked",
            stampDelta: -1,
            metadata: {
                source: "historical_backfill",
                reason: snapshot.revokeReason,
            },
        });

        const revokedCycleCount = Math.max(0, state.currentCycleStampCount - 1);
        const shouldRelock =
            state.rewardStatus === "unlocked" &&
            revokedCycleCount < REWARD_STAMP_TARGET;

        state.totalStampCount = Math.max(0, state.totalStampCount - 1);
        state.currentCycleStampCount = revokedCycleCount;

        if (shouldRelock) {
            state.rewardStatus = "locked";
            state.unlockedAt = null;
            events.push({
                userId: snapshot.userId,
                orderId: snapshot.orderId,
                rewardCycle,
                type: "reward_relocked",
                stampDelta: 0,
                metadata: {
                    source: "historical_backfill",
                    reason: snapshot.revokeReason,
                },
            });
        }
    }
}

export const swapRewardService = new SwapRewardService();

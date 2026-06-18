import {
    RewardRedemption,
    rewardRedemptionSchema,
    UserSwapReward,
    userSwapRewardSchema,
} from "@/lib/validations/swap-reward";
import { and, desc, eq } from "drizzle-orm";
import { db } from "..";
import {
    rewardRedemptions,
    swapRewardEvents,
    userSwapRewards,
} from "../schema";
import { productQueries } from "./product";

const REWARD_PRICE_CAP_PAISE = 1499 * 100;

const parseRewardState = (value: any): UserSwapReward =>
    userSwapRewardSchema.parse({
        ...value,
        unlockedAt: value.unlockedAt ?? null,
        redeemedAt: value.redeemedAt ?? null,
        lastStampOrderId: value.lastStampOrderId ?? null,
    });

const parseRewardRedemption = (value: any): RewardRedemption =>
    rewardRedemptionSchema.parse({
        ...value,
        orderId: value.orderId ?? null,
        variantId: value.variantId ?? null,
    });

class SwapRewardQuery {
    async getOrCreateUserReward(userId: string) {
        const existing = await db.query.userSwapRewards.findFirst({
            where: eq(userSwapRewards.userId, userId),
        });

        if (existing) return parseRewardState(existing);

        const created = await db
            .insert(userSwapRewards)
            .values({ userId })
            .returning()
            .then((rows) => rows[0]);

        return parseRewardState(created);
    }

    async updateUserReward(
        userId: string,
        values: Partial<typeof userSwapRewards.$inferInsert>
    ) {
        const updated = await db
            .update(userSwapRewards)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(userSwapRewards.userId, userId))
            .returning()
            .then((rows) => rows[0]);

        return parseRewardState(updated);
    }

    async getRewardEventByOrder(userId: string, orderId: string, type: string) {
        return db.query.swapRewardEvents.findFirst({
            where: and(
                eq(swapRewardEvents.userId, userId),
                eq(swapRewardEvents.orderId, orderId),
                eq(swapRewardEvents.type, type as any)
            ),
        });
    }

    async createRewardEvent(values: typeof swapRewardEvents.$inferInsert) {
        return db.insert(swapRewardEvents).values(values).returning().then((r) => r[0]);
    }

    async getEventsForUser(userId: string, limit = 50) {
        return db.query.swapRewardEvents.findMany({
            where: eq(swapRewardEvents.userId, userId),
            orderBy: [desc(swapRewardEvents.createdAt)],
            limit,
        });
    }

    async listEligibleRewardProducts(search?: string) {
        const productsData = await productQueries.getAllProducts({
            isActive: true,
            isAvailable: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
        });

        const filtered = productsData.filter((product) => {
            const hasEligibleBasePrice =
                !product.productHasVariants &&
                !!product.price &&
                product.price <= REWARD_PRICE_CAP_PAISE &&
                (product.quantity ?? 1) > 0;

            const eligibleVariants = product.variants.filter(
                (variant) =>
                    !variant.isDeleted &&
                    variant.price <= REWARD_PRICE_CAP_PAISE &&
                    variant.quantity > 0
            );

            const matchesSearch = search
                ? `${product.title} ${product.brand?.name ?? ""}`
                      .toLowerCase()
                      .includes(search.toLowerCase())
                : true;

            return matchesSearch && (hasEligibleBasePrice || eligibleVariants.length > 0);
        });

        return filtered.map((product) => ({
            ...product,
            eligibleVariants: product.variants.filter(
                (variant) =>
                    !variant.isDeleted &&
                    variant.price <= REWARD_PRICE_CAP_PAISE &&
                    variant.quantity > 0
            ),
        }));
    }

    async getEligibleRewardSelection(input: {
        productId: string;
        variantId?: string;
    }) {
        const product = await productQueries.getProduct({
            productId: input.productId,
            isActive: true,
            isAvailable: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
        });

        if (!product) return null;

        if (!input.variantId) {
            if (
                product.productHasVariants ||
                !product.price ||
                product.price > REWARD_PRICE_CAP_PAISE ||
                (product.quantity ?? 1) <= 0
            ) {
                return null;
            }

            return {
                product,
                variant: null,
                rewardValue: product.price,
            };
        }

        const variant = product.variants.find(
            (entry) =>
                entry.id === input.variantId &&
                !entry.isDeleted &&
                entry.price <= REWARD_PRICE_CAP_PAISE &&
                entry.quantity > 0
        );

        if (!variant) return null;

        return {
            product,
            variant,
            rewardValue: variant.price,
        };
    }

    async createRewardRedemption(values: typeof rewardRedemptions.$inferInsert) {
        const created = await db
            .insert(rewardRedemptions)
            .values(values)
            .returning()
            .then((rows) => rows[0]);

        return parseRewardRedemption(created);
    }

    async getRewardRedemptionByUserCycle(userId: string, rewardCycle: number) {
        const redemption = await db.query.rewardRedemptions.findFirst({
            where: and(
                eq(rewardRedemptions.userId, userId),
                eq(rewardRedemptions.rewardCycle, rewardCycle)
            ),
        });

        return redemption ? parseRewardRedemption(redemption) : null;
    }

    async completeRewardRedemption(
        id: string,
        values: { orderId: string; status: "completed" | "cancelled" }
    ) {
        const updated = await db
            .update(rewardRedemptions)
            .set({
                orderId: values.orderId,
                status: values.status,
                updatedAt: new Date(),
            })
            .where(eq(rewardRedemptions.id, id))
            .returning()
            .then((rows) => rows[0]);

        return parseRewardRedemption(updated);
    }

    async getRewardAnalytics() {
        const states = await db.query.userSwapRewards.findMany();
        const events = await db.query.swapRewardEvents.findMany();
        const redemptions = await db.query.rewardRedemptions.findMany({
            where: eq(rewardRedemptions.status, "completed"),
        });

        const totalCustomersEnrolled = states.length;
        const totalStampsIssued = events
            .filter((event) => event.type === "stamp_earned")
            .reduce((sum, event) => sum + event.stampDelta, 0);
        const activeStampCards = states.filter(
            (state) => state.currentCycleStampCount > 0 || state.rewardStatus === "unlocked"
        ).length;
        const unlockedCount = events.filter(
            (event) => event.type === "reward_unlocked"
        ).length;
        const redeemedCount = redemptions.length;

        return {
            totalCustomersEnrolled,
            totalStampsIssued,
            activeStampCards,
            rewardUnlockRate:
                totalCustomersEnrolled > 0 ? unlockedCount / totalCustomersEnrolled : 0,
            rewardRedemptionRate:
                unlockedCount > 0 ? redeemedCount / unlockedCount : 0,
        };
    }
}

export const swapRewardQueries = new SwapRewardQuery();

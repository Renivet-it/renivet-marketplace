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

    async listEligibleRewardProducts(input?: {
        search?: string;
        page?: number;
        limit?: number;
        brandId?: string;
        categoryId?: string;
        sortBy?: "recommended" | "price_asc" | "price_desc" | "newest";
    }) {
        const page = Math.max(1, input?.page ?? 1);
        const limit = Math.max(1, Math.min(input?.limit ?? 9, 24));
        const productsData = await productQueries.getAllProducts({
            isActive: true,
            isAvailable: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
        });

        const searchableEligible = productsData.filter((product) => {
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

            const matchesSearch = input?.search
                ? `${product.title} ${product.brand?.name ?? ""}`
                      .toLowerCase()
                      .includes(input.search.toLowerCase())
                : true;

            return matchesSearch && (hasEligibleBasePrice || eligibleVariants.length > 0);
        });

        const filteredByFacets = searchableEligible.filter((product) => {
            const matchesBrand = input?.brandId
                ? product.brandId === input.brandId
                : true;
            const matchesCategory = input?.categoryId
                ? product.categoryId === input.categoryId
                : true;

            return matchesBrand && matchesCategory;
        });

        const brandFacetSource = input?.categoryId
            ? searchableEligible.filter(
                  (product) => product.categoryId === input.categoryId
              )
            : searchableEligible;

        const facets = {
            brands: brandFacetSource
                .map((product) => product.brand)
                .filter(
                    (brand, index, brands) =>
                        !!brand &&
                        brands.findIndex((entry) => entry?.id === brand.id) === index
                )
                .map((brand) => ({
                    id: brand!.id,
                    name: brand!.name,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
            categories: searchableEligible
                .map((product) => product.category)
                .filter(
                    (category, index, categories) =>
                        !!category &&
                        categories.findIndex((entry) => entry?.id === category.id) ===
                            index
                )
                .map((category) => ({
                    id: category!.id,
                    name: category!.name,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        };

        const filtered = filteredByFacets.map((product) => ({
            ...product,
            eligibleVariants: product.variants.filter(
                (variant) =>
                    !variant.isDeleted &&
                    variant.price <= REWARD_PRICE_CAP_PAISE &&
                    variant.quantity > 0
            ),
        }));

        const sortedItems = [...filtered].sort((left, right) => {
            const leftPrice =
                left.eligibleVariants?.[0]?.price ?? left.price ?? Number.MAX_SAFE_INTEGER;
            const rightPrice =
                right.eligibleVariants?.[0]?.price ??
                right.price ??
                Number.MAX_SAFE_INTEGER;

            switch (input?.sortBy) {
                case "price_asc":
                    return leftPrice - rightPrice;
                case "price_desc":
                    return rightPrice - leftPrice;
                case "newest":
                    return (
                        new Date(right.createdAt).getTime() -
                        new Date(left.createdAt).getTime()
                    );
                default:
                    return 0;
            }
        });

        const start = (page - 1) * limit;
        const paginatedItems = sortedItems.slice(start, start + limit);

        return {
            items: paginatedItems,
            page,
            limit,
            totalCount: sortedItems.length,
            nextPage: start + limit < sortedItems.length ? page + 1 : null,
            facets,
        };
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

    async getActiveRewardRedemptionForUser(userId: string) {
        const redemption = await db.query.rewardRedemptions.findFirst({
            where: and(
                eq(rewardRedemptions.userId, userId),
                eq(rewardRedemptions.status, "initiated")
            ),
            orderBy: [desc(rewardRedemptions.updatedAt)],
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

    async cancelRewardRedemption(id: string) {
        const updated = await db
            .update(rewardRedemptions)
            .set({
                status: "cancelled",
                updatedAt: new Date(),
            })
            .where(eq(rewardRedemptions.id, id))
            .returning()
            .then((rows) => rows[0]);

        return updated ? parseRewardRedemption(updated) : null;
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

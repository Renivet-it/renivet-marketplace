import { mediaCache } from "@/lib/redis/methods";
import { ProductWithBrand, productWithBrandSchema } from "@/lib/validations";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "..";
import { hasMedia } from "../helperfilter";
import {
    orderItems,
    orders,
    productEvents,
    products,
    searchAnalytics,
    wishlists,
} from "../schema";

/**
 * Production-Ready Recommendation System
 *
 * Priority for users WITH orders:
 *   - Last purchased category/brand/product type
 *   - Complementary products
 *   - Buy-again SKUs
 *
 * Priority for users WITHOUT orders:
 *   1. Recently clicked/viewed products (weighted by event type, last 7 days)
 *   2. Wishlist-based (if exists, last 30 days)
 *   3. Search-driven recommendations (from searchAnalytics)
 *   4. Platform-level defaults (best sellers, trending)
 *
 * Features:
 *   - Time-based decay (7 days for browsing, 30 days for wishlist/orders)
 *   - Event deduplication (unique products only)
 *   - Weighted scoring (add_to_cart > click > view)
 *   - Merged fallback strategy for better variety
 *   - Error handling to prevent cascade failures
 */

export interface RecommendationContext {
    userId?: string;
    limit?: number;
    excludeProductIds?: string[];
}

export interface RecommendationResult {
    products: ProductWithBrand[];
    source:
        | "order_history"
        | "wishlist"
        | "browsing_history"
        | "search_history"
        | "platform_defaults"
        | "mixed";
    metadata?: {
        categoryId?: string;
        brandId?: string;
        productTypeId?: string;
    };
}

// Event weights for scoring
const EVENT_WEIGHTS = {
    add_to_cart: 5,
    purchase: 4,
    click: 2,
    view: 1,
} as const;

// Time windows in days
const TIME_WINDOWS = {
    BROWSING_HISTORY_DAYS: 7,
    WISHLIST_DAYS: 30,
    ORDER_HISTORY_DAYS: 90,
    SEARCH_HISTORY_DAYS: 14,
} as const;

class RecommendationQuery {
    /**
     * Main entry point for getting personalized recommendations
     */
    async getPersonalizedRecommendations(
        context: RecommendationContext
    ): Promise<RecommendationResult> {
        const { userId, limit = 20, excludeProductIds = [] } = context;

        // If no user, return platform defaults
        if (!userId) {
            return this.getPlatformDefaults(limit, excludeProductIds);
        }

        try {
            // Case 1: Check if user has past orders
            const hasOrders = await this.userHasOrders(userId);
            if (hasOrders) {
                return this.getOrderBasedRecommendations(
                    userId,
                    limit,
                    excludeProductIds
                );
            }

            // Case 2: User has no orders - use merged strategy for better variety
            return this.getMergedRecommendations(
                userId,
                limit,
                excludeProductIds
            );
        } catch (error) {
            console.error(
                "[Recommendations] Error getting personalized recommendations:",
                error
            );
            // Fallback to platform defaults on any error
            return this.getPlatformDefaults(limit, excludeProductIds);
        }
    }

    /**
     * Merged strategy: Combine multiple signal sources for better recommendations
     */
    private async getMergedRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        // Fetch from multiple sources in parallel
        const [browsingRecs, wishlistRecs, searchRecs] =
            await Promise.allSettled([
                this.getBrowsingHistoryRecommendations(
                    userId,
                    Math.ceil(limit * 0.6),
                    excludeProductIds
                ),
                this.getWishlistBasedRecommendations(
                    userId,
                    Math.ceil(limit * 0.3),
                    excludeProductIds
                ),
                this.getSearchDrivenRecommendations(
                    userId,
                    Math.ceil(limit * 0.2),
                    excludeProductIds
                ),
            ]);

        // Collect all products, avoiding duplicates
        const seenIds = new Set(excludeProductIds);
        const mergedProducts: ProductWithBrand[] = [];
        let primarySource: RecommendationResult["source"] = "platform_defaults";

        // Priority 1: Browsing history (most recent engagement)
        if (
            browsingRecs.status === "fulfilled" &&
            browsingRecs.value.products.length > 0
        ) {
            for (const product of browsingRecs.value.products) {
                if (!seenIds.has(product.id)) {
                    seenIds.add(product.id);
                    mergedProducts.push(product);
                }
            }
            if (mergedProducts.length > 0) primarySource = "browsing_history";
        }

        // Priority 2: Wishlist (explicit interest)
        if (
            wishlistRecs.status === "fulfilled" &&
            wishlistRecs.value.products.length > 0
        ) {
            for (const product of wishlistRecs.value.products) {
                if (!seenIds.has(product.id)) {
                    seenIds.add(product.id);
                    mergedProducts.push(product);
                }
            }
            if (
                mergedProducts.length > 0 &&
                primarySource === "platform_defaults"
            ) {
                primarySource = "wishlist";
            }
        }

        // Priority 3: Search history
        if (
            searchRecs.status === "fulfilled" &&
            searchRecs.value.products.length > 0
        ) {
            for (const product of searchRecs.value.products) {
                if (!seenIds.has(product.id)) {
                    seenIds.add(product.id);
                    mergedProducts.push(product);
                }
            }
            if (
                mergedProducts.length > 0 &&
                primarySource === "platform_defaults"
            ) {
                primarySource = "search_history";
            }
        }

        // If we have enough merged recommendations, return them
        if (mergedProducts.length >= 5) {
            return {
                products: mergedProducts.slice(0, limit),
                source:
                    mergedProducts.length > limit / 2 ? primarySource : "mixed",
            };
        }

        // Otherwise, fill remaining slots with platform defaults
        const remaining = limit - mergedProducts.length;
        if (remaining > 0) {
            const defaults = await this.getPlatformDefaults(remaining, [
                ...seenIds,
            ]);
            for (const product of defaults.products) {
                if (!seenIds.has(product.id)) {
                    seenIds.add(product.id);
                    mergedProducts.push(product);
                }
            }
        }

        return {
            products: mergedProducts.slice(0, limit),
            source:
                mergedProducts.length > 0 ? primarySource : "platform_defaults",
        };
    }

    /**
     * Check if user has any completed orders
     */
    private async userHasOrders(userId: string): Promise<boolean> {
        try {
            const orderCount = await db.$count(
                orders,
                and(
                    eq(orders.userId, userId),
                    inArray(orders.status, [
                        "delivered",
                        "processing",
                        "shipped",
                    ])
                )
            );
            return orderCount > 0;
        } catch (error) {
            console.error(
                "[Recommendations] Error checking user orders:",
                error
            );
            return false;
        }
    }

    /**
     * Case 1: Order-based recommendations
     * Based on last purchased category, brand, and complementary products
     */
    private async getOrderBasedRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        try {
            const orderHistoryDate = new Date();
            orderHistoryDate.setDate(
                orderHistoryDate.getDate() - TIME_WINDOWS.ORDER_HISTORY_DAYS
            );

            // Get the user's recent orders with product details
            const recentOrderItems = await db
                .select({
                    productId: orderItems.productId,
                    categoryId: products.categoryId,
                    subcategoryId: products.subcategoryId,
                    productTypeId: products.productTypeId,
                    brandId: products.brandId,
                })
                .from(orderItems)
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .innerJoin(products, eq(orderItems.productId, products.id))
                .where(
                    and(
                        eq(orders.userId, userId),
                        inArray(orders.status, [
                            "delivered",
                            "processing",
                            "shipped",
                        ]),
                        gte(orders.createdAt, orderHistoryDate)
                    )
                )
                .orderBy(desc(orders.createdAt))
                .limit(10);

            if (!recentOrderItems.length) {
                return this.getMergedRecommendations(
                    userId,
                    limit,
                    excludeProductIds
                );
            }

            // Extract unique categories, brands, and product types from recent orders
            const purchasedProductIds = recentOrderItems.map(
                (item) => item.productId
            );
            const categoryIds = [
                ...new Set(
                    recentOrderItems
                        .map((item) => item.categoryId)
                        .filter(Boolean)
                ),
            ] as string[];
            const brandIds = [
                ...new Set(
                    recentOrderItems.map((item) => item.brandId).filter(Boolean)
                ),
            ] as string[];
            const productTypeIds = [
                ...new Set(
                    recentOrderItems
                        .map((item) => item.productTypeId)
                        .filter(Boolean)
                ),
            ] as string[];

            // Exclude already purchased products and passed exclusions
            const allExclusions = [
                ...new Set([...excludeProductIds, ...purchasedProductIds]),
            ];

            // Build exclusion filter
            const exclusionFilter =
                allExclusions.length > 0
                    ? sql`${products.id}::text NOT IN (${sql.raw(allExclusions.map((id) => `'${id}'`).join(", "))})`
                    : undefined;

            // Build recommendation query - prioritize same category, then same brand
            const recommendedProducts = await db.query.products.findMany({
                with: {
                    brand: true,
                    variants: true,
                    category: true,
                    subcategory: true,
                    productType: true,
                    options: true,
                    journey: true,
                    values: true,
                    returnExchangePolicy: true,
                    specifications: {
                        columns: { key: true, value: true },
                    },
                },
                where: and(
                    eq(products.isPublished, true),
                    eq(products.isActive, true),
                    eq(products.isAvailable, true),
                    eq(products.isDeleted, false),
                    eq(products.verificationStatus, "approved"),
                    hasMedia(products, "media"),
                    exclusionFilter
                ),
                orderBy: [
                    // Prioritize same category
                    categoryIds.length > 0
                        ? sql`CASE WHEN ${products.categoryId}::text IN (${sql.raw(categoryIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Then same brand
                    brandIds.length > 0
                        ? sql`CASE WHEN ${products.brandId}::text IN (${sql.raw(brandIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Then same product type
                    productTypeIds.length > 0
                        ? sql`CASE WHEN ${products.productTypeId}::text IN (${sql.raw(productTypeIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Best sellers first
                    sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`,
                    desc(products.createdAt),
                ],
                limit,
            });

            const enhancedProducts =
                await this.enhanceProductsWithMedia(recommendedProducts);

            return {
                products: enhancedProducts,
                source: "order_history",
                metadata: {
                    categoryId: categoryIds[0],
                    brandId: brandIds[0],
                    productTypeId: productTypeIds[0],
                },
            };
        } catch (error) {
            console.error(
                "[Recommendations] Error getting order-based recommendations:",
                error
            );
            return this.getPlatformDefaults(limit, excludeProductIds);
        }
    }

    /**
     * Case 2.1: Wishlist-based recommendations
     */
    private async getWishlistBasedRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        try {
            const wishlistDate = new Date();
            wishlistDate.setDate(
                wishlistDate.getDate() - TIME_WINDOWS.WISHLIST_DAYS
            );

            // Get user's wishlist items
            const wishlistItems = await db
                .select({
                    productId: wishlists.productId,
                    categoryId: products.categoryId,
                    subcategoryId: products.subcategoryId,
                    productTypeId: products.productTypeId,
                    brandId: products.brandId,
                })
                .from(wishlists)
                .innerJoin(products, eq(wishlists.productId, products.id))
                .where(
                    and(
                        eq(wishlists.userId, userId),
                        gte(wishlists.createdAt, wishlistDate)
                    )
                )
                .orderBy(desc(wishlists.createdAt))
                .limit(10);

            if (!wishlistItems.length) {
                return { products: [], source: "wishlist" };
            }

            const wishlistProductIds = wishlistItems.map(
                (item) => item.productId
            );
            const categoryIds = [
                ...new Set(
                    wishlistItems.map((item) => item.categoryId).filter(Boolean)
                ),
            ] as string[];
            const brandIds = [
                ...new Set(
                    wishlistItems.map((item) => item.brandId).filter(Boolean)
                ),
            ] as string[];

            // NOTE: We do NOT exclude wishlist products - they should appear first
            // Only exclude products explicitly passed in excludeProductIds
            const exclusionFilter =
                excludeProductIds.length > 0
                    ? sql`${products.id}::text NOT IN (${sql.raw(excludeProductIds.map((id) => `'${id}'`).join(", "))})`
                    : undefined;

            const recommendedProducts = await db.query.products.findMany({
                with: {
                    brand: true,
                    variants: true,
                    category: true,
                    subcategory: true,
                    productType: true,
                    options: true,
                    journey: true,
                    values: true,
                    returnExchangePolicy: true,
                    specifications: {
                        columns: { key: true, value: true },
                    },
                },
                where: and(
                    eq(products.isPublished, true),
                    eq(products.isActive, true),
                    eq(products.isAvailable, true),
                    eq(products.isDeleted, false),
                    eq(products.verificationStatus, "approved"),
                    hasMedia(products, "media"),
                    // NOTE: No category filter - we ORDER BY category match instead
                    exclusionFilter
                ),
                orderBy: [
                    // Prioritize products in wishlist (show them first)
                    wishlistProductIds.length > 0
                        ? sql`CASE WHEN ${products.id}::text IN (${sql.raw(wishlistProductIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Then same category as wishlist
                    categoryIds.length > 0
                        ? sql`CASE WHEN ${products.categoryId}::text IN (${sql.raw(categoryIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Then same brand as wishlist
                    brandIds.length > 0
                        ? sql`CASE WHEN ${products.brandId}::text IN (${sql.raw(brandIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`,
                    desc(products.createdAt),
                ],
                limit,
            });

            const enhancedProducts =
                await this.enhanceProductsWithMedia(recommendedProducts);

            return {
                products: enhancedProducts,
                source: "wishlist",
                metadata: {
                    categoryId: categoryIds[0],
                    brandId: brandIds[0],
                },
            };
        } catch (error) {
            console.error(
                "[Recommendations] Error getting wishlist-based recommendations:",
                error
            );
            return { products: [], source: "wishlist" };
        }
    }

    /**
     * Case 2.2: Browsing history recommendations (from productEvents)
     * Uses weighted scoring based on event type and time-based filtering
     */
    private async getBrowsingHistoryRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        try {
            const browsingDate = new Date();
            browsingDate.setDate(
                browsingDate.getDate() - TIME_WINDOWS.BROWSING_HISTORY_DAYS
            );

            // Get recently viewed/clicked products with weighted scoring
            // Use DISTINCT ON to deduplicate products, keeping highest weighted event
            const recentViews = await db
                .select({
                    productId: productEvents.productId,
                    categoryId: products.categoryId,
                    subcategoryId: products.subcategoryId,
                    productTypeId: products.productTypeId,
                    brandId: products.brandId,
                    event: productEvents.event,
                    score: sql<number>`
                        CASE 
                            WHEN ${productEvents.event} = 'add_to_cart' THEN ${EVENT_WEIGHTS.add_to_cart}
                            WHEN ${productEvents.event} = 'click' THEN ${EVENT_WEIGHTS.click}
                            WHEN ${productEvents.event} = 'view' THEN ${EVENT_WEIGHTS.view}
                            ELSE 1
                        END
                    `.as("score"),
                })
                .from(productEvents)
                .innerJoin(products, eq(productEvents.productId, products.id))
                .where(
                    and(
                        eq(productEvents.userId, userId),
                        inArray(productEvents.event, [
                            "click",
                            "view",
                            "add_to_cart",
                        ]),
                        gte(productEvents.createdAt, browsingDate)
                    )
                )
                .orderBy(
                    desc(sql`
                        CASE 
                            WHEN ${productEvents.event} = 'add_to_cart' THEN ${EVENT_WEIGHTS.add_to_cart}
                            WHEN ${productEvents.event} = 'click' THEN ${EVENT_WEIGHTS.click}
                            WHEN ${productEvents.event} = 'view' THEN ${EVENT_WEIGHTS.view}
                            ELSE 1
                        END
                    `),
                    desc(productEvents.createdAt)
                )
                .limit(30);

            // Deduplicate products in JavaScript (keeping highest scored)
            const productMap = new Map<string, (typeof recentViews)[0]>();
            for (const view of recentViews) {
                const existing = productMap.get(view.productId);
                if (!existing || view.score > existing.score) {
                    productMap.set(view.productId, view);
                }
            }
            const uniqueViews = Array.from(productMap.values()).slice(0, 20);

            if (!uniqueViews.length) {
                return { products: [], source: "browsing_history" };
            }

            const viewedProductIds = uniqueViews.map((item) => item.productId);
            const categoryIds = [
                ...new Set(
                    uniqueViews.map((item) => item.categoryId).filter(Boolean)
                ),
            ] as string[];
            const brandIds = [
                ...new Set(
                    uniqueViews.map((item) => item.brandId).filter(Boolean)
                ),
            ] as string[];
            const productTypeIds = [
                ...new Set(
                    uniqueViews
                        .map((item) => item.productTypeId)
                        .filter(Boolean)
                ),
            ] as string[];

            // NOTE: We do NOT exclude viewedProductIds - clicked products should still appear
            // We only exclude products explicitly passed in excludeProductIds
            const exclusionFilter =
                excludeProductIds.length > 0
                    ? sql`${products.id}::text NOT IN (${sql.raw(excludeProductIds.map((id) => `'${id}'`).join(", "))})`
                    : undefined;

            const recommendedProducts = await db.query.products.findMany({
                with: {
                    brand: true,
                    variants: true,
                    category: true,
                    subcategory: true,
                    productType: true,
                    options: true,
                    journey: true,
                    values: true,
                    returnExchangePolicy: true,
                    specifications: {
                        columns: { key: true, value: true },
                    },
                },
                where: and(
                    eq(products.isPublished, true),
                    eq(products.isActive, true),
                    eq(products.isAvailable, true),
                    eq(products.isDeleted, false),
                    eq(products.verificationStatus, "approved"),
                    hasMedia(products, "media"),
                    // NOTE: We don't filter by category - instead we ORDER BY category match
                    // This allows clicked products to appear AND brings similar products higher
                    exclusionFilter
                ),
                orderBy: [
                    // Prioritize products the user actually clicked on (show them first)
                    viewedProductIds.length > 0
                        ? sql`CASE WHEN ${products.id}::text IN (${sql.raw(viewedProductIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Then same category as clicked products
                    categoryIds.length > 0
                        ? sql`CASE WHEN ${products.categoryId}::text IN (${sql.raw(categoryIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Then same product type as clicked
                    productTypeIds.length > 0
                        ? sql`CASE WHEN ${products.productTypeId}::text IN (${sql.raw(productTypeIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    // Then same brand as clicked
                    brandIds.length > 0
                        ? sql`CASE WHEN ${products.brandId}::text IN (${sql.raw(brandIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`,
                    desc(products.createdAt),
                ],
                limit,
            });

            const enhancedProducts =
                await this.enhanceProductsWithMedia(recommendedProducts);

            return {
                products: enhancedProducts,
                source: "browsing_history",
                metadata: {
                    categoryId: categoryIds[0],
                    brandId: brandIds[0],
                    productTypeId: productTypeIds[0],
                },
            };
        } catch (error) {
            console.error(
                "[Recommendations] Error getting browsing history recommendations:",
                error
            );
            return { products: [], source: "browsing_history" };
        }
    }

    /**
     * Case 2.3: Search-driven recommendations
     */
    private async getSearchDrivenRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        try {
            const searchDate = new Date();
            searchDate.setDate(
                searchDate.getDate() - TIME_WINDOWS.SEARCH_HISTORY_DAYS
            );

            // Get user's recent search queries
            const recentSearches = await db
                .select({
                    categoryId: searchAnalytics.matchedCategoryId,
                    subcategoryId: searchAnalytics.matchedSubcategoryId,
                    productTypeId: searchAnalytics.matchedProductTypeId,
                    brandId: searchAnalytics.matchedBrandId,
                })
                .from(searchAnalytics)
                .where(
                    and(
                        eq(searchAnalytics.userId, userId),
                        gte(searchAnalytics.createdAt, searchDate)
                    )
                )
                .orderBy(desc(searchAnalytics.createdAt))
                .limit(5);

            if (!recentSearches.length) {
                return { products: [], source: "search_history" };
            }

            const categoryIds = [
                ...new Set(
                    recentSearches.map((s) => s.categoryId).filter(Boolean)
                ),
            ] as string[];
            const subcategoryIds = [
                ...new Set(
                    recentSearches.map((s) => s.subcategoryId).filter(Boolean)
                ),
            ] as string[];
            const productTypeIds = [
                ...new Set(
                    recentSearches.map((s) => s.productTypeId).filter(Boolean)
                ),
            ] as string[];
            const brandIds = [
                ...new Set(
                    recentSearches.map((s) => s.brandId).filter(Boolean)
                ),
            ] as string[];

            // Build filter based on search intent
            let categoryFilter;
            if (productTypeIds.length > 0) {
                categoryFilter = inArray(
                    products.productTypeId,
                    productTypeIds
                );
            } else if (subcategoryIds.length > 0) {
                categoryFilter = inArray(
                    products.subcategoryId,
                    subcategoryIds
                );
            } else if (categoryIds.length > 0) {
                categoryFilter = inArray(products.categoryId, categoryIds);
            }

            const exclusionFilter =
                excludeProductIds.length > 0
                    ? sql`${products.id}::text NOT IN (${sql.raw(excludeProductIds.map((id) => `'${id}'`).join(", "))})`
                    : undefined;

            const recommendedProducts = await db.query.products.findMany({
                with: {
                    brand: true,
                    variants: true,
                    category: true,
                    subcategory: true,
                    productType: true,
                    options: true,
                    journey: true,
                    values: true,
                    returnExchangePolicy: true,
                    specifications: {
                        columns: { key: true, value: true },
                    },
                },
                where: and(
                    eq(products.isPublished, true),
                    eq(products.isActive, true),
                    eq(products.isAvailable, true),
                    eq(products.isDeleted, false),
                    eq(products.verificationStatus, "approved"),
                    hasMedia(products, "media"),
                    categoryFilter,
                    exclusionFilter
                ),
                orderBy: [
                    // Matched brand from search
                    brandIds.length > 0
                        ? sql`CASE WHEN ${products.brandId}::text IN (${sql.raw(brandIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                        : sql`1`,
                    sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`,
                    desc(products.createdAt),
                ],
                limit,
            });

            const enhancedProducts =
                await this.enhanceProductsWithMedia(recommendedProducts);

            return {
                products: enhancedProducts,
                source: "search_history",
                metadata: {
                    categoryId: categoryIds[0],
                    brandId: brandIds[0],
                    productTypeId: productTypeIds[0],
                },
            };
        } catch (error) {
            console.error(
                "[Recommendations] Error getting search-driven recommendations:",
                error
            );
            return { products: [], source: "search_history" };
        }
    }

    /**
     * Case 2.4: Platform-level defaults - best sellers, trending, new arrivals
     */
    private async getPlatformDefaults(
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        try {
            const exclusionFilter =
                excludeProductIds.length > 0
                    ? sql`${products.id}::text NOT IN (${sql.raw(excludeProductIds.map((id) => `'${id}'`).join(", "))})`
                    : undefined;

            const recommendedProducts = await db.query.products.findMany({
                with: {
                    brand: true,
                    variants: true,
                    category: true,
                    subcategory: true,
                    productType: true,
                    options: true,
                    journey: true,
                    values: true,
                    returnExchangePolicy: true,
                    specifications: {
                        columns: { key: true, value: true },
                    },
                },
                where: and(
                    eq(products.isPublished, true),
                    eq(products.isActive, true),
                    eq(products.isAvailable, true),
                    eq(products.isDeleted, false),
                    eq(products.verificationStatus, "approved"),
                    hasMedia(products, "media"),
                    exclusionFilter
                ),
                orderBy: [
                    // Best sellers first
                    sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`,
                    // Then newest products
                    desc(products.createdAt),
                ],
                limit,
            });

            const enhancedProducts =
                await this.enhanceProductsWithMedia(recommendedProducts);

            return {
                products: enhancedProducts,
                source: "platform_defaults",
            };
        } catch (error) {
            console.error(
                "[Recommendations] Error getting platform defaults:",
                error
            );
            return { products: [], source: "platform_defaults" };
        }
    }

    /**
     * Enhance products with media items from cache
     */
    private async enhanceProductsWithMedia(
        data: Array<{
            media?: Array<{ id: string }>;
            variants?: Array<{ image?: string | null }>;
            sustainabilityCertificate?: string | null;
            returnExchangePolicy?: {
                returnable?: boolean;
                returnDescription?: string | null;
                exchangeable?: boolean;
                exchangeDescription?: string | null;
            } | null;
            specifications?: Array<{ key: string; value: string }>;
            [key: string]: unknown;
        }>
    ): Promise<ProductWithBrand[]> {
        if (data.length === 0) return [];

        try {
            const mediaIds = new Set<string>();
            for (const product of data) {
                product.media?.forEach((m) => mediaIds.add(m.id));
                product.variants?.forEach((v) => {
                    if (v.image) mediaIds.add(v.image);
                });
                if (product.sustainabilityCertificate)
                    mediaIds.add(product.sustainabilityCertificate);
            }

            const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
            const mediaMap = new Map(mediaItems.data.map((i) => [i.id, i]));

            const enhancedData = data.map((product) => ({
                ...product,
                media:
                    product.media?.map((m) => ({
                        ...m,
                        mediaItem: mediaMap.get(m.id),
                    })) || [],
                sustainabilityCertificate: product.sustainabilityCertificate
                    ? mediaMap.get(product.sustainabilityCertificate)
                    : null,
                variants:
                    product.variants?.map((v) => ({
                        ...v,
                        mediaItem: v.image ? mediaMap.get(v.image) : null,
                    })) || [],
                returnable: product.returnExchangePolicy?.returnable ?? false,
                returnDescription:
                    product.returnExchangePolicy?.returnDescription ?? null,
                exchangeable:
                    product.returnExchangePolicy?.exchangeable ?? false,
                exchangeDescription:
                    product.returnExchangePolicy?.exchangeDescription ?? null,
                specifications:
                    product.specifications?.map((s) => ({
                        key: s.key,
                        value: s.value,
                    })) || [],
            }));

            return productWithBrandSchema.array().parse(enhancedData);
        } catch (error) {
            console.error(
                "[Recommendations] Error enhancing products with media:",
                error
            );
            return [];
        }
    }
}

export const recommendationQueries = new RecommendationQuery();

import { mediaCache } from "@/lib/redis/methods";
import { ProductWithBrand, productWithBrandSchema } from "@/lib/validations";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
 * Recommendation Priority for Phase 1:
 *
 * Case 1: User HAS past orders
 *   - Last purchased category
 *   - Last purchased brand
 *   - Complementary products
 *   - Buy-again SKUs
 *
 * Case 2: User has NO orders
 *   1. Wishlist-based (if exists)
 *   2. Recently viewed/browsed products (from productEvents)
 *   3. Search-driven recommendations (from searchAnalytics)
 *   4. Platform-level defaults (best sellers, trending)
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
        | "platform_defaults";
    metadata?: {
        categoryId?: string;
        brandId?: string;
        productTypeId?: string;
    };
}

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

        // Case 1: Check if user has past orders
        const hasOrders = await this.userHasOrders(userId);
        if (hasOrders) {
            return this.getOrderBasedRecommendations(
                userId,
                limit,
                excludeProductIds
            );
        }

        // Case 2: User has no orders - cascade through fallbacks

        // 2.1: Try wishlist-based recommendations
        const wishlistRecs = await this.getWishlistBasedRecommendations(
            userId,
            limit,
            excludeProductIds
        );
        if (wishlistRecs.products.length >= 3) {
            return wishlistRecs;
        }

        // 2.2: Try browsing history (productEvents with clicks/views)
        const browsingRecs = await this.getBrowsingHistoryRecommendations(
            userId,
            limit,
            excludeProductIds
        );
        if (browsingRecs.products.length >= 3) {
            return browsingRecs;
        }

        // 2.3: Try search-driven recommendations
        const searchRecs = await this.getSearchDrivenRecommendations(
            userId,
            limit,
            excludeProductIds
        );
        if (searchRecs.products.length >= 3) {
            return searchRecs;
        }

        // 2.4: Fall back to platform defaults
        return this.getPlatformDefaults(limit, excludeProductIds);
    }

    /**
     * Check if user has any completed orders
     */
    private async userHasOrders(userId: string): Promise<boolean> {
        const orderCount = await db.$count(
            orders,
            and(
                eq(orders.userId, userId),
                inArray(orders.status, ["delivered", "processing", "shipped"])
            )
        );
        return orderCount > 0;
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
                    ])
                )
            )
            .orderBy(desc(orders.createdAt))
            .limit(10);

        if (!recentOrderItems.length) {
            return this.getPlatformDefaults(limit, excludeProductIds);
        }

        // Extract unique categories, brands, and product types from recent orders
        const purchasedProductIds = recentOrderItems.map(
            (item) => item.productId
        );
        const categoryIds = [
            ...new Set(
                recentOrderItems.map((item) => item.categoryId).filter(Boolean)
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
    }

    /**
     * Case 2.1: Wishlist-based recommendations
     */
    private async getWishlistBasedRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
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
            .where(eq(wishlists.userId, userId))
            .orderBy(desc(wishlists.createdAt))
            .limit(10);

        if (!wishlistItems.length) {
            return { products: [], source: "wishlist" };
        }

        const wishlistProductIds = wishlistItems.map((item) => item.productId);
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

        const allExclusions = [
            ...new Set([...excludeProductIds, ...wishlistProductIds]),
        ];

        const exclusionFilter =
            allExclusions.length > 0
                ? sql`${products.id}::text NOT IN (${sql.raw(allExclusions.map((id) => `'${id}'`).join(", "))})`
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
                // Same category as wishlist items
                categoryIds.length > 0
                    ? inArray(products.categoryId, categoryIds)
                    : undefined,
                exclusionFilter
            ),
            orderBy: [
                // Same brand as wishlist
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
    }

    /**
     * Case 2.2: Browsing history recommendations (from productEvents)
     */
    private async getBrowsingHistoryRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        // Get recently viewed/clicked products
        const recentViews = await db
            .select({
                productId: productEvents.productId,
                categoryId: products.categoryId,
                subcategoryId: products.subcategoryId,
                productTypeId: products.productTypeId,
                brandId: products.brandId,
            })
            .from(productEvents)
            .innerJoin(products, eq(productEvents.productId, products.id))
            .where(
                and(
                    eq(productEvents.userId, userId),
                    inArray(productEvents.event, ["click", "view"])
                )
            )
            .orderBy(desc(productEvents.createdAt))
            .limit(20);

        if (!recentViews.length) {
            return { products: [], source: "browsing_history" };
        }

        const viewedProductIds = recentViews.map((item) => item.productId);
        const categoryIds = [
            ...new Set(
                recentViews.map((item) => item.categoryId).filter(Boolean)
            ),
        ] as string[];
        const brandIds = [
            ...new Set(recentViews.map((item) => item.brandId).filter(Boolean)),
        ] as string[];
        const productTypeIds = [
            ...new Set(
                recentViews.map((item) => item.productTypeId).filter(Boolean)
            ),
        ] as string[];

        const allExclusions = [
            ...new Set([...excludeProductIds, ...viewedProductIds]),
        ];

        const exclusionFilter =
            allExclusions.length > 0
                ? sql`${products.id}::text NOT IN (${sql.raw(allExclusions.map((id) => `'${id}'`).join(", "))})`
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
                // Similar to viewed products
                categoryIds.length > 0
                    ? inArray(products.categoryId, categoryIds)
                    : undefined,
                exclusionFilter
            ),
            orderBy: [
                // Same product type as viewed
                productTypeIds.length > 0
                    ? sql`CASE WHEN ${products.productTypeId}::text IN (${sql.raw(productTypeIds.map((id) => `'${id}'`).join(", "))}) THEN 0 ELSE 1 END ASC`
                    : sql`1`,
                // Same brand as viewed
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
    }

    /**
     * Case 2.3: Search-driven recommendations
     */
    private async getSearchDrivenRecommendations(
        userId: string,
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
        // Get user's recent search queries
        const recentSearches = await db
            .select({
                categoryId: searchAnalytics.matchedCategoryId,
                subcategoryId: searchAnalytics.matchedSubcategoryId,
                productTypeId: searchAnalytics.matchedProductTypeId,
                brandId: searchAnalytics.matchedBrandId,
            })
            .from(searchAnalytics)
            .where(eq(searchAnalytics.userId, userId))
            .orderBy(desc(searchAnalytics.createdAt))
            .limit(5);

        if (!recentSearches.length) {
            return { products: [], source: "search_history" };
        }

        const categoryIds = [
            ...new Set(recentSearches.map((s) => s.categoryId).filter(Boolean)),
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
            ...new Set(recentSearches.map((s) => s.brandId).filter(Boolean)),
        ] as string[];

        // Build filter based on search intent
        let categoryFilter;
        if (productTypeIds.length > 0) {
            categoryFilter = inArray(products.productTypeId, productTypeIds);
        } else if (subcategoryIds.length > 0) {
            categoryFilter = inArray(products.subcategoryId, subcategoryIds);
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
    }

    /**
     * Case 2.4: Platform-level defaults - best sellers, trending, new arrivals
     */
    private async getPlatformDefaults(
        limit: number,
        excludeProductIds: string[]
    ): Promise<RecommendationResult> {
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
            exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
            exchangeDescription:
                product.returnExchangePolicy?.exchangeDescription ?? null,
            specifications:
                product.specifications?.map((s) => ({
                    key: s.key,
                    value: s.value,
                })) || [],
        }));

        return productWithBrandSchema.array().parse(enhancedData);
    }
}

export const recommendationQueries = new RecommendationQuery();

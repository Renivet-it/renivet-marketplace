/**
 * Recommendation Engine - Phase 1
 *
 * This service provides personalized product recommendations based on user signals:
 * 1. Past Orders (highest priority)
 * 2. Wishlist Items
 * 3. Recently Viewed Products
 * 4. Search History
 * 5. Fallback to Best Sellers / New Arrivals
 */

import { db } from "@/lib/db";
import {
    orderItems,
    orders,
    productEvents,
    products,
    searchAnalytics,
    wishlists,
} from "@/lib/db/schema";
import { mediaCache } from "@/lib/redis/methods";
import { and, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

// Types
export type RecommendationSignal = {
    type: "order" | "wishlist" | "view" | "search" | "default";
    categoryIds: string[];
    brandIds: string[];
    productTypeIds: string[];
    excludeProductIds: string[];
};

export type RecommendationResult = {
    products: any[]; // Will be ProductWithBrand[] after media enrichment
    signalUsed: RecommendationSignal["type"];
    debug?: {
        ordersFound: number;
        wishlistFound: number;
        viewsFound: number;
        searchesFound: number;
    };
};

// ============================================================================
// SIGNAL EXTRACTION HELPERS
// ============================================================================

/**
 * Get signals from user's past orders
 */
async function getPastOrdersSignal(
    userId: string
): Promise<RecommendationSignal | null> {
    // Get recent order items with product details
    const recentOrders = await db
        .select({
            productId: orderItems.productId,
            categoryId: products.categoryId,
            brandId: products.brandId,
            productTypeId: products.productTypeId,
            createdAt: orders.createdAt,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(and(eq(orders.userId, userId), eq(orders.paymentStatus, "paid")))
        .orderBy(desc(orders.createdAt))
        .limit(20);

    if (recentOrders.length === 0) return null;

    const categoryIds = [...new Set(recentOrders.map((o) => o.categoryId))];
    const brandIds = [...new Set(recentOrders.map((o) => o.brandId))];
    const productTypeIds = [
        ...new Set(recentOrders.map((o) => o.productTypeId)),
    ];
    const excludeProductIds = [
        ...new Set(recentOrders.map((o) => o.productId)),
    ];

    return {
        type: "order",
        categoryIds,
        brandIds,
        productTypeIds,
        excludeProductIds,
    };
}

/**
 * Get signals from user's wishlist
 */
async function getWishlistSignal(
    userId: string
): Promise<RecommendationSignal | null> {
    const wishlistItems = await db
        .select({
            productId: wishlists.productId,
            categoryId: products.categoryId,
            brandId: products.brandId,
            productTypeId: products.productTypeId,
        })
        .from(wishlists)
        .innerJoin(products, eq(wishlists.productId, products.id))
        .where(eq(wishlists.userId, userId))
        .orderBy(desc(wishlists.createdAt))
        .limit(20);

    if (wishlistItems.length === 0) return null;

    const categoryIds = [...new Set(wishlistItems.map((w) => w.categoryId))];
    const brandIds = [...new Set(wishlistItems.map((w) => w.brandId))];
    const productTypeIds = [
        ...new Set(wishlistItems.map((w) => w.productTypeId)),
    ];
    const excludeProductIds = [
        ...new Set(wishlistItems.map((w) => w.productId)),
    ];

    return {
        type: "wishlist",
        categoryIds,
        brandIds,
        productTypeIds,
        excludeProductIds,
    };
}

/**
 * Get signals from user's recently viewed products
 */
async function getRecentViewsSignal(
    userId: string
): Promise<RecommendationSignal | null> {
    const recentViews = await db
        .select({
            productId: productEvents.productId,
            categoryId: products.categoryId,
            brandId: products.brandId,
            productTypeId: products.productTypeId,
        })
        .from(productEvents)
        .innerJoin(products, eq(productEvents.productId, products.id))
        .where(
            and(
                eq(productEvents.userId, userId),
                inArray(productEvents.event, ["view", "click"])
            )
        )
        .orderBy(desc(productEvents.createdAt))
        .limit(30);

    if (recentViews.length === 0) return null;

    const categoryIds = [...new Set(recentViews.map((v) => v.categoryId))];
    const brandIds = [...new Set(recentViews.map((v) => v.brandId))];
    const productTypeIds = [
        ...new Set(recentViews.map((v) => v.productTypeId)),
    ];
    const excludeProductIds = [...new Set(recentViews.map((v) => v.productId))];

    return {
        type: "view",
        categoryIds,
        brandIds,
        productTypeIds,
        excludeProductIds,
    };
}

/**
 * Get signals from user's search history
 */
async function getSearchHistorySignal(
    userId: string
): Promise<RecommendationSignal | null> {
    const recentSearches = await db
        .select({
            intentType: searchAnalytics.intentType,
            matchedBrandId: searchAnalytics.matchedBrandId,
            matchedCategoryId: searchAnalytics.matchedCategoryId,
            matchedProductTypeId: searchAnalytics.matchedProductTypeId,
        })
        .from(searchAnalytics)
        .where(
            and(
                eq(searchAnalytics.userId, userId),
                // Only consider searches with detected intent
                inArray(searchAnalytics.intentType, [
                    "BRAND",
                    "CATEGORY",
                    "PRODUCT",
                ])
            )
        )
        .orderBy(desc(searchAnalytics.createdAt))
        .limit(10);

    if (recentSearches.length === 0) return null;

    const categoryIds = recentSearches
        .map((s) => s.matchedCategoryId)
        .filter((id): id is string => id !== null);
    const brandIds = recentSearches
        .map((s) => s.matchedBrandId)
        .filter((id): id is string => id !== null);
    const productTypeIds = recentSearches
        .map((s) => s.matchedProductTypeId)
        .filter((id): id is string => id !== null);

    // If we didn't extract any useful signals, return null
    if (
        categoryIds.length === 0 &&
        brandIds.length === 0 &&
        productTypeIds.length === 0
    ) {
        return null;
    }

    return {
        type: "search",
        categoryIds: [...new Set(categoryIds)],
        brandIds: [...new Set(brandIds)],
        productTypeIds: [...new Set(productTypeIds)],
        excludeProductIds: [],
    };
}

// ============================================================================
// PRODUCT FETCHING
// ============================================================================

/**
 * Fetch products based on a signal
 */
async function fetchProductsBySignal(
    signal: RecommendationSignal,
    limit: number
): Promise<any[]> {
    const filters = [
        eq(products.isActive, true),
        eq(products.isPublished, true),
        eq(products.isDeleted, false),
        eq(products.verificationStatus, "approved"),
        // Exclude already purchased/viewed products
        signal.excludeProductIds.length > 0
            ? sql`${products.id} NOT IN (${sql.join(
                  signal.excludeProductIds.map((id) => sql`${id}::uuid`),
                  sql`, `
              )})`
            : undefined,
    ].filter(Boolean);

    // Build preference ordering
    const orderBy: any[] = [];

    // Prioritize by brand match
    if (signal.brandIds.length > 0) {
        orderBy.push(
            sql`CASE WHEN ${products.brandId} IN (${sql.join(
                signal.brandIds.map((id) => sql`${id}::uuid`),
                sql`, `
            )}) THEN 0 ELSE 1 END ASC`
        );
    }

    // Prioritize by category match
    if (signal.categoryIds.length > 0) {
        orderBy.push(
            sql`CASE WHEN ${products.categoryId} IN (${sql.join(
                signal.categoryIds.map((id) => sql`${id}::uuid`),
                sql`, `
            )}) THEN 0 ELSE 1 END ASC`
        );
    }

    // Prioritize by product type match
    if (signal.productTypeIds.length > 0) {
        orderBy.push(
            sql`CASE WHEN ${products.productTypeId} IN (${sql.join(
                signal.productTypeIds.map((id) => sql`${id}::uuid`),
                sql`, `
            )}) THEN 0 ELSE 1 END ASC`
        );
    }

    // Fallback sort: best sellers first, then newest
    orderBy.push(
        sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`
    );
    orderBy.push(desc(products.createdAt));

    // Add filter to prefer signal matches
    const signalFilter =
        signal.brandIds.length > 0 ||
        signal.categoryIds.length > 0 ||
        signal.productTypeIds.length > 0
            ? sql`(
                ${
                    signal.brandIds.length > 0
                        ? sql`${products.brandId} IN (${sql.join(
                              signal.brandIds.map((id) => sql`${id}::uuid`),
                              sql`, `
                          )})`
                        : sql`FALSE`
                }
                OR ${
                    signal.categoryIds.length > 0
                        ? sql`${products.categoryId} IN (${sql.join(
                              signal.categoryIds.map((id) => sql`${id}::uuid`),
                              sql`, `
                          )})`
                        : sql`FALSE`
                }
                OR ${
                    signal.productTypeIds.length > 0
                        ? sql`${products.productTypeId} IN (${sql.join(
                              signal.productTypeIds.map(
                                  (id) => sql`${id}::uuid`
                              ),
                              sql`, `
                          )})`
                        : sql`FALSE`
                }
            )`
            : undefined;

    if (signalFilter) {
        filters.push(signalFilter);
    }

    const data = await db.query.products.findMany({
        with: {
            brand: true,
            variants: true,
            category: true,
            subcategory: true,
            productType: true,
        },
        where: and(...filters),
        limit,
        orderBy,
    });

    return data;
}

/**
 * Fetch default recommendations (best sellers / new arrivals)
 */
async function fetchDefaultRecommendations(limit: number): Promise<any[]> {
    const data = await db.query.products.findMany({
        with: {
            brand: true,
            variants: true,
            category: true,
            subcategory: true,
            productType: true,
        },
        where: and(
            eq(products.isActive, true),
            eq(products.isPublished, true),
            eq(products.isDeleted, false),
            eq(products.verificationStatus, "approved")
        ),
        limit,
        orderBy: [
            sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`,
            desc(products.createdAt),
        ],
    });

    return data;
}

/**
 * Enrich products with media items
 */
async function enrichWithMedia(productList: any[]): Promise<any[]> {
    const mediaIds = new Set<string>();

    for (const product of productList) {
        product.media?.forEach((m: any) => mediaIds.add(m.id));
        product.variants?.forEach((v: any) => {
            if (v.image) mediaIds.add(v.image);
        });
        if (product.sustainabilityCertificate) {
            mediaIds.add(product.sustainabilityCertificate);
        }
    }

    if (mediaIds.size === 0) return productList;

    const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
    const mediaMap = new Map(mediaItems.data.map((i) => [i.id, i]));

    return productList.map((product) => ({
        ...product,
        media: product.media?.map((m: any) => ({
            ...m,
            mediaItem: mediaMap.get(m.id),
        })),
        variants: product.variants?.map((v: any) => ({
            ...v,
            mediaItem: v.image ? mediaMap.get(v.image) : null,
        })),
        sustainabilityCertificate: product.sustainabilityCertificate
            ? mediaMap.get(product.sustainabilityCertificate)
            : null,
    }));
}

// ============================================================================
// MAIN RECOMMENDATION FUNCTION
// ============================================================================

/**
 * Get personalized product recommendations for a user
 *
 * @param userId - The user ID to get recommendations for (can be null for anonymous)
 * @param limit - Maximum number of products to return
 * @returns Recommended products with signal metadata
 */
export async function getRecommendations(
    userId: string | null,
    limit: number = 10
): Promise<RecommendationResult> {
    const debug = {
        ordersFound: 0,
        wishlistFound: 0,
        viewsFound: 0,
        searchesFound: 0,
    };

    // For anonymous users, go straight to defaults
    if (!userId) {
        const defaultProducts = await fetchDefaultRecommendations(limit);
        const enrichedProducts = await enrichWithMedia(defaultProducts);
        return {
            products: enrichedProducts,
            signalUsed: "default",
            debug,
        };
    }

    // Try signals in priority order
    // 1. Past Orders
    const orderSignal = await getPastOrdersSignal(userId);
    if (orderSignal) {
        debug.ordersFound = orderSignal.excludeProductIds.length;
        const products = await fetchProductsBySignal(orderSignal, limit);
        if (products.length >= Math.min(limit / 2, 5)) {
            const enrichedProducts = await enrichWithMedia(products);
            return {
                products: enrichedProducts,
                signalUsed: "order",
                debug,
            };
        }
    }

    // 2. Wishlist
    const wishlistSignal = await getWishlistSignal(userId);
    if (wishlistSignal) {
        debug.wishlistFound = wishlistSignal.excludeProductIds.length;
        const products = await fetchProductsBySignal(wishlistSignal, limit);
        if (products.length >= Math.min(limit / 2, 5)) {
            const enrichedProducts = await enrichWithMedia(products);
            return {
                products: enrichedProducts,
                signalUsed: "wishlist",
                debug,
            };
        }
    }

    // 3. Recent Views
    const viewSignal = await getRecentViewsSignal(userId);
    if (viewSignal) {
        debug.viewsFound = viewSignal.excludeProductIds.length;
        const products = await fetchProductsBySignal(viewSignal, limit);
        if (products.length >= Math.min(limit / 2, 5)) {
            const enrichedProducts = await enrichWithMedia(products);
            return {
                products: enrichedProducts,
                signalUsed: "view",
                debug,
            };
        }
    }

    // 4. Search History
    const searchSignal = await getSearchHistorySignal(userId);
    if (searchSignal) {
        debug.searchesFound =
            searchSignal.categoryIds.length +
            searchSignal.brandIds.length +
            searchSignal.productTypeIds.length;
        const products = await fetchProductsBySignal(searchSignal, limit);
        if (products.length > 0) {
            const enrichedProducts = await enrichWithMedia(products);
            return {
                products: enrichedProducts,
                signalUsed: "search",
                debug,
            };
        }
    }

    // 5. Fallback to defaults
    const defaultProducts = await fetchDefaultRecommendations(limit);
    const enrichedProducts = await enrichWithMedia(defaultProducts);
    return {
        products: enrichedProducts,
        signalUsed: "default",
        debug,
    };
}

/**
 * Get "You May Also Like" recommendations for a specific product
 *
 * @param productId - The product to base recommendations on
 * @param limit - Maximum number of products to return
 */
export async function getSimilarProducts(
    productId: string,
    limit: number = 8
): Promise<any[]> {
    // Get the source product details
    const sourceProduct = await db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: {
            categoryId: true,
            subcategoryId: true,
            productTypeId: true,
            brandId: true,
        },
    });

    if (!sourceProduct) return [];

    // Find similar products
    const similarProducts = await db.query.products.findMany({
        with: {
            brand: true,
            variants: true,
            category: true,
            subcategory: true,
            productType: true,
        },
        where: and(
            ne(products.id, productId),
            eq(products.isActive, true),
            eq(products.isPublished, true),
            eq(products.isDeleted, false),
            eq(products.verificationStatus, "approved"),
            // Same category or product type
            sql`(
                ${products.categoryId} = ${sourceProduct.categoryId}::uuid
                OR ${products.productTypeId} = ${sourceProduct.productTypeId}::uuid
            )`
        ),
        limit,
        orderBy: [
            // Prioritize same product type
            sql`CASE WHEN ${products.productTypeId} = ${sourceProduct.productTypeId}::uuid THEN 0 ELSE 1 END ASC`,
            // Then same subcategory
            sql`CASE WHEN ${products.subcategoryId} = ${sourceProduct.subcategoryId}::uuid THEN 0 ELSE 1 END ASC`,
            // Then best sellers
            sql`CASE WHEN ${products.isBestSeller} = true THEN 0 ELSE 1 END ASC`,
            desc(products.createdAt),
        ],
    });

    return enrichWithMedia(similarProducts);
}

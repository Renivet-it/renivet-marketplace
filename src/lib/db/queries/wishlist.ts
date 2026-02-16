import { mediaCache } from "@/lib/redis/methods";
import { cachedWishlistSchema, CreateWishlist } from "@/lib/validations";
import { and, count, eq } from "drizzle-orm";
import { db } from "..";
import { products, wishlists } from "../schema";

class UserWishlistQuery {
    async getUserWishlistCount(userId: string) {
        const [data] = await db
            .select({ count: count() })
            .from(wishlists)
            .leftJoin(products, eq(wishlists.productId, products.id))
            .where(
                and(
                    eq(wishlists.userId, userId),
                    eq(products.isDeleted, false),
                    eq(products.isPublished, true),
                    eq(products.isActive, true)
                )
            );
        return data?.count || 0;
    }

    async getUserWishlist(userId: string) {
        const rawData = await db.query.wishlists.findMany({
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        category: true,
                        subcategory: true,
                        productType: true,
                        options: true,
                    },
                    where: (products, { and, eq }) =>
                        and(
                            eq(products.isDeleted, false),
                            eq(products.isPublished, true),
                            eq(products.isActive, true)
                        ),
                },
            },
            where: eq(wishlists.userId, userId),
        });

        // Filter out wishlist items where product is null (due to above filtering)
        const data = rawData.filter((d) => d.product);
        const productsList = data.map((d) => d.product);

        const mediaIds = new Set<string>();
        for (const product of productsList) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
                if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
                mediaIds.add(product.sustainabilityCertificate);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProducts = productsList.map((product) => ({
            ...product,
            media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
            variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
        }));

        const enhancedData = data.map((d) => ({
            ...d,
            product: enhancedProducts.find((p) => p.id === d.productId)!,
        }));

        const parsed = cachedWishlistSchema.array().parse(enhancedData);
        return parsed;
    }

    async getProductInWishlist(userId: string, productId: string) {
        const data = await db.query.wishlists.findFirst({
            with: {
                product: {
                    with: {
                        brand: true,
                        variants: true,
                        category: true,
                        subcategory: true,
                        productType: true,
                        options: true,
                    },
                },
            },
            where: and(
                eq(wishlists.userId, userId),
                eq(wishlists.productId, productId)
            ),
        });

        const product = data?.product;
        if (!product) return null;

        const mediaIds = new Set<string>();
        product.media.forEach((media) => mediaIds.add(media.id));
        product.variants.forEach((variant) => {
            if (variant.image) mediaIds.add(variant.image);
        });
        if (product.sustainabilityCertificate)
            mediaIds.add(product.sustainabilityCertificate);

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedProduct = {
            ...product,
            media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
            })),
            sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
            variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
            })),
        };

        const enhancedData = {
            ...data,
            product: enhancedProduct,
        };

        const parsed = cachedWishlistSchema.optional().parse(enhancedData);
        return parsed;
    }

    async addProductInWishlist(values: CreateWishlist) {
        const data = await db
            .insert(wishlists)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteProductInWishlist(id: string) {
        const data = await db
            .delete(wishlists)
            .where(eq(wishlists.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async dropUserWishlist(userId: string) {
        const data = await db
            .delete(wishlists)
            .where(eq(wishlists.userId, userId))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const userWishlistQueries = new UserWishlistQuery();

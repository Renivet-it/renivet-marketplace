import { cachedWishlistSchema, CreateWishlist } from "@/lib/validations";
import { and, eq } from "drizzle-orm";
import { db } from "..";
import { wishlists } from "../schema";

class UserWishlistQuery {
    async getUserWishlistCount(userId: string) {
        const data = await db.$count(wishlists, eq(wishlists.userId, userId));
        return +data || 0;
    }

    async getUserWishlist(userId: string) {
        const data = await db.query.wishlists.findMany({
            with: {
                product: {
                    with: {
                        brand: true,
                    },
                },
            },
            where: eq(wishlists.userId, userId),
        });

        const parsed = cachedWishlistSchema.array().parse(
            data.map((x) => ({
                ...x,
                product: {
                    ...x.product,
                    price: x.product.price.toString(),
                },
            }))
        );
        return parsed;
    }

    async getProductInWishlist(userId: string, productId: string) {
        const data = await db.query.wishlists.findFirst({
            with: {
                product: {
                    with: {
                        brand: true,
                    },
                },
            },
            where: and(
                eq(wishlists.userId, userId),
                eq(wishlists.productId, productId)
            ),
        });

        const parsed = cachedWishlistSchema.optional().parse({
            ...data,
            product: {
                ...data?.product,
                price: data?.product.price.toString(),
            },
        });
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

    async deleteProductInWishlist(userId: string, productId: string) {
        const data = await db
            .delete(wishlists)
            .where(
                and(
                    eq(wishlists.userId, userId),
                    eq(wishlists.productId, productId)
                )
            )
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

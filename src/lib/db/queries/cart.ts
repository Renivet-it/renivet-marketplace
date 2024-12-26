import { cachedCartSchema, CreateCart, UpdateCart } from "@/lib/validations";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "..";
import { carts } from "../schema";

class UserCartQuery {
    async getUserCartProductCount(userId: string) {
        const data = await db.$count(carts, eq(carts.userId, userId));
        return +data || 0;
    }

    async getUserCart(userId: string) {
        const data = await db.query.carts.findMany({
            with: {
                item: {
                    with: {
                        product: {
                            with: {
                                brand: true,
                                variants: true,
                            },
                        },
                    },
                },
            },
            where: eq(carts.userId, userId),
        });

        const parsed = cachedCartSchema.array().parse(
            data.map((x) => ({
                ...x,
                size: x.item.size,
                color: x.item.color,
                item: x.item.product,
            }))
        );
        return parsed;
    }

    async getProductInCart({ userId, sku }: { userId: string; sku: string }) {
        const data = await db.query.carts.findFirst({
            with: {
                item: {
                    with: {
                        product: {
                            with: {
                                brand: true,
                                variants: true,
                            },
                        },
                    },
                },
            },
            where: and(eq(carts.userId, userId), eq(carts.sku, sku)),
        });

        const parsed = cachedCartSchema.optional().parse(
            data
                ? {
                      ...data,
                      size: data.item.size,
                      color: data.item.color,
                      item: data.item.product,
                  }
                : undefined
        );
        return parsed;
    }

    async addProductToCart(values: CreateCart) {
        const data = await db
            .insert(carts)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateProductInCart(id: string, values: UpdateCart) {
        const data = await db
            .update(carts)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(carts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateStatusInCart(userId: string, status: boolean) {
        const data = await db
            .update(carts)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(eq(carts.userId, userId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteProductFromCart(id: string) {
        const data = await db
            .delete(carts)
            .where(eq(carts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteProductsFromCart(userId: string, skus: string[]) {
        const data = await db
            .delete(carts)
            .where(and(inArray(carts.sku, skus), eq(carts.userId, userId)))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async dropUserCart(userId: string) {
        const data = await db
            .delete(carts)
            .where(eq(carts.userId, userId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async dropActiveItemsFromCart(userId: string) {
        const data = await db
            .delete(carts)
            .where(and(eq(carts.userId, userId), eq(carts.status, true)))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const userCartQueries = new UserCartQuery();

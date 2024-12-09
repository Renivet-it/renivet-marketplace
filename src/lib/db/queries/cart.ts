import {
    cachedCartSchema,
    CreateCart,
    Product,
    UpdateCart,
} from "@/lib/validations";
import { and, eq, sql } from "drizzle-orm";
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
                product: {
                    with: {
                        brand: true,
                    },
                },
            },
            where: eq(carts.userId, userId),
        });

        const parsed = cachedCartSchema.array().parse(
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

    async getProductInCart({
        userId,
        productId,
        size,
        color,
    }: {
        userId: string;
        productId: string;
        size?: Product["sizes"][number]["name"];
        color?: string;
    }) {
        const data = await db.query.carts.findFirst({
            with: {
                product: {
                    with: {
                        brand: true,
                    },
                },
            },
            where: and(
                eq(carts.userId, userId),
                eq(carts.productId, productId),
                size ? eq(carts.size, size) : undefined,
                color ? sql`color->>'hex' = ${color}` : undefined
            ),
        });

        const parsed = cachedCartSchema.optional().parse(
            data
                ? {
                      ...data,
                      product: {
                          ...data?.product,
                          price: data?.product.price.toString(),
                      },
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

    async deleteProductFromCart(id: string) {
        const data = await db
            .delete(carts)
            .where(eq(carts.id, id))
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
}

export const userCartQueries = new UserCartQuery();

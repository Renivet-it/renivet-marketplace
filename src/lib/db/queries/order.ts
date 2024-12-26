import {
    CreateOrder,
    OrderWithItemAndBrand,
    orderWithItemAndBrandSchema,
    UpdateOrderStatus,
} from "@/lib/validations";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "..";
import { orders } from "../schema";

class OrderQuery {
    async getOrdersByIds(orderIds: string[], year?: number) {
        const data = await db.query.orders.findMany({
            where: and(
                inArray(orders.id, orderIds),
                year
                    ? and(
                          gte(orders.createdAt, new Date(year, 0, 1)),
                          lte(orders.createdAt, new Date(year, 11, 31))
                      )
                    : undefined
            ),
            with: {
                items: {
                    with: {
                        productVariant: {
                            with: { product: { with: { brand: true } } },
                        },
                    },
                },
            },
        });

        const parsed: OrderWithItemAndBrand[] = orderWithItemAndBrandSchema
            .array()
            .parse(
                data.map((d) => ({
                    ...d,
                    items: d.items.map(
                        ({
                            productVariant: { product, ...restV },
                            ...rest
                        }) => ({
                            ...rest,
                            productVariant: restV,
                            product,
                        })
                    ),
                }))
            );

        return parsed;
    }

    async getOrderById(orderId: string, year?: number) {
        const data = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                year
                    ? and(
                          gte(orders.createdAt, new Date(year, 0, 1)),
                          lte(orders.createdAt, new Date(year, 11, 31))
                      )
                    : undefined
            ),
            with: {
                items: {
                    with: {
                        productVariant: {
                            with: { product: { with: { brand: true } } },
                        },
                    },
                },
            },
        });
        if (!data) return null;

        const parsed: OrderWithItemAndBrand = orderWithItemAndBrandSchema.parse(
            {
                ...data,
                items: data.items.map(
                    ({ productVariant: { product, ...restV }, ...rest }) => ({
                        ...rest,
                        productVariant: restV,
                        product,
                    })
                ),
            }
        );

        return parsed;
    }

    async getOrdersByUserId(userId: string, year?: number) {
        const data = await db.query.orders.findMany({
            where: and(
                eq(orders.userId, userId),
                year
                    ? and(
                          gte(orders.createdAt, new Date(year, 0, 1)),
                          lte(orders.createdAt, new Date(year, 11, 31))
                      )
                    : undefined
            ),
            orderBy: [desc(orders.createdAt)],
            with: {
                items: {
                    with: {
                        productVariant: {
                            with: { product: { with: { brand: true } } },
                        },
                    },
                },
            },
        });

        const parsed: OrderWithItemAndBrand[] = orderWithItemAndBrandSchema
            .array()
            .parse(
                data.map((d) => ({
                    ...d,
                    items: d.items.map(
                        ({
                            productVariant: { product, ...restV },
                            ...rest
                        }) => ({
                            ...rest,
                            productVariant: restV,
                            product,
                        })
                    ),
                }))
            );

        return parsed;
    }

    async createOrder(values: CreateOrder) {
        const data = await db
            .insert(orders)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateOrderStatus(id: string, values: UpdateOrderStatus) {
        const data = await db
            .update(orders)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async bulkUpdateOrderStatus(ids: string[], values: UpdateOrderStatus) {
        const data = await db
            .update(orders)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(inArray(orders.id, ids))
            .returning()
            .then((res) => res);

        return data;
    }

    async updateOrderAddress(id: string, addressId: string) {
        const data = await db
            .update(orders)
            .set({
                addressId,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const orderQueries = new OrderQuery();

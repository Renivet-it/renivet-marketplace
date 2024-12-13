import {
    CreateOrder,
    OrderWithItemAndBrand,
    orderWithItemAndBrandSchema,
    UpdateOrderStatus,
} from "@/lib/validations";
import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { orders } from "../schema";

class OrderQuery {
    async getOrderById(orderId: string) {
        const data = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                items: {
                    with: {
                        product: {
                            with: {
                                brand: true,
                            },
                        },
                    },
                },
            },
        });
        if (!data) return null;

        const parsed: OrderWithItemAndBrand = orderWithItemAndBrandSchema.parse(
            {
                ...data,
                items: data.items.map(({ product }) => product),
            }
        );

        return parsed;
    }

    async getOrdersByUserId(userId: string) {
        const data = await db.query.orders.findMany({
            where: eq(orders.userId, userId),
            orderBy: [desc(orders.createdAt)],
            with: {
                items: {
                    with: {
                        product: {
                            with: {
                                brand: true,
                            },
                        },
                    },
                },
            },
        });

        const parsed: OrderWithItemAndBrand[] = orderWithItemAndBrandSchema
            .array()
            .parse(
                data.map((order) => ({
                    ...order,
                    items: order.items.map(({ product }) => product),
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
            .set(values)
            .where(eq(orders.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const orderQueries = new OrderQuery();

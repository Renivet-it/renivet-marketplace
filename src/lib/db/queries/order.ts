import { mediaCache } from "@/lib/redis/methods";
import {
    CreateOrder,
    Order,
    OrderWithItemAndBrand,
    orderWithItemAndBrandSchema,
    UpdateOrderStatus,
} from "@/lib/validations";
import { and, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "..";
import { orderItems, orders, orderShipments, products } from "../schema";

class OrderQuery {
    async getAllOrders() {
        const data = await db.query.orders.findMany({
            with: {
                address: true,
                shipments: true,
                items: {
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
                        variant: true,
                    },
                },
            },
        });

        const products = data.flatMap((d) => d.items.map((i) => i.product));

        const mediaIds = new Set<string>();
        for (const product of products) {
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

        const enhancedProducts = products.map((product) => ({
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
            items: d.items.map((i) => ({
                ...i,
                product: enhancedProducts.find((p) => p.id === i.productId),
            })),
        }));

        const parsed: OrderWithItemAndBrand[] = orderWithItemAndBrandSchema
            .array()
            .parse(enhancedData);

        return parsed;
    }

    async getOrders({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.orders.findMany({
            where: !!search ? ilike(orders.id, `%${search}%`) : undefined,
            with: {
                address: true,
                shipments: true,
                items: {
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
                        variant: true,
                    },
                },
            },
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(orders.createdAt)],
            extras: {
                count: db
                    .$count(
                        orders,
                        !!search ? ilike(orders.id, `%${search}%`) : undefined
                    )
                    .as("order_count"),
            },
        });

        const products = data.flatMap((d) => d.items.map((i) => i.product));

        const mediaIds = new Set<string>();
        for (const product of products) {
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

        const enhancedProducts = products.map((product) => ({
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
            items: d.items.map((i) => ({
                ...i,
                product: enhancedProducts.find((p) => p.id === i.productId),
            })),
        }));

        const parsed: OrderWithItemAndBrand[] = orderWithItemAndBrandSchema
            .array()
            .parse(enhancedData);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    // async getOrdersByBrandId(brandId: string) {
    //     const filteredProducts = db
    //         .select({ id: products.id })
    //         .from(products)
    //         .where(eq(products.brandId, brandId))
    //         .as("filtered_products");

    //     const filteredOrderItems = db
    //         .select({ orderId: orderItems.orderId })
    //         .from(orderItems)
    //         .where(
    //             sql`${orderItems.productId} IN (SELECT id FROM filtered_products)`
    //         )
    //         .as("filtered_order_items");

    //     const ordersForBrand = db
    //         .with(filteredProducts, filteredOrderItems)
    //         .select()
    //         .from(orders)
    //         .where(
    //             sql`${orders.id} IN (SELECT order_id FROM filtered_order_items)`
    //         );

    //     const data = await ordersForBrand;
    //     return data;
    // }
    async getOrdersByBrandId(brandId: string): Promise<Order[]> {
        const filteredProducts = db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.brandId, brandId))
            .as("filtered_products");

        const filteredOrderItems = db
            .select({ orderId: orderItems.orderId })
            .from(orderItems)
            .where(
                sql`${orderItems.productId} IN (SELECT id FROM filtered_products)`
            )
            .as("filtered_order_items");
        const ordersForBrand = db
            .with(filteredProducts, filteredOrderItems)
            .select({
                order: orders, // Select all order fields
                shiprocketOrderId: orderShipments?.shiprocketOrderId ?? undefined, // Select only shiprocketOrderId
                shiprocketShipmentId: orderShipments?.shiprocketShipmentId ?? undefined,
            })
            .from(orders)
            .leftJoin(orderShipments, eq(orders.id, orderShipments.orderId)) // Join with orderShipments
            .where(
                sql`${orders.id} IN (SELECT order_id FROM filtered_order_items)`
            );

        const data = await ordersForBrand;

        // Map the data to a cleaner format if needed
        const formattedData = data.map((item) => ({
            ...item.order,
            shiprocketOrderId: item?.shiprocketOrderId || null,
            shiprocketShipmentId: item?.shiprocketShipmentId || null,
        }));

        return formattedData;
    }

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
                address: true,
                shipments: true,
                items: {
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
                        variant: true,
                    },
                },
            },
        });

        const products = data.flatMap((d) => d.items.map((i) => i.product));

        const mediaIds = new Set<string>();
        for (const product of products) {
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

        const enhancedProducts = products.map((product) => ({
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
            items: d.items.map((i) => ({
                ...i,
                product: enhancedProducts.find((p) => p.id === i.productId),
            })),
        }));

        const parsed: OrderWithItemAndBrand[] = orderWithItemAndBrandSchema
            .array()
            .parse(enhancedData);

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
                address: true,
                shipments: true,
                items: {
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
                        variant: true,
                    },
                },
            },
        });
        if (!data) return null;

        const products = data.items.map((i) => i.product);

        const mediaIds = new Set<string>();
        for (const product of products) {
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

        const enhancedProducts = products.map((product) => ({
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

        const enhancedData = {
            ...data,
            items: data.items.map((i) => ({
                ...i,
                product: enhancedProducts.find((p) => p.id === i.productId),
            })),
        };

        const parsed: OrderWithItemAndBrand =
            orderWithItemAndBrandSchema.parse(enhancedData);
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
                address: true,
                shipments: true,
                items: {
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
                        variant: true,
                    },
                },
            },
        });

        const products = data.flatMap((d) => d.items.map((i) => i.product));

        const mediaIds = new Set<string>();
        for (const product of products) {
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

        const enhancedProducts = products.map((product) => ({
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
            items: d.items.map((i) => ({
                ...i,
                product: enhancedProducts.find((p) => p.id === i.productId),
            })),
        }));

        const parsed: OrderWithItemAndBrand[] = orderWithItemAndBrandSchema
            .array()
            .parse(enhancedData);

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

    async orderShipmentDetailsByOrderId(orderId: string) {
        const data = await db.query.orderShipments.findFirst({
            where: eq(orderShipments.orderId, orderId),
        });
        return data;
    }

    async updateAwbGenerationStatus(shipmentId: number, status: boolean) {
        const result = await db
            .update(orderShipments)
            .set({
                isAwbGenerated: status,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async createAwbNumber(shipmentId: number, awbCode: string) {
        const result = await db
            .update(orderShipments)
            .set({
                awbNumber: awbCode,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async getShipmentDetailsByShipmentId(shipmentId: number) {
        const result = await db.query.orderShipments.findMany({
            where: eq(orderShipments.shiprocketShipmentId, shipmentId),
        });
        return result;
    }

    async updatePickUpStatus(shipmentId: number, status: boolean) {
        const result = await db
            .update(orderShipments)
            .set({
                isPickupScheduled: status,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async savePickupShiprocketResponse(shipmentId: number, shipmentDetails: Record<string, any>) {
        const result = await db
            .update(orderShipments)
            .set({
                pickUpDetailsShipRocketJson: shipmentDetails,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async saveAwbShiprocketResponse(shipmentId: number, awbDetails: Record<string, any>) {
        const result = await db
            .update(orderShipments)
            .set({
                awbDetailsShipRocketJson: awbDetails,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async createPickupDetails(shipmentId: number, pickupToken: any, pickupDate: any){
        const result = await db
            .update(orderShipments)
            .set({
                pickupTokenNumber: pickupToken,
                pickupScheduledDate: pickupDate
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }
}

export const orderQueries = new OrderQuery();

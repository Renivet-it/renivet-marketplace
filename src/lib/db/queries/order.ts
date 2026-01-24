import { mediaCache } from "@/lib/redis/methods";
import {
    CreateOrder,
    Order,
    OrderWithItemAndBrand,
    orderWithItemAndBrandSchema,
    UpdateOrderStatus,
} from "@/lib/validations";
import {
    returnShipment,
    returnShipmentAddress,
    returnShipmentItem,
    returnShipmentPayment,
    returnShipmentReason,
} from "@/lib/validations/order-return";
import {
    and,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    lt,
    lte,
    or,
    sql,
} from "drizzle-orm";
import { db } from "..";
import {
    addresses,
    brandProductTypePacking,
    brands,
    orderItems,
    orders,
    orderShipments,
    ordersIntent,
    packingTypes,
    products,
    products as productTable,
    productTypes,
    returnShipments,
    shipmentDiscrepancies,
    users,
} from "../schema";
import {
    returnAddressDetails,
    returnItemDetails,
    returnPaymentDetails,
    returnReasonDetails,
} from "../schema/order-return-exchange";

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
                                // brand: true,
                                brand: {
                                    with: {
                                        confidential: true, // Loads all confidential data
                                        packingRules: {
                                            with: {
                                                packingType: true,
                                            },
                                        },
                                    },
                                },
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
        brandIds,
        startDate,
        endDate,
        statusTab,
    }: {
        limit: number;
        page: number;
        search?: string;
        brandIds?: string[];
        startDate?: string;
        endDate?: string;
        statusTab?:
            | "all"
            | "ready_to_pickup"
            | "pickup_scheduled"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "rto";
    }) {
        const whereConditions = [];

        if (search) {
            whereConditions.push(ilike(orders.id, `%${search}%`));
        }

        if (brandIds?.length) {
            whereConditions.push(
                inArray(
                    orders.id,
                    db
                        .select({ id: orderItems.orderId })
                        .from(orderItems)
                        .innerJoin(
                            productTable,
                            eq(orderItems.productId, productTable.id)
                        )
                        .where(inArray(productTable.brandId, brandIds))
                )
            );
        }

        if (startDate && endDate) {
            whereConditions.push(
                and(
                    gte(orders.createdAt, new Date(startDate)),
                    lte(orders.createdAt, new Date(endDate))
                )
            );
        } else if (startDate) {
            whereConditions.push(gte(orders.createdAt, new Date(startDate)));
        } else if (endDate) {
            whereConditions.push(lte(orders.createdAt, new Date(endDate)));
        }

        // Status tab filtering
        if (statusTab && statusTab !== "all") {
            switch (statusTab) {
                case "ready_to_pickup":
                    // orders.status = 'pending' AND orderShipments.isPickupScheduled = false
                    whereConditions.push(eq(orders.status, "pending"));
                    whereConditions.push(
                        inArray(
                            orders.id,
                            db
                                .select({ orderId: orderShipments.orderId })
                                .from(orderShipments)
                                .where(
                                    eq(orderShipments.isPickupScheduled, false)
                                )
                        )
                    );
                    break;
                case "pickup_scheduled":
                    // orders.status = 'pending' AND orderShipments.isPickupScheduled = true AND orderShipments.status = 'pending'
                    whereConditions.push(eq(orders.status, "pending"));
                    whereConditions.push(
                        inArray(
                            orders.id,
                            db
                                .select({ orderId: orderShipments.orderId })
                                .from(orderShipments)
                                .where(
                                    and(
                                        eq(
                                            orderShipments.isPickupScheduled,
                                            true
                                        ),
                                        eq(orderShipments.status, "pending")
                                    )
                                )
                        )
                    );
                    break;
                case "shipped":
                    // orders.status = 'processing' OR orderShipments.status = 'in_transit'
                    whereConditions.push(
                        or(
                            eq(orders.status, "processing"),
                            inArray(
                                orders.id,
                                db
                                    .select({ orderId: orderShipments.orderId })
                                    .from(orderShipments)
                                    .where(
                                        eq(orderShipments.status, "in_transit")
                                    )
                            )
                        )
                    );
                    break;
                case "delivered":
                    whereConditions.push(eq(orders.status, "delivered"));
                    break;
                case "cancelled":
                    whereConditions.push(eq(orders.status, "cancelled"));
                    break;
                case "rto":
                    // orderShipments.is_return_label_generated = true OR orderShipments.is_replacement_label_generated = true
                    whereConditions.push(
                        inArray(
                            orders.id,
                            db
                                .select({ orderId: orderShipments.orderId })
                                .from(orderShipments)
                                .where(
                                    or(
                                        eq(
                                            orderShipments.is_return_label_generated,
                                            true
                                        ),
                                        eq(
                                            orderShipments.is_replacement_label_generated,
                                            true
                                        )
                                    )
                                )
                        )
                    );
                    break;
            }
        }

        const data = await db.query.orders.findMany({
            where: whereConditions.length ? and(...whereConditions) : undefined,
            with: {
                address: true,
                shipments: true,
                user: true,
                items: {
                    with: {
                        product: {
                            with: {
                                brand: {
                                    with: {
                                        confidential: true, // Loads all confidential data
                                        packingRules: {
                                            with: {
                                                packingType: true,
                                            },
                                        },
                                    },
                                },
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
                        whereConditions.length
                            ? and(...whereConditions)
                            : undefined
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
    async getOrdersByBrandId(
        brandId: string,
        page: number = 1,
        limit: number = 10,
        shipmentStatus?: string,
        isRto?: boolean
    ) {
        try {
            const offset = (page - 1) * limit;
            // Step 1: Get all products for this brand
            const filteredProducts = db
                .select({ id: products.id })
                .from(products)
                .where(eq(products.brandId, brandId))
                .as("filtered_products");

            // Step 2: Get all order items that contain these products
            const filteredOrderItems = db
                .select({ orderId: orderItems.orderId })
                .from(orderItems)
                .where(
                    sql`${orderItems.productId} IN (SELECT id FROM filtered_products)`
                )
                .as("filtered_order_items");

            // EXTRA FILTER if shipmentStatus is passed
            const extraShipmentFilter = shipmentStatus
                ? sql`AND ${orderShipments.status} = ${shipmentStatus}`
                : sql``;
            const extraRtoFilter = isRto
                ? sql`
      AND (
        ${orderShipments.is_return_label_generated} = true
        OR ${orderShipments.is_replacement_label_generated} = true
      )
    `
                : sql``;

            // Step 3: Count total matching orders
            //   const totalResult = await db
            //     .with(filteredProducts, filteredOrderItems)
            //     .select({ count: sql<number>`COUNT(*)` })
            //     .from(orders)
            // .where(
            //   sql`${orders.id} IN (SELECT order_id FROM filtered_order_items) ${extraShipmentFilter}`
            // )
            // ;

            const totalResult = await db
                .with(filteredProducts, filteredOrderItems)
                .select({ count: sql<number>`COUNT(*)` })
                .from(orders)
                .leftJoin(orderShipments, eq(orders.id, orderShipments.orderId))
                .where(
                    sql`${orders.id} IN (SELECT order_id FROM filtered_order_items) ${extraShipmentFilter} ${extraRtoFilter}
`
                );
            console.log(totalResult, "shipmentStatusshipmentStatus");

            const total = Number(totalResult[0]?.count) || 0;
            // Step 4: Get paginated orders
            const ordersForBrand = await db
                .with(filteredProducts, filteredOrderItems)
                .select({
                    id: orders.id,
                    userId: orders.userId,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    phone: users.phone,
                    shiprocketOrderId: orderShipments.shiprocketOrderId,
                    shiprocketShipmentId: orderShipments.shiprocketShipmentId,
                    awbNumber: orderShipments.awbNumber,
                    uploadWbn: orderShipments.uploadWbn,
                    delhiveryClientId: orderShipments.delhiveryClientId,
                    givenLength: orderShipments.givenLength,
                    givenWidth: orderShipments.givenWidth,
                    givenHeight: orderShipments.givenHeight,
                    delhiverySortCode: orderShipments.delhiverySortCode,
                    isAwbGenerated: orderShipments.isAwbGenerated,
                    receiptId: orders.receiptId,
                    paymentId: orders.paymentId,
                    paymentMethod: orders.paymentMethod,
                    paymentStatus: orders.paymentStatus,
                    status: orders.status,
                    addressId: orders.addressId,
                    totalItems: orders.totalItems,
                    taxAmount: orders.taxAmount,
                    courierName: orderShipments.courierName,
                    deliveryAmount: orders.deliveryAmount,
                    discountAmount: orders.discountAmount,
                    totalAmount: orders.totalAmount,
                    isReturnLabelGenerated:
                        orderShipments.is_return_label_generated,
                    isReplacementLabelGenerated:
                        orderShipments.is_replacement_label_generated,
                    street: addresses.street,
                    city: addresses.city,
                    state: addresses.state,
                    zip: addresses.zip,
                    brandId: orderShipments.brandId,
                    productId: orderItems.productId,
                    shipmentStatus: orderShipments.status,
                    isRto: sql<boolean>`
      (${orderShipments.is_return_label_generated} = true
       OR ${orderShipments.is_replacement_label_generated} = true)
    `.as("is_rto"),
                    createdAt: orders.createdAt,
                    updatedAt: orders.updatedAt,
                })
                .from(orders)
                .leftJoin(users, eq(orders.userId, users.id))
                .leftJoin(orderShipments, eq(orders.id, orderShipments.orderId))
                .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
                .leftJoin(addresses, eq(orders.addressId, addresses.id)) // ⭐ NEW JOIN
                .where(
                    sql`${orders.id} IN (SELECT order_id FROM filtered_order_items) ${extraShipmentFilter} ${extraRtoFilter}`
                )
                .orderBy(desc(orders.createdAt))
                .limit(limit)
                .offset(offset);
            console.log(ordersForBrand, "ordersForBrandordersForBrand");

            return {
                data: ordersForBrand.map((item) => ({
                    id: item.id,
                    userId: item.userId,
                    firstName: item.firstName,
                    lastName: item.lastName,
                    phone: item.phone,
                    shiprocketOrderId: item.shiprocketOrderId ?? undefined,
                    shiprocketShipmentId:
                        item.shiprocketShipmentId ?? undefined,
                    awbNumber: item.awbNumber ?? undefined,
                    uploadWbn: item.uploadWbn ?? undefined,
                    delhiveryClientId: item.delhiveryClientId ?? undefined,
                    delhiverySortCode: item.delhiverySortCode ?? undefined,
                    givenLength: item.givenLength,
                    givenWidth: item.givenWidth,
                    givenHeight: item.givenHeight,
                    isAwbGenerated: item.isAwbGenerated,
                    courierName: item.courierName ?? undefined,
                    receiptId: item.receiptId,
                    paymentId: item.paymentId,
                    paymentMethod: item.paymentMethod,
                    paymentStatus: item.paymentStatus,
                    status: item.status,
                    addressId: item.addressId,
                    totalItems: item.totalItems,
                    taxAmount: item.taxAmount,
                    deliveryAmount: item.deliveryAmount,
                    discountAmount: item.discountAmount,
                    totalAmount: item.totalAmount,
                    isReturnLabelGenerated: item.isReturnLabelGenerated,
                    isReplacementLabelGenerated:
                        item.isReplacementLabelGenerated,
                    street: item.street,
                    city: item.city,
                    state: item.state,
                    zip: item.zip,
                    brandId: item.brandId,
                    productId: item.productId,
                    shipmentStatus: item.shipmentStatus,
                    isRto: item.isRto, // ⭐ MAIN FLAG
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })),
                total,
            };
        } catch (error) {
            console.error("Error in getOrdersByBrandId:", error);
            throw error;
        }
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
                        returnExchangePolicy: true,
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
        const serverNow = new Date();
        const enhancedData = data.map((d) => ({
            ...d,
            serverNow,
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
    async deleteOrder(orderId: string) {
        const data = await db
            .delete(orders)
            .where(eq(orders.id, orderId))
            .returning()
            .then((res) => res[0] ?? null);

        if (!data) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

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

    async savePickupShiprocketResponse(
        shipmentId: number,
        shipmentDetails: Record<string, any>
    ) {
        const result = await db
            .update(orderShipments)
            .set({
                pickUpDetailsShipRocketJson: shipmentDetails,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async saveAwbShiprocketResponse(
        shipmentId: number,
        awbDetails: Record<string, any>
    ) {
        const result = await db
            .update(orderShipments)
            .set({
                awbDetailsShipRocketJson: awbDetails,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async createPickupDetails(
        shipmentId: number,
        pickupToken: any,
        pickupDate: any
    ) {
        const result = await db
            .update(orderShipments)
            .set({
                pickupTokenNumber: pickupToken,
                pickupScheduledDate: pickupDate,
            })
            .where(eq(orderShipments.shiprocketShipmentId, shipmentId));
        return result;
    }

    async updateShipmentDate(awbNumber: string, shipmentDate: Date) {
        const result = await db
            .update(orderShipments)
            .set({
                shipmentDate: shipmentDate,
            })
            .where(eq(orderShipments.awbNumber, awbNumber));
        return result;
    }

    async getBrandUserItemsDetailsByOrderId(orderId: string) {
        const data = await db.query.orderShipments.findFirst({
            where: (t, { eq }) => eq(t.orderId, orderId),
            with: {
                order: {
                    with: {
                        user: true,
                        item: {
                            with: {
                                product: true,
                                variant: true,
                            },
                        },
                    },
                },
                brand: {
                    with: {
                        confidential: true,
                        packingRules: {
                            with: {
                                packingType: true,
                            },
                        },
                    },
                },
            },
        });
        return data;
    }

    async insertOrderReturnShipement(value: Array<returnShipment>) {
        const result = db.insert(returnShipments).values(value).returning();
        return result;
    }

    async insertOrderReturnAddress(value: Array<returnShipmentAddress>) {
        const result = db
            .insert(returnAddressDetails)
            .values(value)
            .returning();
        return result;
    }

    async insertOrderReturnItemDetails(value: Array<returnShipmentItem>) {
        const result = db.insert(returnItemDetails).values(value).returning();
        return result;
    }

    async insertOrderReturnPaymentDetails(value: Array<returnShipmentPayment>) {
        const result = db
            .insert(returnPaymentDetails)
            .values(value)
            .returning();
        return result;
    }

    async insertOrderReturnReasonDetails(value: Array<returnShipmentReason>) {
        const result = db.insert(returnReasonDetails).values(value).returning();
        return result;
    }

    async updateOrderShipmentReturnflagData(
        orderId: string,
        isRtoReturnProcced: boolean
    ) {
        const result = await db
            .update(orderShipments)
            .set({
                isRtoReturn: isRtoReturnProcced,
            })
            .where(eq(orderShipments.orderId, orderId));
        return result;
    }

    //order-intent query

    /**
     * Create a new order intent
     */
    async createIntent(
        userId: string,
        productId: string,
        values: {
            variantId?: string;
            totalItems?: number;
            totalAmount: number;
            shiprocketRequest?: any; // ✅ new
            shiprocketResponse?: any; // ✅ new
            orderLog?: any;
        },
        metadata?: {
            ipAddress?: string;
            userAgent?: string;
        }
    ) {
        try {
            const data = await db
                .insert(ordersIntent)
                .values({
                    id: crypto.randomUUID(),
                    userId,
                    productId,
                    variantId: values.variantId,
                    totalItems: values.totalItems || 1,
                    totalAmount: values.totalAmount,
                    paymentStatus: "pending",
                    status: "pending",

                    // ✅ New fields, saved as JSONB
                    shiprocketRequest: values.shiprocketRequest || null,
                    shiprocketResponse: values.shiprocketResponse || null,
                    orderLog: values.orderLog || null,

                    logDetails: {
                        created: new Date().toISOString(),
                        status: "initiated",
                        metadata,
                        events: [
                            {
                                type: "creation",
                                timestamp: new Date().toISOString(),
                                message: "Intent created successfully",
                            },
                        ],
                    },
                })
                .returning()
                .then((res) => res[0]);

            return data;
        } catch (error: any) {
            const errorId = crypto.randomUUID();
            console.error(`[${errorId}] Failed to create intent:`, error);

            // Log the error to the database if needed
            await db.insert(ordersIntent).values({
                id: errorId,
                userId,
                productId,
                totalAmount: 0,
                paymentStatus: "failed",
                status: "error",
                logDetails: {
                    error: {
                        message: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString(),
                    },
                    metadata,
                },
            });

            throw new Error(
                `Order intent creation failed. Reference: ${errorId}`
            );
        }
    }

    /**
     * Get order intent by ID
     */
    async getIntentById(id: string) {
        try {
            const data = await db.query.ordersIntent.findFirst({
                where: eq(ordersIntent.id, id),
                with: {
                    product: true,
                    variant: true,
                    user: true,
                },
            });

            if (!data) {
                throw new Error(`Intent ${id} not found`);
            }

            // Update access log
            await db
                .update(ordersIntent)
                .set({
                    logDetails: sql`
            jsonb_set(
              COALESCE(log_details, '{}'::jsonb),
              '{accessLogs}',
              COALESCE(log_details->'accessLogs', '[]'::jsonb) || 
              jsonb_build_object(
                'timestamp', ${new Date().toISOString()},
                'action', 'fetched'
              )
            )
          `,
                })
                .where(eq(ordersIntent.id, id));

            return data;
        } catch (error) {
            console.error(`Failed to fetch intent ${id}:`, error);
            throw error;
        }
    }

    async getAllIntents({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        try {
            const data = await db.query.ordersIntent.findMany({
                where: search
                    ? ilike(ordersIntent.id, `%${search}%`)
                    : undefined,
                with: {
                    product: true,
                    variant: true,
                    user: true,
                },
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(ordersIntent.createdAt)],
                extras: {
                    count: db
                        .$count(
                            ordersIntent,
                            search
                                ? ilike(ordersIntent.id, `%${search}%`)
                                : undefined
                        )
                        .as("intent_count"),
                },
            });

            return {
                data,
                count: +data?.[0]?.count || 0,
            };
        } catch (error) {
            console.error("Failed to fetch all intents:", error);
            throw error;
        }
    }

    /**
     * Get all intents for a user
     */
    async getUserIntents(userId: string) {
        const data = await db.query.ordersIntent.findMany({
            where: eq(ordersIntent.userId, userId),
            with: {
                product: true,
                variant: true,
            },
            orderBy: (intent, { desc }) => [desc(intent.createdAt)],
        });

        return data;
    }

    /**
     * Get pending intents for a user
     */
    async getPendingUserIntents(userId: string) {
        const data = await db.query.ordersIntent.findMany({
            where: and(
                eq(ordersIntent.userId, userId),
                eq(ordersIntent.paymentStatus, "pending")
            ),
            with: {
                product: true,
                variant: true,
            },
        });

        return data;
    }

    /**
     * Update payment status of an intent
     */
    async updatePaymentStatus(
        intentId: string,
        status: "pending" | "paid" | "failed",
        paymentData?: {
            paymentId?: string;
            paymentMethod?: string;
            gatewayResponse?: any;
        }
    ) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                status,
                paymentData,
                message: `Payment status updated to ${status}`,
            };

            const data = await db
                .update(ordersIntent)
                .set({
                    paymentStatus: status,
                    ...(paymentData?.paymentId && {
                        paymentId: paymentData.paymentId,
                    }),
                    ...(paymentData?.paymentMethod && {
                        paymentMethod: paymentData.paymentMethod,
                    }),
                    logDetails: sql`
            jsonb_set(
              COALESCE(log_details, '{}'::jsonb),
              '{events}',
              COALESCE(log_details->'events', '[]'::jsonb) || 
              ${JSON.stringify(logEntry)}::jsonb
            )
          `,
                })
                .where(eq(ordersIntent.id, intentId))
                .returning()
                .then((res) => res[0]);

            return data;
        } catch (error: any) {
            console.error(
                `Failed to update payment status for intent ${intentId}:`,
                error
            );

            // Log the failure
            await db
                .update(ordersIntent)
                .set({
                    logDetails: sql`
            jsonb_set(
              COALESCE(log_details, '{}'::jsonb),
              '{errors}',
              COALESCE(log_details->'errors', '[]'::jsonb) || 
              jsonb_build_object(
                'timestamp', ${new Date().toISOString()},
                'error', ${error.message},
                'statusAttempt', ${status}
              )
            )
          `,
                })
                .where(eq(ordersIntent.id, intentId));

            throw error;
        }
    }

    /**
     * Link an intent to an order after successful payment
     */
    async linkToOrder(intentId: string, orderId: string) {
        const intent = await this.getIntentById(intentId);

        if (intent.paymentStatus !== "paid") {
            throw new Error("Only paid intents can be linked to orders");
        }

        try {
            const data = await db
                .update(ordersIntent)
                .set({
                    orderId,
                    status: "completed",
                    logDetails: sql`
            jsonb_set(
              COALESCE(log_details, '{}'::jsonb),
              '{events}',
              COALESCE(log_details->'events', '[]'::jsonb) || 
              jsonb_build_object(
                'timestamp', ${new Date().toISOString()},
                'orderId', ${orderId},
                'message', 'Linked to order'
              )
            )
          `,
                })
                .where(eq(ordersIntent.id, intentId))
                .returning()
                .then((res) => res[0]);

            return data;
        } catch (error) {
            console.error(
                `Failed to link intent ${intentId} to order ${orderId}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Delete an intent
     */
    async deleteIntent(intentId: string) {
        const data = await db
            .delete(ordersIntent)
            .where(eq(ordersIntent.id, intentId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    /**
     * Clean up expired intents (older than 7 days)
     */
    async cleanupExpiredIntents() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        const data = await db
            .delete(ordersIntent)
            .where(
                and(
                    eq(ordersIntent.paymentStatus, "pending"),
                    lt(ordersIntent.createdAt, cutoffDate)
                )
            )
            .returning();

        return data;
    }
    async getAllPackingTypes({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        try {
            const data = await db.query.packingTypes.findMany({
                where: search
                    ? ilike(packingTypes.id, `%${search}%`)
                    : undefined,

                limit,
                offset: (page - 1) * limit,

                orderBy: [desc(packingTypes.createdAt)],

                extras: {
                    count: db
                        .$count(
                            packingTypes,
                            search
                                ? ilike(packingTypes.id, `%${search}%`)
                                : undefined
                        )
                        .as("packing_type_count"),
                },
            });

            return {
                data,
                count: +data?.[0]?.count || 0,
            };
        } catch (error) {
            console.error("Failed to fetch packing types:", error);
            throw error;
        }
    }

    // async getAllBrandProductTypePacking({
    //   limit,
    //   page,
    //   search,
    // }: {
    //   limit: number;
    //   page: number;
    //   search?: string;
    // }) {
    //   try {
    //     const data = await db.query.brandProductTypePacking.findMany({
    //       // where: search
    //       //   ? or(
    //       //       ilike(brands.name, `%${search}%`),
    //       //       ilike(productTypes.name, `%${search}%`),
    //       //       ilike(packingTypes.name, `%${search}%`)
    //       //     )
    //       //   : undefined,

    //       with: {
    //         brand: true,
    //         productType: true,
    //         packingType: true,
    //       },

    //       limit,
    //       offset: (page - 1) * limit,

    //       orderBy: desc(brandProductTypePacking.createdAt),

    //       extras: {
    //         count: db
    //           .$count(
    //             brandProductTypePacking,
    //           )
    //           .as("brand_product_type_packing_count"),
    //       },
    //     });

    //     return {
    //       data,
    //       count: Number(data?.[0]?.count) || 0,
    //     };
    //   } catch (error) {
    //     console.error(
    //       "Failed to fetch brand-product-type packing configs:",
    //       error
    //     );
    //     throw error;
    //   }
    // }

    // lib/db/queries/discrepancy.ts

    // async getAllShipmentDiscrepancies({
    //   page,
    //   limit,
    //   search,
    // }: {
    //   page: number;
    //   limit: number;
    //   search?: string;
    // }) {
    //   try {
    //     const offset = (page - 1) * limit;

    //     const searchCondition = search
    //       ? or(
    //           ilike(shipmentDiscrepancies.orderId, `%${search}%`),
    //           ilike(brands.name, `%${search}%`),
    //           ilike(products.title, `%${search}%`)
    //         )
    //       : undefined;

    //     const data = await db.query.shipmentDiscrepancies.findMany({
    //       where: searchCondition,

    //       with: {
    //         order: true,
    //         product: true,
    //         brand: true,
    //         brandProductTypePacking: true, // ✅ relation name
    //       },

    //       limit,
    //       offset,

    //       orderBy: desc(shipmentDiscrepancies.createdAt),

    //       extras: {
    //         count: db
    //           .$count(shipmentDiscrepancies, searchCondition)
    //           .as("shipment_discrepancy_count"),
    //       },
    //     });

    //     return {
    //       data,
    //       count: Number(data?.[0]?.count) || 0,
    //     };
    //   } catch (error) {
    //     console.error("Failed to fetch shipment discrepancies:", error);
    //     throw error;
    //   }
    // }

    async getAllBrandProductTypePacking({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        try {
            const offset = (page - 1) * limit;

            /* ---------------- BRAND SEARCH ---------------- */

            let brandIds: string[] | undefined = undefined;

            if (search) {
                const matchedBrands = await db
                    .select({ id: brands.id })
                    .from(brands)
                    .where(ilike(brands.name, `%${search}%`));

                brandIds = matchedBrands.map((b) => b.id);

                // ❗ If no brands match, return empty result early
                if (brandIds.length === 0) {
                    return {
                        data: [],
                        count: 0,
                    };
                }
            }

            /* ---------------- WHERE CONDITION ---------------- */

            const whereCondition = brandIds
                ? inArray(brandProductTypePacking.brandId, brandIds)
                : undefined;

            /* ---------------- DATA QUERY ---------------- */

            const data = await db.query.brandProductTypePacking.findMany({
                where: whereCondition,

                with: {
                    brand: true,
                    productType: true,
                    packingType: true,
                },

                limit,
                offset,
                orderBy: desc(brandProductTypePacking.createdAt),

                extras: {
                    count: db
                        .$count(brandProductTypePacking, whereCondition)
                        .as("brand_product_type_packing_count"),
                },
            });

            return {
                data,
                count: Number(data?.[0]?.count ?? 0),
            };
        } catch (error) {
            console.error(
                "Failed to fetch brand-product-type packing configs:",
                error
            );
            throw error;
        }
    }
    async getBrandProductTypePackingByBrand({
        brandId,
        limit,
        page,
        search,
    }: {
        brandId: string;
        limit: number;
        page: number;
        search?: string;
    }) {
        try {
            const offset = (page - 1) * limit;

            const whereCondition = and(
                eq(brandProductTypePacking.brandId, brandId),
                search ? ilike(productTypes.name, `%${search}%`) : undefined
            );

            const data = await db.query.brandProductTypePacking.findMany({
                where: whereCondition,
                with: {
                    productType: true,
                    packingType: true,
                },
                limit,
                offset,
                orderBy: desc(brandProductTypePacking.createdAt),
                extras: {
                    count: db
                        .$count(brandProductTypePacking, whereCondition)
                        .as("count"),
                },
            });

            return {
                data,
                count: Number(data?.[0]?.count ?? 0),
            };
        } catch (error) {
            console.error("Failed to fetch brand packing rules:", error);
            throw error;
        }
    }

    async getAllShipmentDiscrepancies({
        page,
        limit,
        search,
    }: {
        page: number;
        limit: number;
        search?: string;
    }) {
        try {
            const offset = (page - 1) * limit;

            const searchCondition = search
                ? ilike(shipmentDiscrepancies.orderId, `%${search}%`)
                : undefined;

            const data = await db.query.shipmentDiscrepancies.findMany({
                where: searchCondition,

                with: {
                    order: true,
                    product: true,
                    brand: true,
                    brandProductTypePacking: true,
                },

                limit,
                offset,
                orderBy: desc(shipmentDiscrepancies.createdAt),

                extras: {
                    count: db
                        .$count(shipmentDiscrepancies, searchCondition)
                        .as("shipment_discrepancy_count"),
                },
            });

            return {
                data,
                count: Number(data?.[0]?.count) || 0,
            };
        } catch (error) {
            console.error("Failed to fetch shipment discrepancies:", error);
            throw error;
        }
    }
}

export const orderQueries = new OrderQuery();

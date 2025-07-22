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
import { and, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "..";
import {
    orderItems,
    orders,
    orderShipments,
    products,
    returnShipments,
    users,
    ordersIntent
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
                user: true,
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
async getOrdersByBrandId(brandId: string, page: number = 1, limit: number = 10) {
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

    // Step 3: Count total matching orders
  const totalResult = await db
    .with(filteredProducts, filteredOrderItems)
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(
      sql`${orders.id} IN (SELECT order_id FROM filtered_order_items)`
    );
  // Convert count to number explicitly
  const total = Number(totalResult[0]?.count) || 0;
console.log(total, "toitalsc");
    // Step 4: Get paginated orders
    const ordersForBrand = await db
      .with(filteredProducts, filteredOrderItems)
      .select({
        id: orders.id,
        userId: orders.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        shiprocketOrderId: orderShipments.shiprocketOrderId,
        shiprocketShipmentId: orderShipments.shiprocketShipmentId,
        receiptId: orders.receiptId,
        paymentId: orders.paymentId,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        status: orders.status,
        addressId: orders.addressId,
        totalItems: orders.totalItems,
        taxAmount: orders.taxAmount,
        deliveryAmount: orders.deliveryAmount,
        discountAmount: orders.discountAmount,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(orderShipments, eq(orders.id, orderShipments.orderId))
      .where(
        sql`${orders.id} IN (SELECT order_id FROM filtered_order_items)`
      )
      .limit(limit)
      .offset(offset);

    return {
      data: ordersForBrand.map((item) => ({
        id: item.id,
        userId: item.userId,
        firstName: item.firstName,
        lastName: item.lastName,
        shiprocketOrderId: item.shiprocketOrderId ?? undefined,
        shiprocketShipmentId: item.shiprocketShipmentId ?? undefined,
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

    async updateOrderShipmentReturnflagData(orderId: string, isRtoReturnProcced: boolean) {
        const result = await db
            .update(orderShipments)
            .set({
                isRtoReturn: isRtoReturnProcced
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
    }
  ) {
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
      })
      .returning()
      .then((res) => res[0]);

    return data;
  }

  /**
   * Get order intent by ID
   */
  async getIntentById(id: string) {
    const data = await db.query.ordersIntent.findFirst({
      where: eq(ordersIntent.id, id),
      with: {
        product: true,
        variant: true,
        user: true,
      },
    });

    return data;
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
    }
  ) {
    const updateValues = {
      paymentStatus: status,
      ...(paymentData?.paymentId && { paymentId: paymentData.paymentId }),
      ...(paymentData?.paymentMethod && { 
        paymentMethod: paymentData.paymentMethod 
      }),
    };

    const data = await db
      .update(ordersIntent)
      .set(updateValues)
      .where(eq(ordersIntent.id, intentId))
      .returning()
      .then((res) => res[0]);

    return data;
  }

  /**
   * Link an intent to an order after successful payment
   */
  async linkToOrder(intentId: string, orderId: string) {
    const data = await db
      .update(ordersIntent)
      .set({
        orderId,
        status: "completed",
      })
      .where(eq(ordersIntent.id, intentId))
      .returning()
      .then((res) => res[0]);

    return data;
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
}

export const orderQueries = new OrderQuery();

import { BRAND_EVENTS } from "@/config/brand";
import { DEFAULT_MESSAGES } from "@/config/const";
import { BitFieldSitePermission } from "@/config/permissions";
import { productQueries, refundQueries } from "@/lib/db/queries";
import { razorpay } from "@/lib/razorpay";
import {
    analytics,
    brandCache,
    categoryCache,
    userCartCache,
} from "@/lib/redis/methods";
import { shiprocket } from "@/lib/shiprocket";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import {
    convertPaiseToRupees,
    formatPriceTag,
    generatePickupLocationCode,
    generateReceiptId,
    getRawNumberFromPhone,
    generateOrderId
} from "@/lib/utils";
import {
    categorySchema,
    createOrderItemSchema,
    createOrderSchema,
    productSchema,
    updateOrderStatusSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const ordersRouter = createTRPCRouter({
    getOrders: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;

            const data = await queries.orders.getOrders(input);
            return data;
        }),
    getOrdersByUserId: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                year: z.number().optional(),
            })
        )
        .use(({ input, ctx, next }) => {
            const { user } = ctx;
            if (user.id !== input.userId)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to view this user's orders",
                });

            return next();
        })
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.orders.getOrdersByUserId(
                input.userId,
                input.year
            );
            return data;
        }),
    getOrder: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries, user } = ctx;

            const data = await queries.orders.getOrderById(input.id);
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });

            if (data.userId !== user.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to view this order",
                });

            return data;
        }),
 createOrder: protectedProcedure
.input(
        createOrderSchema.omit({ id: true, receiptId: true }).extend({
            items: z.array(
                createOrderItemSchema
                    .omit({
                        orderId: true,
                    })
                    .extend({
                        brandId: z.string(),
                        price: productSchema.shape.price,
                        categoryId: categorySchema.shape.id,
                    })
            ),
            coupon: z.string().optional(),
            razorpayOrderId: z.string(),
        })
    )
    .use(({ ctx, input, next }) => {
        const { user } = ctx;
        const { userId } = input;

        if (user.id !== userId)
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not allowed to create an order for another user",
            });
        if (user.brand !== null)
            throw new TRPCError({
                code: "FORBIDDEN",
                message: DEFAULT_MESSAGES.ERRORS.USER_NOT_CUSTOMER,
            });

        return next();
    })
    .mutation(async ({ input, ctx }) => {
        const { queries, user, db, schemas } = ctx;

        const existingAddress = user.addresses.find(
            (add) => add.id === input.addressId
        );
        if (!existingAddress)
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Address not found",
            });

        const receiptId = generateReceiptId();

        const existingCategories = await categoryCache.getAll();
        const cachedAllBrands = await brandCache.getAll();
        const brandIds = [
            ...new Set(input.items.map((item) => item.brandId)),
        ];

        const existingBrands = cachedAllBrands.filter((brand) =>
            brandIds.includes(brand.id)
        );

        if (existingBrands.length !== brandIds.length)
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order contains invalid brand(s)",
            });

        const brandsWithoutRzpAccount = existingBrands.filter(
            (brand) => brand.rzpAccountId === null
        );

        if (brandsWithoutRzpAccount.length > 0)
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Product(s) from brand(s) ${brandsWithoutRzpAccount
                    .map((brand) => `'${brand.name}'`)
                    .join(", ")} do not meet the requirements to accept payments, please remove them from the order`,
            });

        try {
            // Generate a readable and concise order_id
            const brandName = existingBrands[0]?.name || "UNKNOWN"; // Use the first brand's name
            const orderId = generateOrderId(brandName);
            console.log("Creating order with new ID:", orderId);

            const newOrder = await queries.orders.createOrder({
                ...input,
                id: orderId,
                receiptId,
                userId: user.id,
            });
            console.log("Database order created successfully:", newOrder);

            await Promise.all([
                db.insert(schemas.orderItems).values(
                    input.items.map((item) => ({
                        ...item,
                        orderId: orderId,
                    }))
                ),
                userCartCache.drop(user.id),
            ]);
            console.log("Order items inserted and cart cleared for user:", user.id);

            const sr = await shiprocket();
            const itemsByBrand = input.items.reduce(
                (acc, item) => {
                    if (!acc[item.brandId]) {
                        acc[item.brandId] = [];
                    }
                    acc[item.brandId].push(item);
                    return acc;
                },
                {} as Record<string, typeof input.items>
            );
            console.log("Items grouped by brand for Shiprocket:", itemsByBrand);

            for (const [brandId, brandItems] of Object.entries(itemsByBrand)) {
                const brand = existingBrands.find((b) => b.id === brandId);
                if (!brand) {
                    console.warn(`Brand not found for brandId: ${brandId}, skipping Shiprocket order creation`);
                    continue;
                }
                console.log(`Processing Shiprocket order for brand: ${brand.name} (ID: ${brandId})`);

                const productDetails = await Promise.all(
                    brandItems.map(async (item) => {
                        const product = await queries.products.getProduct({
                            productId: item.productId,
                            isActive: true,
                            isDeleted: false,
                            isAvailable: true,
                            isPublished: true,
                            verificationStatus: "approved",
                        });

                        const variant =
                            item.variantId && product
                                ? product.variants.find(
                                      (v) => v.id === item.variantId
                                  )
                                : null;

                        return {
                            product,
                            variant,
                            item,
                        };
                    })
                );
                console.log(`Product details for brand ${brand.name}:`, productDetails);

                const orderDimensions = productDetails.reduce(
                    (acc, { product, variant, item }) => {
                        if (!product) return acc;

                        const dims = variant || product;

                        return {
                            weight: acc.weight + (dims.weight || 0) * item.quantity,
                            length: Math.max(acc.length, dims.length || 0),
                            width: Math.max(acc.width, dims.width || 0),
                            height: acc.height + (dims.height || 0) * item.quantity,
                        };
                    },
                    { weight: 0, length: 0, width: 0, height: 0 }
                );
                console.log(`Order dimensions for brand ${brand.name}:`, orderDimensions);

                // Ensure dimensions meet Shiprocket's minimum requirements
                const validatedDimensions = {
                    weight: Math.max(orderDimensions.weight, 100), // Minimum 100 grams (0.1 kg after conversion)
                    length: Math.max(orderDimensions.length, 0.5), // Minimum 0.5 cm
                    width: Math.max(orderDimensions.width, 0.5), // Minimum 0.5 cm
                    height: Math.max(orderDimensions.height, 0.5), // Minimum 0.5 cm
                };
                console.log(`Validated dimensions for brand ${brand.name}:`, validatedDimensions);

                const orderValue = brandItems.reduce((acc, item) => {
                    return acc + (item.price || 0) * item.quantity;
                }, 0);
                console.log(`Order value for brand ${brand.name}:`, orderValue);

                const pickupLocation = generatePickupLocationCode({
                    brandId,
                    brandName: brand.name,
                });
                console.log(`Generated pickup location for brand ${brand.name}:`, pickupLocation);

                const orderItemsForShiprocket = await Promise.all(
                    brandItems.map(async (item) => {
                        const product = productDetails.find(
                            (p) => p.item.productId === item.productId
                        );

                        return {
                            name: product?.product?.title || item.sku || "",
                            sku: item.sku || "",
                            units: item.quantity,
                            selling_price: Math.floor(
                                +convertPaiseToRupees(item.price || 0)
                            ),
                        };
                    })
                );
                console.log(`Order items for Shiprocket for brand ${brand.name}:`, orderItemsForShiprocket);

                const srOrderRequest = {
                    order_id: orderId,
                    order_date: format(new Date(), "yyyy-MM-dd"),
                    pickup_location: pickupLocation,
                    billing_customer_name: existingAddress.fullName.split(" ")[0],
                    billing_last_name: existingAddress.fullName.split(" ")[1] || "",
                    billing_address: existingAddress.street,
                    billing_city: existingAddress.city,
                    billing_pincode: +existingAddress.zip,
                    billing_state: existingAddress.state,
                    billing_country: "India",
                    billing_email: user.email,
                    billing_phone: +getRawNumberFromPhone(existingAddress.phone),
                    shipping_is_billing: true,
                    order_items: orderItemsForShiprocket,
                    payment_method: input.paymentMethod === "COD" ? "COD" : "Prepaid",
                    sub_total: Math.floor(+convertPaiseToRupees(orderValue)),
                    length: Math.max(orderDimensions.length, 0.5),
                    breadth: Math.max(orderDimensions.width, 0.5),
                    height: Math.max(orderDimensions.height, 0.5),
                    weight: +(Math.max(orderDimensions.weight, 0.1) / 1000).toFixed(2),
                };
                console.log(`Shiprocket order request for brand ${brand.name}:`, srOrderRequest);

                try {
                    const srOrder = await sr.requestCreateOrder(srOrderRequest);
                    console.log(`Shiprocket order creation response for brand ${brand.name}:`, srOrder);

                    if (srOrder.status && srOrder.data) {
                        const shipment = await db
                            .insert(schemas.orderShipments)
                            .values({
                                orderId: newOrder.id,
                                brandId: brandId,
                                shiprocketOrderId: srOrder.data.order_id,
                                shiprocketShipmentId: srOrder.data.shipment_id,
                                status: "pending",
                                courierCompanyId: srOrder.data.courier_company_id || null,
                                courierName: srOrder.data.courier_name || null,
                                awbNumber: srOrder.data.awb_code || null,
                            })
                            .returning()
                            .then((res) => res[0]);

                        const orderItemsForBrand = await db
                            .select({
                                orderItem: schemas.orderItems,
                                product: schemas.products,
                            })
                            .from(schemas.orderItems)
                            .where(
                                and(
                                    eq(schemas.orderItems.orderId, newOrder.id),
                                    eq(schemas.products.brandId, brandId)
                                )
                            )
                            .innerJoin(
                                schemas.products,
                                eq(schemas.orderItems.productId, schemas.products.id)
                            );

                        if (orderItemsForBrand.length > 0) {
                            await db.insert(schemas.orderShipmentItems).values(
                                orderItemsForBrand.map((row) => ({
                                    shipmentId: shipment.id,
                                    orderItemId: row.orderItem.id,
                                }))
                            );
                        }
                    }
                } catch (shiprocketError) {
                    console.error(`Error creating Shiprocket order for brand ${brand.name}:`, shiprocketError);
                }
            }

            const uniqueBrandIds = [...new Set(input.items.map((item) => item.brandId))];
            await Promise.all(
                uniqueBrandIds.map(async (brandId) => {
                    const brandItems = input.items.filter(
                        (item) => item.brandId === brandId
                    );

                    const brandRevenue = brandItems.reduce(
                        (acc, item) => acc + (item.price ?? 0) * item.quantity,
                        0
                    );

                    await analytics.track({
                        namespace: BRAND_EVENTS.ORDER.CREATED,
                        brandId,
                        event: {
                            orderId: newOrder.id,
                            orderTotal: formatPriceTag(
                                +convertPaiseToRupees(newOrder.totalAmount),
                                true
                            ),
                            brandRevenue: formatPriceTag(
                                +convertPaiseToRupees(brandRevenue),
                                true
                            ),
                            orderItems: brandItems.map((item) => ({
                                productId: item.productId,
                                variantId: item.variantId,
                                quantity: item.quantity,
                                sku: item.sku,
                                price: formatPriceTag(
                                    +convertPaiseToRupees(item.price ?? 0),
                                    true
                                ),
                            })),
                        },
                    });
                })
            );

            if (input.coupon) {
                const existingCoupon = await queries.coupons.getCoupon({
                    code: input.coupon,
                    isActive: true,
                });
                if (existingCoupon)
                    await queries.coupons.updateCouponUses(
                        existingCoupon.code,
                        existingCoupon.uses + 1
                    );
            }

            return newOrder;
        } catch (err) {
            console.error(err);
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create order",
            });
        }
    }),
    updateOrderStatus: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                orderId: z.string(),
                values: updateOrderStatusSchema,
            })
        )
        .use(async ({ ctx, input, next }) => {
            const { user, queries } = ctx;

            const existingOrder = await queries.orders.getOrderById(
                input.orderId
            );
            if (!existingOrder)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });

            if (existingOrder.userId !== user.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to update this order",
                });

            if (existingOrder.status === input.values.status)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Order is already in this status",
                });

            return next({
                ctx: {
                    ...ctx,
                    existingOrder,
                },
            });
        })
        .mutation(async ({ input, ctx }) => {
            const { queries, existingOrder } = ctx;

            await queries.orders.updateOrderStatus(input.orderId, input.values);

            if (input.values.status === "cancelled") {
                const uniqueBrandIds = [
                    ...new Set(
                        existingOrder.items.map((item) => item.product.brandId)
                    ),
                ];

                await Promise.all(
                    uniqueBrandIds.map(async (brandId) => {
                        const brandItems = existingOrder.items.filter(
                            (item) => item.product.brandId === brandId
                        );

                        const brandRevenue = brandItems.reduce(
                            (acc, item) =>
                                acc +
                                (item.variant?.price ||
                                    item.product.price ||
                                    0) *
                                    item.quantity,
                            0
                        );

                        await analytics.track({
                            namespace: BRAND_EVENTS.ORDER.CANCELLED,
                            brandId,
                            event: {
                                orderId: existingOrder.id,
                                orderTotal: formatPriceTag(
                                    +convertPaiseToRupees(
                                        existingOrder.totalAmount
                                    ),
                                    true
                                ),
                                brandRevenue: formatPriceTag(
                                    +convertPaiseToRupees(brandRevenue),
                                    true
                                ),
                                orderItems: brandItems.map((item) => ({
                                    productId: item.product.id,
                                    variantId: item.variantId,
                                    quantity: item.quantity,
                                    price: formatPriceTag(
                                        +convertPaiseToRupees(
                                            item.variant?.price ||
                                                item.product.price ||
                                                0
                                        ),
                                        true
                                    ),
                                })),
                            },
                        });
                    })
                );
            }

            return true;
        }),
    bulkUpdateOrderStatus: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                orderIds: z.array(z.string()),
                values: updateOrderStatusSchema,
            })
        )
        .use(async ({ ctx, input, next }) => {
            const { user, queries } = ctx;
            if (user.id !== input.userId)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to update this user's orders",
                });

            const existingOrders = await queries.orders.getOrdersByIds(
                input.orderIds
            );

            const nonExistingOrderIds = input.orderIds.filter(
                (id) => !existingOrders.map((order) => order.id).includes(id)
            );

            if (existingOrders.length !== input.orderIds.length)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: `Order(s) not found: ${nonExistingOrderIds.join(", ")}`,
                });

            const isAllOrdersOfUser = existingOrders.every(
                (order) => order.userId === user.id
            );
            if (!isAllOrdersOfUser)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to update this user's orders",
                });

            return next({
                ctx: {
                    ...ctx,
                    existingOrders,
                },
            });
        })
        .mutation(async ({ input, ctx }) => {
            const { existingOrders, queries } = ctx;

            await queries.orders.bulkUpdateOrderStatus(
                existingOrders.map((order) => order.id),
                input.values
            );

            return true;
        }),
        deleteOrder: protectedProcedure
        .input(z.object({
            orderId: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
            const { queries } = ctx;

                const deletedOrder = await queries.orders.deleteOrder(input.orderId);
                return deletedOrder;
            } catch (error) {
                throw new Error(
                    error instanceof Error ? error.message : `Failed to delete order ${input.orderId}`
                );
            }
        }),
        deleteItemFromCart: protectedProcedure
        .input(z.object({
            userId: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            try {
            const { queries } = ctx;

                const deleteItemFromCart = await queries.userCarts.dropActiveItemsFromCart(input.userId);
                return deleteItemFromCart;
            } catch (error) {
                throw new Error(
                    error instanceof Error ? error.message : `Failed to delete cart ${input.userId}`
                );
            }
        }),
    cancelOrder: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                orderId: z.string(),
            })
        )
        .use(async ({ ctx, input, next }) => {
            const { user, queries } = ctx;

            const existingOrder = await queries.orders.getOrderById(
                input.orderId
            );
            if (!existingOrder)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });

            if (existingOrder.userId !== user.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to cancel this order",
                });

            return next({
                ctx: {
                    ...ctx,
                    existingOrder,
                },
            });
        })
        .mutation(async ({ ctx }) => {
            const { existingOrder, queries, db, schemas } = ctx;
            const sr = await shiprocket();

            // Check if order can be cancelled
            if (!["pending", "processing"].includes(existingOrder.status)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "This order cannot be cancelled",
                });
            }

            // Process refund if payment was made
            if (
                existingOrder.paymentStatus === "paid" &&
                existingOrder.paymentId
            ) {
                try {
                    const rzpRefund = await razorpay.payments.refund(
                        existingOrder.paymentId,
                        {
                            amount: existingOrder.totalAmount,
                            speed: "normal",
                            reverse_all: 1,
                            notes: {
                                reason: "Order cancelled by customer",
                                orderId: existingOrder.id,
                            },
                        }
                    );

                    await refundQueries.createRefund({
                        id: rzpRefund.id,
                        userId: existingOrder.userId,
                        orderId: existingOrder.id,
                        paymentId: existingOrder.paymentId,
                        status: "pending",
                        amount: existingOrder.totalAmount,
                    });

                    // Update payment status
                    existingOrder.paymentStatus = "refund_pending";
                } catch (error) {
                    console.error("Refund error details:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to process refund",
                    });
                }
            }

            // Cancel Shiprocket orders and update shipments
            for (const shipment of existingOrder.shipments) {
                try {
                    // Cancel Shiprocket order
                    if (shipment.shiprocketOrderId)
                        await sr.deleteOrder({
                            ids: [shipment.shiprocketOrderId],
                        });

                    // Update shipment status
                    await db
                        .update(schemas.orderShipments)
                        .set({
                            status: "cancelled",
                            updatedAt: new Date(),
                        })
                        .where(eq(schemas.orderShipments.id, shipment.id));
                } catch (error) {
                    console.error("Shipment cancellation error:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to cancel shipment",
                    });
                }
            }

            // Restore product stock
            const updateProductStockData = existingOrder.items.map((item) => {
                const quantity = item.quantity;
                const currentStock =
                    item.variant?.quantity ?? item.product.quantity ?? 0;
                return {
                    productId: item.product.id,
                    variantId: item.variant?.id,
                    quantity: currentStock + quantity,
                };
            });

            await productQueries.updateProductStock(updateProductStockData);

            // Update order status
            await queries.orders.updateOrderStatus(existingOrder.id, {
                status: "cancelled",
                paymentStatus: "refund_pending",
                paymentId: existingOrder.paymentId,
                paymentMethod: existingOrder.paymentMethod,
            });

            // Track analytics events
            const uniqueBrandIds = [
                ...new Set(
                    existingOrder.items.map((item) => item.product.brandId)
                ),
            ];

            await Promise.all(
                uniqueBrandIds.map(async (brandId) => {
                    const brandItems = existingOrder.items.filter(
                        (item) => item.product.brandId === brandId
                    );
                    const brandRevenue = brandItems.reduce(
                        (acc, item) =>
                            acc +
                            (item.variant?.price || item.product.price || 0) *
                                item.quantity,
                        0
                    );

                    await analytics.track({
                        namespace: BRAND_EVENTS.ORDER.CANCELLED,
                        brandId,
                        event: {
                            orderId: existingOrder.id,
                            orderTotal: formatPriceTag(
                                +convertPaiseToRupees(
                                    existingOrder.totalAmount
                                ),
                                true
                            ),
                            brandRevenue: formatPriceTag(
                                +convertPaiseToRupees(brandRevenue),
                                true
                            ),
                            orderItems: brandItems.map((item) => ({
                                productId: item.product.id,
                                variantId: item.variantId,
                                quantity: item.quantity,
                                price: formatPriceTag(
                                    +convertPaiseToRupees(
                                        item.variant?.price ||
                                            item.product.price ||
                                            0
                                    ),
                                    true
                                ),
                            })),
                        },
                    });
                })
            );

            return true;
        }),
    getOrderShipmentDetailsByShipmentId: protectedProcedure
        .input(
            z.object({
                shipmentId: z.number(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.orders.getShipmentDetailsByShipmentId(
                input.shipmentId
            );
            return data;
        }),
});

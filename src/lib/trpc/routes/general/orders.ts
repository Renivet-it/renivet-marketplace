import { BRAND_EVENTS } from "@/config/brand";
import { DEFAULT_MESSAGES } from "@/config/const";
import { refundQueries } from "@/lib/db/queries";
import { razorpay } from "@/lib/razorpay";
import {
    analytics,
    brandCache,
    categoryCache,
    userCartCache,
} from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import {
    convertPaiseToRupees,
    formatPriceTag,
    generateReceiptId,
} from "@/lib/utils";
import {
    categorySchema,
    createOrderItemSchema,
    createOrderSchema,
    productSchema,
    updateOrderStatusSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const ordersRouter = createTRPCRouter({
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
            })
        )
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { userId } = input;

            if (user.id !== userId)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message:
                        "You are not allowed to create an order for another user",
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
                        .join(
                            ", "
                        )} do not meet the requirements to accept payments, please remove them from the order`,
                });

            try {
                const brandTransfers = existingBrands.map((brand) => {
                    const brandItems = input.items.filter(
                        (item) => item.brandId === brand.id
                    );

                    const transferAmount = brandItems.reduce((acc, item) => {
                        const itemTotal = (item.price ?? 0) * item.quantity;
                        const category = existingCategories.find(
                            (cat) => cat.id === item.categoryId
                        );
                        const commissionRate = category?.commissionRate ?? 0;
                        const commission = (itemTotal * commissionRate) / 100;

                        return acc + (itemTotal - commission);
                    }, 0);

                    return {
                        account: brand.rzpAccountId!,
                        amount: Math.round(transferAmount),
                        currency: "INR",
                    };
                });

                const rpzOrder = await razorpay.orders.create({
                    amount: input.totalAmount,
                    currency: "INR",
                    customer_details: {
                        name: `${user.firstName} ${user.lastName}`,
                        email: user.email,
                        shipping_address: {
                            contact: existingAddress.phone,
                            name: existingAddress.fullName,
                            line1: existingAddress.street,
                            city: existingAddress.city,
                            state: existingAddress.state,
                            zipcode: existingAddress.zip,
                            country: "IN",
                        },
                        billing_address: {
                            contact: existingAddress.phone,
                            name: existingAddress.fullName,
                            line1: existingAddress.street,
                            city: existingAddress.city,
                            state: existingAddress.state,
                            zipcode: existingAddress.zip,
                            country: "IN",
                        },
                        contact: existingAddress.phone,
                    },
                    line_items_total: input.totalItems,
                    shipping_fee: input.deliveryAmount,
                    receipt: receiptId,
                    transfers: brandTransfers,
                });

                const newOrder = await queries.orders.createOrder({
                    ...input,
                    id: rpzOrder.id,
                    receiptId,
                    userId: user.id,
                });

                await Promise.all([
                    db.insert(schemas.orderItems).values(
                        input.items.map((item) => ({
                            ...item,
                            orderId: rpzOrder.id,
                        }))
                    ),
                    queries.userCarts.dropActiveItemsFromCart(user.id),
                    userCartCache.drop(user.id),
                ]);

                const uniqueBrandIds = [
                    ...new Set(input.items.map((item) => item.brandId)),
                ];
                await Promise.all(
                    uniqueBrandIds.map(async (brandId) => {
                        const brandItems = input.items.filter(
                            (item) => item.brandId === brandId
                        );

                        const brandRevenue = brandItems.reduce(
                            (acc, item) =>
                                acc + (item.price ?? 0) * item.quantity,
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
        .mutation(async ({ input, ctx }) => {
            const { existingOrder, queries } = ctx;

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

                    existingOrder.paymentStatus = "refund_pending";
                } catch (error) {
                    console.error("Refund error details:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to process refund",
                    });
                }
            }

            await queries.orders.updateOrderStatus(input.orderId, {
                ...existingOrder,
                status: "cancelled",
            });

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

                    await analytics.track({
                        namespace: BRAND_EVENTS.REFUND.CREATED,
                        brandId,
                        event: {
                            orderId: existingOrder.id,
                            paymentId: existingOrder.paymentId || "N/A",
                            totalAmount: formatPriceTag(
                                +convertPaiseToRupees(
                                    existingOrder.totalAmount
                                ),
                                true
                            ),
                            brandRevenue: formatPriceTag(
                                +convertPaiseToRupees(brandRevenue),
                                true
                            ),
                            items: brandItems.map((item) => ({
                                productId: item.product.id,
                                quantity: item.quantity,
                                variantId: item.variant?.id,
                                price: formatPriceTag(
                                    +convertPaiseToRupees(
                                        item.variant?.price ||
                                            item.product.price ||
                                            0
                                    ),
                                    true
                                ),
                            })),
                            reason: "Order cancelled",
                        },
                    });
                })
            );

            return true;
        }),
});

import { DEFAULT_MESSAGES } from "@/config/const";
import { razorpay } from "@/lib/razorpay";
import { brandCache, userCartCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { generateReceiptId } from "@/lib/utils";
import {
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
                        })
                ),
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

            const cachedAllBrands = await brandCache.getAll();
            const brandIds = input.items.map((item) => item.brandId);

            const existingBrands = cachedAllBrands.filter((brand) =>
                brandIds.includes(brand.id)
            );

            if (existingBrands.length !== brandIds.length)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order contains invalid brand(s)",
                });

            try {
                const rpzOrder = await razorpay.orders.create({
                    amount: input.totalAmount,
                    currency: "INR",
                    customer_details: {
                        name: user.firstName + " " + user.lastName,
                        email: user.email,
                        shipping_address: {
                            contact: user.phone,
                            name: existingAddress.fullName,
                            line1: existingAddress.street,
                            city: existingAddress.city,
                            state: existingAddress.state,
                            zipcode: existingAddress.zip,
                            country: "IN",
                        },
                        billing_address: {
                            contact: user.phone,
                            name: existingAddress.fullName,
                            line1: existingAddress.street,
                            city: existingAddress.city,
                            state: existingAddress.state,
                            zipcode: existingAddress.zip,
                            country: "IN",
                        },
                        contact: existingAddress.phone,
                    },
                    line_items: [
                        {
                            variant_id: "",
                            sku: "",
                            name: "",
                            description: "",
                            dimensions: {
                                height: "",
                                width: "",
                                length: "",
                            },
                            weight: "",
                            quantity: 0,
                            image_url: "",
                            product_url: "",
                            type: "",
                            offer_price: "",
                            tax_amount: 0,
                            price: "",
                        },
                    ],
                    line_items_total: input.totalItems,
                    shipping_fee: input.deliveryAmount,
                    receipt: receiptId,
                    transfers: existingBrands.map((brand) => ({
                        account: brand.rzpAccountId,
                        amount: input.items
                            .filter((item) => item.brandId === brand.id)
                            .reduce(
                                (acc, item) => acc + item.price * item.quantity,
                                0
                            ),
                        currency: "INR",
                    })),
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

            return next();
        })
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            await queries.orders.updateOrderStatus(input.orderId, input.values);
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
});

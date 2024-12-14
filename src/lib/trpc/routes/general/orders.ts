import { DEFAULT_MESSAGES } from "@/config/const";
import { razorpay } from "@/lib/razorpay";
import { userCartCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { convertPriceToPaise, generateReceiptId } from "@/lib/utils";
import { createOrderItemSchema, createOrderSchema } from "@/lib/validations";
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
                    createOrderItemSchema.omit({
                        orderId: true,
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

            try {
                const rpzOrder = await razorpay.orders.create({
                    amount: convertPriceToPaise(parseFloat(input.totalAmount)),
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
                    line_items_total: input.totalItems,
                    shipping_fee: convertPriceToPaise(
                        parseFloat(input.deliveryAmount)
                    ),
                    receipt: receiptId,
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
});

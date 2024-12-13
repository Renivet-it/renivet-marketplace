import { DEFAULT_MESSAGES } from "@/config/const";
import { razorpay } from "@/lib/razorpay";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { convertPriceToPaise, generateReceiptId } from "@/lib/utils";
import { createOrderSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";

export const ordersRouter = createTRPCRouter({
    createOrder: protectedProcedure
        .input(createOrderSchema.omit({ id: true, receiptId: true }))
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
            const { queries, user } = ctx;

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

                return newOrder;
            } catch (err) {
                console.log(err);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create order",
                });
            }
        }),
});

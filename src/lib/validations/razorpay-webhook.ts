import { z } from "zod";

export const razorpayPaymentWebhookSchema = z.object({
    entity: z.string(),
    account_id: z.string(),
    event: z.union([
        z.literal("payment.captured"),
        z.literal("payment.failed"),
    ]),
    contains: z.array(z.string()),
    payload: z.object({
        payment: z.object({
            entity: z.object({
                id: z.string(),
                entity: z.string(),
                amount: z.number().transform((val) => val / 100),
                status: z.union([z.literal("captured"), z.literal("failed")]),
                order_id: z.string(),
                method: z.string(),
                captured: z.boolean(),
                email: z.string().email(),
                contact: z.string(),
            }),
        }),
    }),
    created_at: z.number().transform((val) => new Date(val)),
});

export const razorpaySubscriptionWebhookSchema = z.object({
    entity: z.string(),
    account_id: z.string(),
    event: z.union([
        z.literal("subscription.authenticated"),
        z.literal("subscription.charged"),
        z.literal("subscription.cancelled"),
    ]),
    contains: z.array(z.string()),
    payload: z.object({
        subscription: z.object({
            entity: z.object({
                id: z.string(),
                entity: z.string(),
                plan_id: z.string(),
                status: z.union([z.literal("active"), z.literal("cancelled")]),
            }),
        }),
        payment: z
            .object({
                entity: z.object({
                    id: z.string(),
                    entity: z.string(),
                    amount: z.number().transform((val) => val / 100),
                    status: z.union([
                        z.literal("captured"),
                        z.literal("failed"),
                    ]),
                }),
            })
            .optional(),
    }),
});

export const razorPayRefundWebhookSchema = z.object({
    entity: z.string(),
    account_id: z.string(),
    event: z.union([z.literal("refund.processed"), z.literal("refund.failed")]),
    contains: z.array(z.string()),
    payload: z.object({
        refund: z.object({
            entity: z.object({
                id: z.string(),
                entity: z.string(),
                amount: z.number().transform((val) => val / 100),
                currency: z.string(),
                status: z.union([z.literal("processed"), z.literal("failed")]),
                payment_id: z.string(),
            }),
        }),
        payment: z.object({
            entity: z.object({
                id: z.string(),
                entity: z.string(),
                amount: z.number().transform((val) => val / 100),
                status: z.union([
                    z.literal("refunded"),
                    z.literal("captured"),
                    z.literal("failed"),
                ]),
                order_id: z.string(),
                method: z.string(),
                email: z.string().email(),
                contact: z.string(),
            }),
        }),
    }),
});

export const razorpayPaymentResponseSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

export const razorpaySubscriptionResponseSchema = z.object({
    razorpay_subscription_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

export type RazorpayPaymentWebhook = z.infer<
    typeof razorpayPaymentWebhookSchema
>;
export type RazorpaySubscriptionWebhook = z.infer<
    typeof razorpaySubscriptionWebhookSchema
>;
export type RazorpayPaymentResponse = z.infer<
    typeof razorpayPaymentResponseSchema
>;
export type RazorpaySubscriptionResponse = z.infer<
    typeof razorpaySubscriptionResponseSchema
>;

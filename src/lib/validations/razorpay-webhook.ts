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
                status: z.union([z.literal("captured"), z.literal("failed")]),
                order_id: z.string(),
                method: z.string(),
                email: z.string().email(),
                contact: z.string(),
            }),
        }),
    }),
});

export const razorpayResponseSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
});

export type RazorpayWebhook = z.infer<typeof razorpayPaymentWebhookSchema>;
export type RazorpayResponse = z.infer<typeof razorpayResponseSchema>;

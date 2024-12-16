import { z } from "zod";

export const refundSchema = z.object({
    id: z
        .string({
            required_error: "ID is required",
            invalid_type_error: "ID must be a string",
        })
        .min(1, "ID is invalid"),
    userId: z
        .string({
            required_error: "User ID is required",
            invalid_type_error: "User ID must be a string",
        })
        .min(1, "User ID is invalid"),
    orderId: z
        .string({
            required_error: "Order ID is required",
            invalid_type_error: "Order ID must be a string",
        })
        .min(1, "Order ID is invalid"),
    paymentId: z
        .string({
            required_error: "Payment ID is required",
            invalid_type_error: "Payment ID must be a string",
        })
        .min(1, "Payment ID is invalid"),
    status: z.enum(["pending", "processed", "failed"]),
    amount: z
        .string({
            required_error: "Amount is required",
            invalid_type_error: "Amount must be a number",
        })
        .refine((v) => !isNaN(parseFloat(v)), {
            message: "Amount must be a number",
        }),
    createdAt: z
        .union([z.string(), z.date()], {
            required_error: "Created at is required",
            invalid_type_error: "Created at must be a date",
        })
        .transform((v) => new Date(v)),
    updatedAt: z
        .union([z.string(), z.date()], {
            required_error: "Updated at is required",
            invalid_type_error: "Updated at must be a date",
        })
        .transform((v) => new Date(v)),
});

export const createRefundSchema = refundSchema.omit({
    createdAt: true,
    updatedAt: true,
});

export type Refund = z.infer<typeof refundSchema>;
export type CreateRefund = z.infer<typeof createRefundSchema>;

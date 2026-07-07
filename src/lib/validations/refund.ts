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
    status: z.enum([
        "pending",
        "awaiting_approval",
        "awaiting_return",
        "awaiting_qc",
        "qc_failed",
        "processed",
        "failed",
        "rejected",
    ]),
    amount: z
        .union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().nonnegative("Amount must be a non-negative number")),
    reasonCode: z.string().uuid().nullable().optional(),
    reasonNotes: z.string().nullable().optional(),
    costAllocation: z
        .enum(["brand_fault", "customer_fault", "renivet_fault", "carrier_fault"])
        .nullable()
        .optional(),
    notes: z.string().nullable().optional(),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    returnShippingPaidBy: z.enum(["renivet", "customer", "na"]).nullable().optional(),
    returnReceivedAt: z
        .union([z.string(), z.date()])
        .transform((v) => new Date(v))
        .nullable()
        .optional(),
    returnQcStatus: z
        .enum(["pending", "passed", "failed", "na"])
        .nullable()
        .optional(),
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

"use server";

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { orderQueries } from "@/lib/db/queries";

const updatePaymentStatusInput = z.object({
    userId: z.string(),
    intentId: z.string(),
    status: z.enum(["pending", "paid", "failed"]),
    paymentId: z.string().optional(),
    paymentMethod: z.string().optional(),
});

export async function updatePaymentStatusAction(input: z.infer<typeof updatePaymentStatusInput>) {
    try {
        const parsedInput = updatePaymentStatusInput.parse(input);

        // Verify intent belongs to user
        const intent = await orderQueries.getIntentById(parsedInput.intentId);
        if (!intent || intent.userId !== parsedInput.userId) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Intent not found",
            });
        }

        // Check authorization
        if (parsedInput.userId !== intent.userId) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You are not authorized to update this intent",
            });
        }

        await orderQueries.updatePaymentStatus(parsedInput.intentId, parsedInput.status, {
            paymentId: parsedInput.paymentId,
            paymentMethod: parsedInput.paymentMethod,
        });

        return { success: true };
    } catch (error) {
        console.error("Error updating payment status:", error);
        throw error;
    }
}
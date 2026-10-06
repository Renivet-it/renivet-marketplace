import { and, eq } from "drizzle-orm";
import { db } from "..";
import { paymentEventReceipts } from "../schema";

type ClaimPaymentEventInput = {
    eventType: string;
    providerPaymentId: string;
    providerOrderId: string;
    orderId: string;
    orderIntentId?: string | null;
    amountPaise: number;
    currency: string;
    metadata?: Record<string, unknown>;
};

class PaymentEventQuery {
    async claim(input: ClaimPaymentEventInput) {
        return db.transaction(async (tx) => {
            const inserted = await tx
                .insert(paymentEventReceipts)
                .values({
                    eventType: input.eventType,
                    providerPaymentId: input.providerPaymentId,
                    providerOrderId: input.providerOrderId,
                    orderId: input.orderId,
                    orderIntentId: input.orderIntentId,
                    amountPaise: input.amountPaise,
                    currency: input.currency,
                    metadata: input.metadata ?? {},
                })
                .onConflictDoNothing({
                    target: [
                        paymentEventReceipts.provider,
                        paymentEventReceipts.eventType,
                        paymentEventReceipts.providerPaymentId,
                        paymentEventReceipts.orderId,
                    ],
                })
                .returning();

            if (inserted[0]) {
                return { claimed: true, receipt: inserted[0] };
            }

            const existing = await tx
                .select()
                .from(paymentEventReceipts)
                .where(
                    and(
                        eq(paymentEventReceipts.provider, "razorpay"),
                        eq(paymentEventReceipts.eventType, input.eventType),
                        eq(
                            paymentEventReceipts.providerPaymentId,
                            input.providerPaymentId
                        ),
                        eq(paymentEventReceipts.orderId, input.orderId)
                    )
                )
                .limit(1);

            if (existing[0]?.status === "rejected") {
                const [reopened] = await tx
                    .update(paymentEventReceipts)
                    .set({
                        status: "received",
                        appliedAt: null,
                        updatedAt: new Date(),
                        metadata: input.metadata ?? {},
                    })
                    .where(eq(paymentEventReceipts.id, existing[0].id))
                    .returning();

                return { claimed: true, receipt: reopened };
            }

            return { claimed: false, receipt: existing[0] ?? null };
        });
    }

    async markApplied(receiptId: string) {
        const [receipt] = await db
            .update(paymentEventReceipts)
            .set({
                status: "applied",
                appliedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(paymentEventReceipts.id, receiptId))
            .returning();

        return receipt ?? null;
    }

    async markRejected(receiptId: string) {
        const [receipt] = await db
            .update(paymentEventReceipts)
            .set({ status: "rejected", updatedAt: new Date() })
            .where(eq(paymentEventReceipts.id, receiptId))
            .returning();

        return receipt ?? null;
    }
}

export const paymentEventQueries = new PaymentEventQuery();

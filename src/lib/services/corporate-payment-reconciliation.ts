import { db } from "@/lib/db";
import {
    corporateOrderStatusHistory,
    corporateOrders,
    corporatePaymentIntents,
    corporatePayments,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function reconcileCorporatePaymentIntent(input: {
    intentId: string;
    providerPaymentId: string;
    amountPaise: number;
    paymentDate?: string;
}) {
    return db.transaction(async (tx) => {
        const [intent] = await tx
            .select()
            .from(corporatePaymentIntents)
            .where(eq(corporatePaymentIntents.id, input.intentId))
            .for("update");

        if (!intent) throw new Error("Corporate payment intent not found");
        if (intent.status === "applied" || intent.status === "recovery_applied") {
            const [order] = intent.orderId
                ? await tx
                      .select()
                      .from(corporateOrders)
                      .where(eq(corporateOrders.id, intent.orderId))
                : [];
            const [payment] = await tx
                .select()
                .from(corporatePayments)
                .where(eq(corporatePayments.paymentReference, input.providerPaymentId));
            return { intent, order, payment, replayed: true };
        }

        if (!intent.orderId) {
            await tx
                .update(corporatePaymentIntents)
                .set({
                    providerPaymentId: input.providerPaymentId,
                    status: "recovery_required",
                    rejectionCode: "order_missing",
                    updatedAt: new Date(),
                })
                .where(eq(corporatePaymentIntents.id, intent.id));
            throw new Error("Corporate payment intent requires operator recovery");
        }

        const [order] = await tx
            .select()
            .from(corporateOrders)
            .where(eq(corporateOrders.id, intent.orderId))
            .for("update");
        if (!order) throw new Error("Corporate order not found");

        const [existingPayment] = await tx
            .select()
            .from(corporatePayments)
            .where(eq(corporatePayments.paymentReference, input.providerPaymentId));
        if (existingPayment) {
            await tx
                .update(corporatePaymentIntents)
                .set({
                    providerPaymentId: input.providerPaymentId,
                    status: "payment_received",
                    updatedAt: new Date(),
                })
                .where(eq(corporatePaymentIntents.id, intent.id));
            return { intent, order, payment: existingPayment, replayed: true };
        }

        const outstandingPaise =
            intent.paymentKind === "advance"
                ? intent.amountPaise
                : order.balanceDuePaise;
        if (input.amountPaise !== intent.amountPaise || input.amountPaise > outstandingPaise) {
            await tx
                .update(corporatePaymentIntents)
                .set({
                    providerPaymentId: input.providerPaymentId,
                    status: "rejected",
                    rejectionCode: "amount_mismatch_or_over_balance",
                    updatedAt: new Date(),
                })
                .where(eq(corporatePaymentIntents.id, intent.id));
            throw new Error("Corporate payment amount is invalid");
        }

        const remainingPaise =
            intent.paymentKind === "advance"
                ? order.balanceDuePaise
                : Math.max(0, order.balanceDuePaise - input.amountPaise);
        const paymentType =
            intent.paymentKind === "payment_request" ? "partial" : intent.paymentKind;
        const [payment] = await tx
            .insert(corporatePayments)
            .values({
                orderId: order.id,
                paymentType,
                paymentMode: "razorpay",
                amountPaise: input.amountPaise,
                paymentReference: input.providerPaymentId,
                paymentStatus: remainingPaise === 0 ? "payment_success" : "payment_partial",
                paymentDate: input.paymentDate ?? new Date().toISOString().slice(0, 10),
                metadata: { intentId: intent.id, providerPaymentId: input.providerPaymentId },
            })
            .returning();

        const [updatedOrder] = await tx
            .update(corporateOrders)
            .set({
                razorpayOrderId: intent.providerOrderId,
                razorpayPaymentId: input.providerPaymentId,
                paymentReference: input.providerPaymentId,
                paymentStatus: remainingPaise === 0 ? "paid" : "pending",
                balanceDuePaise: remainingPaise,
                balancePaymentStatus: remainingPaise === 0 ? "paid" : order.balancePaymentStatus,
                status: order.status === "payment_pending" ? "under_review" : order.status,
                updatedAt: new Date(),
            })
            .where(eq(corporateOrders.id, order.id))
            .returning();

        await tx.insert(corporateOrderStatusHistory).values({
            corporateOrderId: order.id,
            fromStatus: order.status,
            toStatus: updatedOrder?.status ?? order.status,
            changedByUserId: null,
            note: "Corporate payment reconciled",
            metadata: { intentId: intent.id, providerPaymentId: input.providerPaymentId },
        });

        const [updatedIntent] = await tx
            .update(corporatePaymentIntents)
            .set({
                providerPaymentId: input.providerPaymentId,
                status: "payment_received",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(corporatePaymentIntents.id, intent.id),
                    eq(corporatePaymentIntents.status, "provider_order_bound")
                )
            )
            .returning();

        return {
            intent: updatedIntent ?? intent,
            order: updatedOrder ?? order,
            payment,
            replayed: false,
        };
    });
}

export async function markCorporatePaymentIntentApplied(intentId: string) {
    const [intent] = await db
        .update(corporatePaymentIntents)
        .set({ status: "applied", updatedAt: new Date() })
        .where(eq(corporatePaymentIntents.id, intentId))
        .returning();
    return intent;
}

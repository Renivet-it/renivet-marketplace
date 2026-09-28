import { CreateRefund, Refund } from "@/lib/validations";
import {
    deriveOrderPaymentStatusFromRefunds,
    resolveRefundEventStatus,
    type RefundEventStatus,
} from "@/lib/finance/refund-source-of-truth";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "..";
import { orders, refunds } from "../schema";

type RecordRefundEventInput = {
    refundId: string;
    gatewayRefundId?: string | null;
    userId: string;
    orderId: string;
    paymentId: string;
    amount: number;
    status: RefundEventStatus;
    paymentMethod?: string | null;
    orderStatus?: "cancelled";
    cancellationReasonCode?: string | null;
    manualOverrideReason?: string | null;
};

class RefundQuery {
    async createRefund(values: CreateRefund) {
        const data = await db
            .insert(refunds)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateRefundStatus(refundId: string, status: Refund["status"]) {
        const data = await db
            .update(refunds)
            .set({ status })
            .where(eq(refunds.id, refundId))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async listRefundReconciliationRows(orderIds?: string[]) {
        const rows = await db
            .select({
                orderId: orders.id,
                paymentStatus: orders.paymentStatus,
                refundId: refunds.id,
                refundStatus: refunds.status,
            })
            .from(orders)
            .leftJoin(refunds, eq(refunds.orderId, orders.id))
            .where(
                orderIds?.length
                    ? inArray(orders.id, orderIds)
                    : or(
                          eq(orders.paymentStatus, "refunded"),
                          eq(refunds.status, "processed")
                      )
            );

        return rows;
    }

    async recordRefundEvent(input: RecordRefundEventInput) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                return await db.transaction(async (tx) => {
                    const byId = await tx
                        .select()
                        .from(refunds)
                        .where(eq(refunds.id, input.refundId))
                        .limit(1);
                    const byGatewayId = input.gatewayRefundId
                        ? await tx
                              .select()
                              .from(refunds)
                              .where(
                                  eq(refunds.razorpayRefundId, input.gatewayRefundId)
                              )
                              .limit(1)
                        : [];
                    const byPaymentId = await tx
                        .select()
                        .from(refunds)
                        .where(eq(refunds.paymentId, input.paymentId))
                        .limit(1);
                    const existing = byId[0] ?? byGatewayId[0] ?? byPaymentId[0];

                    if (
                        existing?.razorpayRefundId &&
                        input.gatewayRefundId &&
                        existing.razorpayRefundId !== input.gatewayRefundId
                    ) {
                        throw new Error(
                            `Refund identity conflict for payment ${input.paymentId}.`
                        );
                    }

                    const nextStatus = resolveRefundEventStatus(
                        (existing?.status as RefundEventStatus | undefined) ?? null,
                        input.status
                    );
                    const refund = existing
                        ? await tx
                              .update(refunds)
                              .set({
                                  status: nextStatus,
                                  razorpayRefundId:
                                      input.gatewayRefundId ??
                                      existing.razorpayRefundId,
                              })
                              .where(eq(refunds.id, existing.id))
                              .returning()
                              .then((rows) => rows[0])
                        : await tx
                              .insert(refunds)
                              .values({
                                  id: input.refundId,
                                  userId: input.userId,
                                  orderId: input.orderId,
                                  paymentId: input.paymentId,
                                  amount: input.amount,
                                  status: nextStatus,
                                  razorpayRefundId: input.gatewayRefundId,
                              })
                              .returning()
                              .then((rows) => rows[0]);

                    const orderRefundStatuses = await tx
                        .select({ status: refunds.status })
                        .from(refunds)
                        .where(eq(refunds.orderId, input.orderId));
                    const orderPaymentStatus =
                        deriveOrderPaymentStatusFromRefunds(
                            orderRefundStatuses.map((row) => row.status)
                        );

                    const order = await tx
                        .update(orders)
                        .set({
                            paymentId: input.paymentId,
                            paymentMethod: input.paymentMethod,
                            paymentStatus: orderPaymentStatus,
                            ...(input.orderStatus
                                ? { status: input.orderStatus }
                                : {}),
                            ...(input.cancellationReasonCode
                                ? {
                                      cancellationReasonCode:
                                          input.cancellationReasonCode,
                                  }
                                : {}),
                            ...(input.manualOverrideReason
                                ? {
                                      manualOverrideReason:
                                          input.manualOverrideReason,
                                  }
                                : {}),
                            updatedAt: new Date(),
                        })
                        .where(eq(orders.id, input.orderId))
                        .returning()
                        .then((rows) => rows[0]);

                    return {
                        refund,
                        order,
                        created: !existing,
                        statusChanged: existing?.status !== nextStatus,
                    };
                });
            } catch (error) {
                if (
                    (error as { code?: string })?.code === "23505" &&
                    attempt < 2
                ) {
                    continue;
                }
                throw error;
            }
        }

        throw new Error("Refund event could not be persisted safely.");
    }
}

export const refundQueries = new RefundQuery();

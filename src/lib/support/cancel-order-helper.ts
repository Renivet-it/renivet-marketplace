import { db } from "@/lib/db";
import { orders, orderShipments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    cancelOrder as cancelDelhiveryOrder,
    getCancellationTracking,
} from "@/lib/delhivery/orders";
import {
    appendCancellationEvidence,
    extractDelhiveryShipmentStatus,
    isExplicitCancellationSuccess,
    isTerminalCancellationStatus,
} from "@/lib/delhivery/cancellation";
import { razorpay } from "@/lib/razorpay";
import { productQueries, refundQueries } from "@/lib/db/queries";
import { auditEntityChange, createOperationalAlert } from "@/lib/monitoring-sla/audit";
import { shiprocket } from "@/lib/shiprocket";

export async function executeOrderCancellation({
    orderId,
    actorId,
    reasonCode,
    notes,
}: {
    orderId: string;
    actorId: string;
    reasonCode: string;
    notes?: string;
}) {
    // 1. Fetch order details with shipments and items
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            shipments: true,
            items: {
                with: {
                    product: true,
                    variant: true,
                }
            }
        }
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.status === "cancelled") {
        return; // Already cancelled
    }

    // 2. Carrier cancellation must be verified before financial/local effects.
    const hasShiprocketShipment = order.shipments.some(
        (shipment) => !!shipment.shiprocketOrderId
    );
    const sr = hasShiprocketShipment ? await shiprocket() : null;

    for (const shipment of order.shipments) {
        try {
            const delhiveryTrackingIds = Array.from(
                new Set(
                    [shipment.awbNumber, shipment.uploadWbn].filter(
                        (id): id is string => !!id
                    )
                )
            );
            
            for (const trackingId of delhiveryTrackingIds) {
                const attemptId = `${shipment.id}:${trackingId}`;
                const cancelResponse = await cancelDelhiveryOrder(trackingId);
                let evidence = appendCancellationEvidence(
                    shipment.delhiveryTrackingJson,
                    {
                        attemptId,
                        phase: "request",
                        recordedAt: new Date().toISOString(),
                        response: cancelResponse,
                    }
                );
                await db.update(orderShipments).set({
                    delhiveryTrackingJson: evidence,
                    updatedAt: new Date(),
                }).where(eq(orderShipments.id, shipment.id));
                if (!isExplicitCancellationSuccess(cancelResponse)) {
                    throw new Error("Delhivery cancellation was not accepted");
                }
                const trackingResponse = await getCancellationTracking(trackingId);
                evidence = appendCancellationEvidence(evidence, {
                    attemptId,
                    phase: "verification",
                    recordedAt: new Date().toISOString(),
                    response: trackingResponse,
                });
                await db.update(orderShipments).set({
                    delhiveryTrackingJson: evidence,
                    updatedAt: new Date(),
                }).where(eq(orderShipments.id, shipment.id));
                if (!isTerminalCancellationStatus(
                    extractDelhiveryShipmentStatus(trackingResponse)
                )) {
                    throw new Error("Delhivery cancellation is not terminal");
                }
            }

            // Shiprocket cancellation (legacy shipments)
            if (shipment.shiprocketOrderId && sr) {
                try {
                    await sr.deleteOrder({
                        ids: [shipment.shiprocketOrderId],
                    });
                } catch (srError) {
                    console.error(`Shiprocket cancellation failed for shipment ${shipment.id}:`, srError);
                }
            }

            // Update shipment status to cancelled
            await db
                .update(orderShipments)
                .set({
                    status: "cancelled",
                    updatedAt: new Date(),
                })
                .where(eq(orderShipments.id, shipment.id));
        } catch {
            await createOperationalAlert({
                entityType: "order_shipment",
                entityId: shipment.id,
                type: "shipment_cancellation_divergence",
                severity: "critical",
                ownerRole: "order_manager",
                title: "Delhivery cancellation requires reconciliation",
                message: `Shipment ${shipment.id} has not reached a terminal carrier cancellation state.`,
                dedupeKey: `delhivery:cancellation:${shipment.id}`,
            });
            throw new Error("Carrier cancellation could not be verified");
        }
    }

    // 3. Process refund only after every carrier cancellation is verified.
    let nextPaymentStatus = order.paymentStatus;
    if (order.paymentStatus === "paid" && order.paymentId) {
        try {
            const rzpRefund = await razorpay.payments.refund(order.paymentId, {
                amount: order.totalAmount,
                speed: "normal",
                reverse_all: 1,
                notes: {
                    reason: reasonCode || "Order cancelled",
                    orderId: order.id,
                },
            });
            await refundQueries.createRefund({
                id: rzpRefund.id,
                userId: order.userId,
                orderId: order.id,
                paymentId: order.paymentId,
                status: "pending",
                amount: order.totalAmount,
            });
            nextPaymentStatus = "refund_pending";
        } catch {
            nextPaymentStatus = "refund_failed";
        }
    } else {
        nextPaymentStatus = order.paymentMethod === "COD" ? "cancelled" : "failed";
    }

    // 4. Restore product stock
    const updateProductStockData = order.items.map((item) => {
        return {
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
        };
    });

    try {
        await productQueries.updateProductStock(updateProductStockData);
    } catch (stockError) {
        console.error("Failed to restore stock in helper:", stockError);
    }

    // 5. Update main order table status
    await db
        .update(orders)
        .set({
            status: "cancelled",
            paymentStatus: nextPaymentStatus,
            cancellationReasonCode: reasonCode,
            manualOverrideReason: notes ?? "Cancelled via Order Ops",
            updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

    // 6. Logs & Alerts
    await auditEntityChange({
        actorId,
        actionType: "order_cancelled",
        entityType: "order",
        entityId: order.id,
        beforeValue: {
            status: order.status,
            paymentStatus: order.paymentStatus,
        },
        afterValue: {
            status: "cancelled",
            paymentStatus: nextPaymentStatus,
            cancellationReasonCode: reasonCode,
        },
        reason: reasonCode,
    });

    await createOperationalAlert({
        actorId,
        type: "order_cancelled",
        severity: "info",
        entityType: "order",
        entityId: order.id,
        title: "Order cancelled via lifecycle update",
        message: `Order ${order.id} was cancelled with reason ${reasonCode}.`,
        ownerRole: "order_manager",
        dedupeKey: `order:cancelled:ops:${order.id}:${reasonCode}`,
    });
}

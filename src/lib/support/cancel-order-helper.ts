import { db } from "@/lib/db";
import { orders, orderShipments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cancelOrder as cancelDelhiveryOrder } from "@/lib/delhivery/orders";
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

    // 2. Process refund if payment was made via Razorpay
    let nextPaymentStatus = order.paymentStatus;
    if (order.paymentStatus === "paid" && order.paymentId) {
        try {
            const rzpRefund = await razorpay.payments.refund(
                order.paymentId,
                {
                    amount: order.totalAmount,
                    speed: "normal",
                    reverse_all: 1,
                    notes: {
                        reason: reasonCode || "Order cancelled",
                        orderId: order.id,
                    },
                }
            );

            await refundQueries.createRefund({
                id: rzpRefund.id,
                userId: order.userId,
                orderId: order.id,
                paymentId: order.paymentId,
                status: "pending",
                amount: order.totalAmount,
            });

            nextPaymentStatus = "refund_pending";
        } catch (error) {
            console.error("Refund error details in helper:", error);
            nextPaymentStatus = "refund_failed";
        }
    } else {
        nextPaymentStatus = order.paymentMethod === "COD" ? "cancelled" : "failed";
    }

    // 3. Cancel shipments in Delhivery / Shiprocket
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
                try {
                    await cancelDelhiveryOrder(trackingId);
                } catch (delhiveryError) {
                    console.error(`Delhivery cancellation failed for tracking ID ${trackingId}:`, delhiveryError);
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
        } catch (error) {
            console.error("Shipment cancellation error in helper:", error);
        }
    }

    // 4. Restore product stock
    const updateProductStockData = order.items.map((item) => {
        const quantity = item.quantity;
        const currentStock = item.variant?.quantity ?? item.product.quantity ?? 0;
        return {
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: currentStock + quantity,
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

import { env } from "@/../env";
import { BRAND_EVENTS } from "@/config/brand";
import { db } from "@/lib/db";
import { orderQueries } from "@/lib/db/queries";
import { orderShipments } from "@/lib/db/schema";
import { analytics, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { OrderDelivered } from "@/lib/resend/emails";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

const webhookResponse = z.object({
    awb: z.union([z.string(), z.number()]).transform((v) => v.toString()),
    current_status: z.string(),
    order_id: z.string(),
    current_timestamp: z.string(),
    etd: z.string(),
    current_status_id: z
        .number({
            invalid_type_error: "Current status ID must be a number",
        })
        .int("Current status ID must be an integer"),
    shipment_status: z.string(),
    shipment_status_id: z
        .number({
            invalid_type_error: "Shipment status ID must be a number",
        })
        .int("Shipment status ID must be an integer"),
    courier_name: z.string(),
    scans: z.array(
        z.object({
            location: z.string(),
            date: z.string(),
            activity: z.string(),
        })
    ),
});

// Map Shiprocket status to our system status (all lowercase for consistent comparison)
const shipmentStatusMap = {
    "pickup scheduled": "pickup_scheduled",
    "pickup generated": "pickup_generated",
    "pickup queued": "pickup_queued",
    "pickup exception": "pickup_exception",
    "pickup rescheduled": "pickup_rescheduled",
    "pickup completed": "pickup_completed",
    "in transit": "in_transit",
    "out for delivery": "out_for_delivery",
    delivered: "delivered",
    "rto initiated": "rto_initiated",
    "rto delivered": "rto_delivered",
    cancelled: "cancelled",
    canceled: "cancelled",
    failed: "failed",
} as const;

export async function POST(req: NextRequest) {
    try {
        const reqApiKey = req.headers.get("x-api-key");
        if (reqApiKey !== env.SHIPROCKET_WEBHOOK_API_KEY)
            throw new AppError("Unauthorized", "UNAUTHORIZED");

        const body = await req.json();
        const parsed = webhookResponse.parse(body);
        const parsedAwb = parsed.awb.toString();

        // Find shipment by AWB
        const shipment = await db.query.orderShipments.findFirst({
            where: and(eq(orderShipments.awbNumber, parsed.awb.toString())),
            with: {
                order: {
                    with: {
                        items: {
                            with: {
                                product: true,
                                variant: true,
                            },
                        },
                    },
                },
            },
        });
        if (!shipment) throw new AppError("Shipment not found", "NOT_FOUND");

        // Map Shiprocket status to our status (case-insensitive)
        const newStatus =
            shipmentStatusMap[
                parsed.current_status.toLowerCase() as keyof typeof shipmentStatusMap
            ] || "processing";

        // Update shipment status
        await db
            .update(orderShipments)
            .set({
                status: newStatus,
                estimatedDeliveryDate: parsed.etd ? new Date(parsed.etd) : null,
                courierName: parsed.courier_name,
            })
            .where(eq(orderShipments.id, shipment.id));

        // Update order status based on shipment status
        if (newStatus === "delivered") {
            await orderQueries.updateOrderStatus(shipment.order.id, {
                status: "delivered",
                paymentId: shipment.order.paymentId,
                paymentMethod: shipment.order.paymentMethod,
                paymentStatus: shipment.order.paymentStatus,
            });

            // updaate delivery date
            const today = new Date();
            const shipmentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            await orderQueries.updateShipmentDate(parsedAwb, shipmentDate);

            await analytics.track({
                namespace: BRAND_EVENTS.ORDER.DELIVERED,
                brandId: shipment.brandId,
                event: {
                    orderId: shipment.order.id,
                    orderTotal: shipment.order.totalAmount,
                    orderItems: shipment.order.items.map((item) => ({
                        productId: item.product.id,
                        variantId: item.variant?.id,
                        quantity: item.quantity,
                        price: item.variant?.price || item.product.price || 0,
                    })),
                },
            });

            // Send delivery notification email
            const user = await userCache.get(shipment.order.userId);
            if (user) {
                await resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: user.email,
                    subject: "Your Order Has Been Delivered",
                    react: OrderDelivered({
                        user: {
                            name: `${user.firstName} ${user.lastName}`,
                        },
                        order: {
                            id: shipment.order.id,
                            shipmentId: shipment.id,
                            awb: shipment.awbNumber || "",
                            amount: shipment.order.totalAmount,
                            items: shipment.order.items.map((item) => ({
                                title: item.product.title,
                                slug: item.product.slug,
                                quantity: item.quantity,
                                price:
                                    item.variant?.price ||
                                    item.product.price ||
                                    0,
                            })),
                        },
                    }),
                });
            }
        } else if (
            newStatus === "in_transit" ||
            newStatus === "out_for_delivery"
        ) {
            await orderQueries.updateOrderStatus(shipment.order.id, {
                status: "shipped",
                paymentId: shipment.order.paymentId,
                paymentMethod: shipment.order.paymentMethod,
                paymentStatus: shipment.order.paymentStatus,
            });
        }

        return CResponse({
            message: "OK",
            longMessage: "Shipment status updated successfully",
        });
    } catch (err) {
        return handleError(err);
    }
}

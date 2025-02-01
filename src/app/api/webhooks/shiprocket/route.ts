import { env } from "@/../env";
import { db } from "@/lib/db";
import { orderQueries } from "@/lib/db/queries";
import { orderShipments } from "@/lib/db/schema";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { z } from "zod";

const webhookResponse = z.object({
    awb: z
        .number({
            invalid_type_error: "AWB must be a number",
        })
        .int("AWB must be an integer"),
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
    channel_order_id: z.string(),
    channel: z.string(),
    courier_name: z.string(),
    scans: z.array(
        z.object({
            date: z.string(),
            activity: z.string(),
            location: z.string(),
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

        // Find shipment by AWB
        const shipment = await db.query.orderShipments.findFirst({
            where: and(eq(orderShipments.awbNumber, parsed.awb.toString())),
            with: {
                order: true,
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

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderShipments } from "@/lib/db/schema";
import { sendOrderShipmentStatusWhatsApp } from "@/lib/whatsapp/order-status";
import { and, eq, ne, isNotNull, or } from "drizzle-orm";

const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL!;
const DELHIVERY_TOKEN = process.env.DELHIVERY_TOKEN!;

/** MAP DELHIVERY → INTERNAL STATUS */
const DELHIVERY_TO_INTERNAL: Record<string, string> = {
    "Manifested": "pending",
    "Pickup Exception": "pickup_exception",
    "Pickup Scheduled": "pickup_scheduled",
    "Picked Up": "pickup_completed",
    "In Transit": "in_transit",
    "Out For Delivery": "out_for_delivery",
    "Delivered": "delivered",
    "RTO Initiated": "rto_initiated",
    "RTO Delivered": "rto_delivered",
    "Undelivered": "failed",
    "Cancelled": "cancelled",
};

function getLatestDelhiveryScan(data: any) {
    const rawScans =
        data?.ShipmentData?.[0]?.Shipment?.Scans ??
        data?.ShipmentData?.[0]?.Shipment?.ShipmentScan ??
        [];

    if (!Array.isArray(rawScans) || rawScans.length === 0) return null;

    const normalized = rawScans
        .map((item: any) => {
            const scanDetail = item?.ScanDetail ?? item;
            const status =
                scanDetail?.Scan ?? item?.Scan ?? scanDetail?.Status ?? null;
            const time =
                scanDetail?.ScanDateTime ??
                scanDetail?.StatusDateTime ??
                item?.ScanDateTime ??
                null;
            return { status: status?.trim(), time };
        })
        .filter((scan: any) => scan.status)
        .sort((a: any, b: any) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return -1;
            if (!b.time) return 1;
            return new Date(a.time).getTime() - new Date(b.time).getTime();
        });

    if (normalized.length === 0) return null;
    return normalized[normalized.length - 1].status;
}

export async function GET() {
    try {
        console.log("🔄 POLLING STARTED");

        // Fetch only Delhivery active shipments
        const activeShipments = await db
            .select()
            .from(orderShipments)
            .where(
                and(
                    or(
                        isNotNull(orderShipments.uploadWbn),
                        isNotNull(orderShipments.awbNumber)
                    ),
                    ne(orderShipments.status, "delivered"),
                    ne(orderShipments.status, "rto_delivered"),
                    ne(orderShipments.status, "cancelled")
                )
            );

        console.log(`📦 Total active Delhivery shipments: ${activeShipments.length}`);

        if (activeShipments.length === 0) {
            return NextResponse.json({ ok: true, message: "No Delhivery shipments pending" });
        }

        for (const ship of activeShipments) {
            console.log("\n=============================");
            console.log(`📦 Shipment ID: ${ship.id}`);
            console.log(`🔗 AWB: ${ship.awbNumber}`);
            console.log("=============================\n");

            if (!ship.awbNumber) continue;

            const url = `${DELHIVERY_BASE_URL}/api/v1/packages/json?waybill=${ship.awbNumber}&token=${DELHIVERY_TOKEN}`;
            console.log("🌐 URL:", url);

            const response = await fetch(url);
            const raw = await response.text();

            // Print raw response for debugging
            console.log("🔍 RAW RESPONSE (first 400 chars) ↓");
            console.log(raw.substring(0, 400));

            let data;
            try {
                data = JSON.parse(raw);
            } catch (err) {
                console.error("❌ ERROR: Delhivery returned HTML, not JSON");
                return NextResponse.json(
                    { ok: false, message: "Delhivery returned HTML, not JSON" },
                    { status: 500 }
                );
            }

            const rawScans =
                data?.ShipmentData?.[0]?.Shipment?.Scans ??
                data?.ShipmentData?.[0]?.Shipment?.ShipmentScan ??
                [];
            console.log("📍 Scans Found:", rawScans?.length);

            if (!rawScans?.length) {
                console.log("⛔ No scans. Skipping.");
                continue;
            }

            // Correct scan field
            const delhiveryStatus = getLatestDelhiveryScan(data);

            console.log("📌 Latest Scan (Correct):", delhiveryStatus);

            if (!delhiveryStatus) {
                console.log("⛔ Missing Scan. Skipping.");
                continue;
            }

            // Case-insensitive matching against DELHIVERY_TO_INTERNAL keys
            const delhiveryStatusLower = delhiveryStatus.trim().toLowerCase();
            const matchedKey = Object.keys(DELHIVERY_TO_INTERNAL).find(
                (k) => k.toLowerCase() === delhiveryStatusLower
            );
            const mappedStatus = matchedKey ? DELHIVERY_TO_INTERNAL[matchedKey] : ship.status;

            console.log(`🔁 Mapped Status: ${mappedStatus}`);
            console.log(`🟦 Previous Status: ${ship.status}`);

            // Always update latest JSON
            await db
                .update(orderShipments)
                .set({
                    delhiveryTrackingJson: data,
                    updatedAt: new Date(),
                })
                .where(eq(orderShipments.id, ship.id));

            if (mappedStatus === ship.status) {
                console.log("⏭ No status change. Skipping status update.");
                continue;
            }

            // Update shipment
            await db
                .update(orderShipments)
                .set({
                    status: mappedStatus,
                    updatedAt: new Date(),
                })
                .where(eq(orderShipments.id, ship.id));

            console.log(`✅ Shipment Updated → ${mappedStatus}`);

            // Sync order status
            if (mappedStatus === "delivered") {
                console.log("📦 Marking ORDER as delivered");
                await db.update(orders).set({ status: "delivered" }).where(eq(orders.id, ship.orderId));
            } else if (mappedStatus === "rto_delivered") {
                console.log("📦 Marking ORDER as cancelled (RTO Delivered)");
                await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, ship.orderId));
            } else if (["pickup_completed", "in_transit", "out_for_delivery"].includes(mappedStatus)) {
                console.log("📦 Marking ORDER as shipped");
                await db.update(orders).set({ status: "shipped" }).where(eq(orders.id, ship.orderId));
            }

            const shouldSendWhatsApp =
                mappedStatus === "in_transit" ||
                mappedStatus === "delivered" ||
                (mappedStatus === "out_for_delivery" &&
                    delhiveryStatus === "Out For Delivery");

            if (shouldSendWhatsApp) {
                const orderRecord = await db.query.orders.findFirst({
                    where: eq(orders.id, ship.orderId),
                    with: {
                        user: true,
                        address: true,
                    },
                });

                if (orderRecord) {
                    await sendOrderShipmentStatusWhatsApp({
                        phone: orderRecord.user?.phone ?? orderRecord.address?.phone,
                        customerName:
                            [orderRecord.user?.firstName, orderRecord.user?.lastName]
                                .filter(Boolean)
                                .join(" ") || orderRecord.address?.fullName,
                        orderId: orderRecord.id,
                        shipmentStatus: mappedStatus,
                        awbNumber: ship.awbNumber,
                    });
                }
            }
        }

        console.log("✅ POLLING COMPLETED");
        return NextResponse.json({ ok: true });

    } catch (err) {
        console.error("❌ POLLING ERROR", err);
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

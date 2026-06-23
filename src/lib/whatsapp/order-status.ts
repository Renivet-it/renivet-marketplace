import { whatsappMessageLogQueries } from "@/lib/db/queries/whatsapp";
import { sendWhatsAppMessage } from "./index";

type ShipmentWhatsAppStatus =
    | "in_transit"
    | "out_for_delivery"
    | "delivered";

function formatIndianWhatsAppNumber(phone: string) {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("91") && cleaned.length === 12) {
        return `+${cleaned}`;
    }

    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    throw new Error(`Invalid phone number: ${phone}`);
}

function getTrackingUrl(orderId: string) {
    const configuredUrl =
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
        process.env.VERCEL_URL?.trim();

    const baseUrl = configuredUrl
        ? configuredUrl.startsWith("http")
            ? configuredUrl
            : `https://${configuredUrl}`
        : "http://localhost:3000";

    return `${baseUrl.replace(/\/$/, "")}/orders/${orderId}/tracking`;
}

function buildTemplatePayload({
    customerName,
    orderId,
    shipmentStatus,
    awbNumber,
}: {
    customerName: string;
    orderId: string;
    shipmentStatus: ShipmentWhatsAppStatus;
    awbNumber?: string | null;
}) {
    const firstName = customerName.trim().split(/\s+/)[0] || "there";
    const trackingUrl = getTrackingUrl(orderId);

    switch (shipmentStatus) {
        case "in_transit":
            return {
                templateName: "order_shipped_renivet" as const,
                parameters: [
                    firstName,
                    orderId,
                    awbNumber ?? "N/A",
                    trackingUrl ?? "",
                ],
            };
        case "out_for_delivery":
            return {
                templateName: "order_out_for_delivery_renivet" as const,
                parameters: [
                    firstName,
                    orderId,
                    awbNumber ?? "N/A",
                    trackingUrl ?? "",
                ],
            };
        case "delivered":
            return {
                templateName: "order_delivered_renivet" as const,
                parameters: [firstName, orderId],
            };
        default:
            return null;
    }
}

export async function sendOrderShipmentStatusWhatsApp({
    phone,
    customerName,
    orderId,
    shipmentStatus,
    awbNumber,
}: {
    phone?: string | null;
    customerName?: string | null;
    orderId: string;
    shipmentStatus: ShipmentWhatsAppStatus;
    awbNumber?: string | null;
}) {
    if (!phone) {
        return { success: false, skipped: true, reason: "missing_phone" };
    }

    let recipientPhoneNumber: string;
    try {
        recipientPhoneNumber = formatIndianWhatsAppNumber(phone);
    } catch (error) {
        console.error("Invalid order shipment WhatsApp phone:", {
            orderId,
            shipmentStatus,
            phone,
            error,
        });
        return { success: false, skipped: true, reason: "invalid_phone" };
    }

    const templatePayload = buildTemplatePayload({
        customerName: customerName || "Customer",
        orderId,
        shipmentStatus,
        awbNumber,
    });

    if (!templatePayload) {
        return { success: false, skipped: true, reason: "unsupported_status" };
    }

    const templateKey = "order_shipment_status";
    const templateName = `order_${shipmentStatus}_${orderId}`;
    const fullName = customerName?.trim() || "Customer";

    const existingLog =
        await whatsappMessageLogQueries.getLatestLogByTemplateIdentity({
            phoneNumber: recipientPhoneNumber,
            templateKey,
            templateName,
        });

    if (existingLog?.success) {
        return { success: false, skipped: true, reason: "already_sent" };
    }

    try {
        const result = await sendWhatsAppMessage({
            recipientPhoneNumber,
            templateName: templatePayload.templateName,
            parameters: templatePayload.parameters,
        });

        await whatsappMessageLogQueries.createLog({
            fullName,
            phoneNumber: recipientPhoneNumber,
            templateKey,
            templateName,
            status: "sent",
            success: true,
            sid: result.data?.sid ?? null,
            error: null,
            attempts: 1,
            sentAt: new Date(),
        });

        return { success: true, result };
    } catch (error) {
        const previousAttempts = existingLog?.attempts ?? 0;

        await whatsappMessageLogQueries.createLog({
            fullName,
            phoneNumber: recipientPhoneNumber,
            templateKey,
            templateName,
            status: "failed",
            success: false,
            sid: null,
            error: error instanceof Error ? error.message : "Unknown error",
            attempts: previousAttempts + 1,
            sentAt: new Date(),
        });

        console.error("Order shipment WhatsApp notification failed:", {
            orderId,
            shipmentStatus,
            error,
        });
        return { success: false, skipped: true, reason: "send_failed" };
    }
}

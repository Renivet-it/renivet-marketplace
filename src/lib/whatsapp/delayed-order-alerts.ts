export type AlertType = "unshipped_48h" | "undelivered_7d";

type ShipmentStatus =
    | "in_transit"
    | "out_for_delivery"
    | "pickup_scheduled"
    | "pickup_generated"
    | "pickup_queued"
    | "pickup_completed"
    | "processing"
    | "pending"
    | "failed"
    | "cancelled"
    | "rto_initiated"
    | "rto_delivered"
    | "delivered";

export interface UnshippedCandidate {
    paymentStatus: string | null;
    status: string | null;
    createdAt: Date | null;
    shipments: Array<{ status: ShipmentStatus | string | null }>;
}

export interface UndeliveredCandidate {
    paymentStatus: string | null;
    status: string | null;
    shipment: {
        status: ShipmentStatus | string | null;
        shipmentDate: Date | null;
    } | null;
}

export interface DelayedDigestOrder {
    orderId: string;
    productDetails: string;
    quantity: number;
    status: string;
    shipmentDate: Date | null;
    tracking: string | null;
}

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TERMINAL_SHIPMENT_STATUSES = new Set([
    "delivered",
    "cancelled",
    "failed",
    "rto_initiated",
    "rto_delivered",
]);

export function isUnshippedEligible(
    order: UnshippedCandidate,
    now: Date
): boolean {
    if (order.paymentStatus !== "paid") return false;
    if (order.status === "cancelled" || order.status === "delivered") return false;
    if (!order.createdAt || now.getTime() - order.createdAt.getTime() < FORTY_EIGHT_HOURS_MS) {
        return false;
    }

    return !order.shipments.some((shipment) =>
        ["in_transit", "out_for_delivery", "delivered"].includes(
            shipment.status ?? ""
        )
    );
}

export function isUndeliveredEligible(
    order: UndeliveredCandidate,
    now: Date
): boolean {
    if (order.paymentStatus !== "paid") return false;
    if (order.status === "cancelled" || order.status === "delivered") return false;
    if (!order.shipment?.shipmentDate) return false;
    if (now.getTime() - order.shipment.shipmentDate.getTime() < SEVEN_DAYS_MS) {
        return false;
    }

    return !TERMINAL_SHIPMENT_STATUSES.has(order.shipment.status ?? "");
}

function formatDate(value: Date | null) {
    if (!value) return null;

    const parts = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).formatToParts(value);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.day} ${values.month} ${values.year}`;
}

export function buildDelayedDigestVariable(orders: DelayedDigestOrder[]) {
    return orders
        .map((order) => {
            const parts = [
                order.orderId,
                order.productDetails || "Product unavailable",
                `Qty ${order.quantity}`,
                `Status ${order.status || "unknown"}`,
            ];
            const shipmentDate = formatDate(order.shipmentDate);
            if (shipmentDate) parts.push(`Shipped ${shipmentDate}`);
            if (order.tracking) parts.push(order.tracking);
            return parts.join(" | ");
        })
        .join("; ");
}

export function buildDelayedDigestVariableFromLines(lines: string[]) {
    return lines.filter(Boolean).join("; ");
}

export function buildDelayedOrdersActionUrl(host: string) {
    const normalizedHost = host.trim().replace(/\/$/, "");
    if (!normalizedHost) throw new Error("Application URL is required");

    return `${normalizedHost}/dashboard/general/orders`;
}

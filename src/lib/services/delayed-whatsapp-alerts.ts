import {
    buildDelayedDigestVariableFromLines,
} from "@/lib/whatsapp/delayed-order-alerts";
import {
    isUndeliveredEligible,
    isUnshippedEligible,
} from "@/lib/whatsapp/delayed-order-alerts";
import {
    normalizeAlertPhoneNumber,
    whatsappDelayedAlertQueries,
    type DelayedAlertType,
} from "@/lib/db/queries/whatsapp-delayed-alert";
import { DEFAULT_SUPPORT_WHATSAPP_NUMBERS } from "@/config/whatsapp-notifications";
import { db } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { randomUUID } from "node:crypto";

export interface DelayedAlertCandidate {
    orderId: string;
    alertType: DelayedAlertType;
    digestLine: string;
}

export interface DelayedAlertRow extends DelayedAlertCandidate {
    id: string;
    phoneNumber: string;
    status: "pending" | "sending" | "sent" | "failed";
}

export interface DelayedAlertStore {
    upsertPendingAlerts(values: Array<DelayedAlertCandidate & { phoneNumber: string }>): Promise<unknown>;
    getRetryableAlerts(input: { alertType: DelayedAlertType; phoneNumber: string; now: Date; limit?: number }): Promise<DelayedAlertRow[]>;
    claimPendingAlerts(input: { ids: string[]; batchId: string; now: Date }): Promise<DelayedAlertRow[]>;
    markBatchSent(input: { batchId: string; ids?: string[]; sid: string; now: Date }): Promise<unknown>;
    markBatchFailed(input: { batchId: string; ids?: string[]; error: string; now: Date }): Promise<unknown>;
}

export interface DelayedAlertSendInput {
    recipientPhoneNumber: string;
    templateName: "delayed_fulfillment_digest_48h" | "delayed_delivery_digest_7d";
    parameters: string[];
}

const TEMPLATE_BY_ALERT_TYPE: Record<DelayedAlertType, DelayedAlertSendInput["templateName"]> = {
    unshipped_48h: "delayed_fulfillment_digest_48h",
    undelivered_7d: "delayed_delivery_digest_7d",
};

export async function runDelayedWhatsAppAlerts({
    now,
    candidates,
    recipients,
    store,
    send,
}: {
    now: Date;
    candidates: DelayedAlertCandidate[];
    recipients: string[];
    store: DelayedAlertStore;
    send: (input: DelayedAlertSendInput) => Promise<{ sid: string }>;
}) {
    const normalizedRecipients = Array.from(
        new Set(recipients.map(normalizeAlertPhoneNumber))
    );

    await store.upsertPendingAlerts(
        candidates.flatMap((candidate) =>
            normalizedRecipients.map((phoneNumber) => ({
                ...candidate,
                phoneNumber,
            }))
        )
    );

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const alertType of ["unshipped_48h", "undelivered_7d"] as const) {
        for (const phoneNumber of normalizedRecipients) {
            const retryable = await store.getRetryableAlerts({
                alertType,
                phoneNumber,
                now,
                limit: 100,
            });
            if (!retryable.length) {
                skipped += 1;
                continue;
            }

            const batchId = randomUUID();
            const claimed = await store.claimPendingAlerts({
                ids: retryable.map((row) => row.id),
                batchId,
                now,
            });
            if (!claimed.length) {
                skipped += 1;
                continue;
            }

            for (const row of claimed) {
                try {
                    const result = await send({
                        recipientPhoneNumber: phoneNumber,
                        templateName: TEMPLATE_BY_ALERT_TYPE[alertType],
                        parameters: [row.digestLine],
                    });
                    await store.markBatchSent({
                        batchId,
                        ids: [row.id],
                        sid: result.sid,
                        now,
                    });
                    sent += 1;
                } catch (error) {
                    await store.markBatchFailed({
                        batchId,
                        ids: [row.id],
                        error: error instanceof Error ? error.message : "Unknown error",
                        now,
                    });
                    failed += 1;
                }
            }
        }
    }

    return {
        candidates: candidates.length,
        recipients: normalizedRecipients.length,
        sent,
        failed,
        skipped,
    };
}

export async function loadDelayedOrderCandidates(now: Date): Promise<DelayedAlertCandidate[]> {
    const orders = await db.query.orders.findMany({
        with: {
            shipments: true,
            items: {
                with: {
                    product: true,
                    variant: true,
                },
            },
        },
    });

    return orders.flatMap((rawOrder) => {
        const order = rawOrder as any;
        const shipment = order.shipments?.[0] ?? null;
        const productDetails = (order.items ?? [])
            .map((item: any) => item.product?.title ?? "Product unavailable")
            .join(", ");
        const quantity = (order.items ?? []).reduce(
            (sum: number, item: any) => sum + Number(item.quantity ?? 0),
            0
        );
        const tracking = shipment?.awbNumber
            ? `AWB ${shipment.awbNumber}`
            : shipment?.trackingNumber
              ? `Tracking ${shipment.trackingNumber}`
              : null;

        const base = {
            orderId: order.id,
            productDetails,
            quantity,
            status: order.status ?? "unknown",
            shipmentDate: shipment?.shipmentDate ?? null,
            tracking,
        };

        if (
            isUnshippedEligible({
                paymentStatus: order.paymentStatus,
                status: order.status,
                createdAt: order.createdAt,
                shipments: order.shipments ?? [],
            }, now)
        ) {
            return [{
                orderId: order.id,
                alertType: "unshipped_48h" as const,
                digestLine: buildDelayedDigestVariableFromLines([
                    `Order: ${base.orderId} • Product: ${base.productDetails || "Product unavailable"} • Qty: ${base.quantity} • Status: ${base.status}`,
                ]),
            }];
        }

        if (
            isUndeliveredEligible({
                paymentStatus: order.paymentStatus,
                status: order.status,
                shipment: shipment
                    ? {
                          status: shipment.status,
                          shipmentDate: shipment.shipmentDate,
                      }
                    : null,
            }, now)
        ) {
            return [{
                orderId: order.id,
                alertType: "undelivered_7d" as const,
                digestLine: [
                    `Order: ${base.orderId}`,
                    `Product: ${base.productDetails || "Product unavailable"}`,
                    `Qty: ${base.quantity}`,
                    `Status: ${base.status}`,
                    base.shipmentDate
                        ? `Shipped: ${base.shipmentDate.toISOString().slice(0, 10)}`
                        : null,
                    base.tracking?.replace(/^AWB /, "AWB: ").replace(/^Tracking /, "Tracking: "),
                ].filter(Boolean).join(" • "),
            }];
        }

        return [];
    });
}

export async function runDelayedWhatsAppAlertsFromDatabase(now = new Date()) {
    const candidates = await loadDelayedOrderCandidates(now);

    return runDelayedWhatsAppAlerts({
        now,
        candidates,
        recipients: [...DEFAULT_SUPPORT_WHATSAPP_NUMBERS],
        store: whatsappDelayedAlertQueries,
        send: async ({ recipientPhoneNumber, templateName, parameters }) => {
            const result = await sendWhatsAppMessage({
                recipientPhoneNumber: normalizeAlertPhoneNumber(recipientPhoneNumber),
                templateName,
                parameters,
            });
            return { sid: result.data?.sid ?? "unknown" };
        },
    });
}

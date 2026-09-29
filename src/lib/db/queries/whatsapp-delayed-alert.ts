import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "..";
import { whatsappDelayedOrderAlerts } from "../schema";

export type DelayedAlertType = "unshipped_48h" | "undelivered_7d";
export type DelayedAlertStatus = "pending" | "sending" | "sent" | "failed";

export function normalizeAlertPhoneNumber(phoneNumber: string) {
    const digits = phoneNumber.replace(/\D/g, "");
    return digits.startsWith("91") ? `+${digits}` : `+91${digits}`;
}

export function buildDelayedAlertIdentity({
    orderId,
    alertType,
    phoneNumber,
}: {
    orderId: string;
    alertType: DelayedAlertType;
    phoneNumber: string;
}) {
    return `${orderId}:${alertType}:${normalizeAlertPhoneNumber(phoneNumber)}`;
}

export function isRetryableDelayedAlert({
    status,
    attempts,
}: {
    status: DelayedAlertStatus;
    attempts: number;
}) {
    return (status === "pending" && attempts === 0) || status === "failed";
}

class WhatsAppDelayedAlertQuery {
    async upsertPendingAlerts(
        values: Array<{
            orderId: string;
            alertType: DelayedAlertType;
            phoneNumber: string;
            digestLine: string;
        }>
    ) {
        if (!values.length) return [];

        return db
            .insert(whatsappDelayedOrderAlerts)
            .values(
                values.map((value) => ({
                    ...value,
                    phoneNumber: normalizeAlertPhoneNumber(value.phoneNumber),
                }))
            )
            .onConflictDoNothing({
                target: [
                    whatsappDelayedOrderAlerts.orderId,
                    whatsappDelayedOrderAlerts.alertType,
                    whatsappDelayedOrderAlerts.phoneNumber,
                ],
            })
            .returning();
    }

    async getRetryableAlerts({
        alertType,
        phoneNumber,
        now,
        limit = 100,
    }: {
        alertType: DelayedAlertType;
        phoneNumber: string;
        now: Date;
        limit?: number;
    }) {
        return db.query.whatsappDelayedOrderAlerts.findMany({
            where: and(
                eq(whatsappDelayedOrderAlerts.alertType, alertType),
                eq(
                    whatsappDelayedOrderAlerts.phoneNumber,
                    normalizeAlertPhoneNumber(phoneNumber)
                ),
                or(
                    eq(whatsappDelayedOrderAlerts.status, "pending"),
                    eq(whatsappDelayedOrderAlerts.status, "failed")
                ),
                or(
                    isNull(whatsappDelayedOrderAlerts.lastAttemptAt),
                    lte(whatsappDelayedOrderAlerts.lastAttemptAt, now)
                )
            ),
            limit,
        });
    }

    async claimPendingAlerts({
        ids,
        batchId,
        now,
    }: {
        ids: string[];
        batchId: string;
        now: Date;
    }) {
        if (!ids.length) return [];

        return db
            .update(whatsappDelayedOrderAlerts)
            .set({
                status: "sending",
                batchId,
                attempts: sql`${whatsappDelayedOrderAlerts.attempts} + 1`,
                lastAttemptAt: now,
                updatedAt: now,
            })
            .where(
                and(
                    inArray(whatsappDelayedOrderAlerts.id, ids),
                    or(
                        eq(whatsappDelayedOrderAlerts.status, "pending"),
                        eq(whatsappDelayedOrderAlerts.status, "failed")
                    )
                )
            )
            .returning();
    }

    async markBatchSent({ batchId, sid, now }: { batchId: string; ids?: string[]; sid: string; now: Date }) {
        return db
            .update(whatsappDelayedOrderAlerts)
            .set({ status: "sent", sid, error: null, sentAt: now, updatedAt: now })
            .where(eq(whatsappDelayedOrderAlerts.batchId, batchId))
            .returning();
    }

    async markBatchFailed({ batchId, error, now }: { batchId: string; ids?: string[]; error: string; now: Date }) {
        return db
            .update(whatsappDelayedOrderAlerts)
            .set({ status: "failed", error, updatedAt: now })
            .where(eq(whatsappDelayedOrderAlerts.batchId, batchId))
            .returning();
    }
}

export const whatsappDelayedAlertQueries = new WhatsAppDelayedAlertQuery();

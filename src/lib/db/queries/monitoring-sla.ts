import { env } from "@/../env";
import { resend } from "@/lib/resend";
import { sendPlainWhatsAppMessage } from "@/lib/whatsapp";
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "..";
import {
    accessReviewItems,
    accessReviewRuns,
    auditLogs,
    brandConfidentials,
    brandRequests,
    brands,
    complianceExportFiles,
    complianceExportRuns,
    dailyHealthSnapshots,
    monitoringAlertDeliveries,
    monitoringAlertEvents,
    monitoringAlerts,
    orders,
    productVariants,
    refunds,
    slaCheckRuns,
    supportTickets,
    userRoles,
    users,
    userSupportTickets,
    weeklyReportingPacks,
} from "../schema";
import { auditLogQueries, type AuditLogInput } from "./audit-log";

type AlertSeverity = "info" | "warning" | "critical";
type AlertChannel = "whatsapp" | "email" | "admin";

type AlertInput = {
    type: string;
    severity: AlertSeverity;
    entityType: string;
    entityId: string;
    title: string;
    message: string;
    ownerId?: string | null;
    ownerRole?: string | null;
    channels?: AlertChannel[];
    recipients?: string[];
    dueAt?: Date | null;
    acknowledgedDueAt?: Date | null;
    dedupeKey: string;
    metadata?: Record<string, unknown>;
};

type AlertAction = {
    alertId: string;
    actorId?: string | null;
    reasonCode?: string | null;
    notes?: string | null;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ALERT_RECIPIENTS = [
    process.env.RENIVET_ALERT_EMAIL,
    process.env.RENIVET_EMAIL_1,
    process.env.RENIVET_EMAIL_2,
].filter(Boolean) as string[];
const ALERT_WHATSAPP_RECIPIENTS = (process.env.RENIVET_ALERT_WHATSAPP ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function monthWindow(month: string) {
    const [year, monthIndex] = month.split("-").map(Number);
    const start = new Date(year, monthIndex - 1, 1);
    const end = new Date(year, monthIndex, 1);
    return { start, end };
}

function addYears(date: Date, years: number) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
}

function csvEscape(value: unknown) {
    const text = value == null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
}

function toCsv<T extends Record<string, unknown>>(rows: T[]) {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    return [
        headers.map(csvEscape).join(","),
        ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
    ].join("\n");
}

class MonitoringSlaQuery {
    async writeAudit(input: AuditLogInput) {
        return auditLogQueries.write(input);
    }

    async createAlert(input: AlertInput) {
        const existing = await db.query.monitoringAlerts.findFirst({
            where: and(
                eq(monitoringAlerts.dedupeKey, input.dedupeKey),
                inArray(monitoringAlerts.status, ["open", "acknowledged", "escalated"])
            ),
        });

        if (existing) return existing;

        const channels: AlertChannel[] = input.channels?.length
            ? input.channels
            : input.severity === "info"
              ? ["admin"]
              : ["admin", "email"];
        const recipients = input.recipients?.length ? input.recipients : ALERT_RECIPIENTS;
        const now = new Date();

        const alert = await db
            .insert(monitoringAlerts)
            .values({
                ...input,
                channels,
                recipients,
                acknowledgedDueAt:
                    input.acknowledgedDueAt ??
                    new Date(now.getTime() + (input.severity === "critical" ? 2 : 4) * HOUR),
            })
            .returning()
            .then((res) => res[0]);

        await db.insert(monitoringAlertEvents).values({
            alertId: alert.id,
            action: "created",
            actorId: input.ownerId,
            metadata: input.metadata ?? {},
        });

        await this.writeAudit({
            userId: input.ownerId,
            actionType: "alert_created",
            entityType: input.entityType,
            entityId: input.entityId,
            afterValue: {
                alertId: alert.id,
                severity: alert.severity,
                title: alert.title,
                channels,
                recipients,
            },
            reason: input.type,
            metadata: input.metadata ?? {},
        });

        await this.dispatchAlert(alert.id);
        return alert;
    }

    async dispatchAlert(alertId: string) {
        const alert = await db.query.monitoringAlerts.findFirst({
            where: eq(monitoringAlerts.id, alertId),
        });
        if (!alert) return [];

        const channels = alert.channels?.length ? alert.channels : ["admin"];
        const emailRecipients = alert.recipients?.length ? alert.recipients : ALERT_RECIPIENTS;
        const deliveries = [];

        if (channels.includes("admin")) {
            deliveries.push(
                await db
                    .insert(monitoringAlertDeliveries)
                    .values({
                        alertId,
                        channel: "admin",
                        recipient: "alert-center",
                        status: "sent",
                        sentAt: new Date(),
                    })
                    .returning()
                    .then((res) => res[0])
            );
        }

        if (channels.includes("email")) {
            for (const recipient of emailRecipients) {
                try {
                    const sent = await resend.emails.send({
                        from: env.RESEND_EMAIL_FROM,
                        to: recipient,
                        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
                        text: `${alert.message}\n\nEntity: ${alert.entityType} ${alert.entityId}`,
                    });
                    deliveries.push(
                        await db
                            .insert(monitoringAlertDeliveries)
                            .values({
                                alertId,
                                channel: "email",
                                recipient,
                                status: sent.error ? "failed" : "sent",
                                providerMessageId: sent.data?.id,
                                error: sent.error?.message,
                                sentAt: sent.error ? undefined : new Date(),
                            })
                            .returning()
                            .then((res) => res[0])
                    );
                } catch (error) {
                    deliveries.push(
                        await db
                            .insert(monitoringAlertDeliveries)
                            .values({
                                alertId,
                                channel: "email",
                                recipient,
                                status: "failed",
                                error: error instanceof Error ? error.message : "Email send failed",
                            })
                            .returning()
                            .then((res) => res[0])
                    );
                }
            }
        }

        if (channels.includes("whatsapp")) {
            for (const recipient of ALERT_WHATSAPP_RECIPIENTS) {
                try {
                    const sent = await sendPlainWhatsAppMessage({
                        recipientPhoneNumber: recipient,
                        message: `[${alert.severity.toUpperCase()}] ${alert.title}\n${alert.message}`,
                    });
                    deliveries.push(
                        await db
                            .insert(monitoringAlertDeliveries)
                            .values({
                                alertId,
                                channel: "whatsapp",
                                recipient,
                                status: "sent",
                                providerMessageId: sent.data?.sid,
                                sentAt: new Date(),
                            })
                            .returning()
                            .then((res) => res[0])
                    );
                } catch (error) {
                    deliveries.push(
                        await db
                            .insert(monitoringAlertDeliveries)
                            .values({
                                alertId,
                                channel: "whatsapp",
                                recipient,
                                status: "failed",
                                error: error instanceof Error ? error.message : "WhatsApp send failed",
                            })
                            .returning()
                            .then((res) => res[0])
                    );
                }
            }
        }

        return deliveries;
    }

    async updateAlertStatus(status: "acknowledged" | "escalated" | "resolved", input: AlertAction) {
        const before = await db.query.monitoringAlerts.findFirst({
            where: eq(monitoringAlerts.id, input.alertId),
        });
        const now = new Date();
        const values =
            status === "acknowledged"
                ? {
                      status,
                      acknowledgedBy: input.actorId,
                      acknowledgedAt: now,
                      reasonCode: input.reasonCode,
                      notes: input.notes,
                  }
                : status === "escalated"
                  ? {
                        status,
                        escalatedBy: input.actorId,
                        escalatedAt: now,
                        reasonCode: input.reasonCode,
                        notes: input.notes,
                    }
                  : {
                        status,
                        resolvedBy: input.actorId,
                        resolvedAt: now,
                        reasonCode: input.reasonCode,
                        notes: input.notes,
                    };

        const alert = await db
            .update(monitoringAlerts)
            .set(values)
            .where(eq(monitoringAlerts.id, input.alertId))
            .returning()
            .then((res) => res[0]);

        if (alert) {
            await db.insert(monitoringAlertEvents).values({
                alertId: input.alertId,
                action: status,
                actorId: input.actorId,
                reasonCode: input.reasonCode,
                notes: input.notes,
            });
            await this.writeAudit({
                userId: input.actorId,
                actionType: `alert_${status}`,
                entityType: alert.entityType,
                entityId: alert.entityId,
                beforeValue: before ? { status: before.status } : null,
                afterValue: { status: alert.status },
                reason: input.reasonCode ?? input.notes,
                metadata: { alertId: alert.id },
            });
        }

        return alert;
    }

    async getActiveAlerts(limit = 50) {
        return db.query.monitoringAlerts.findMany({
            where: ne(monitoringAlerts.status, "resolved"),
            orderBy: [desc(monitoringAlerts.severity), desc(monitoringAlerts.createdAt)],
            limit,
        });
    }

    async getAlertSummary() {
        return db
            .select({
                status: monitoringAlerts.status,
                severity: monitoringAlerts.severity,
                count: sql<number>`count(*)`,
            })
            .from(monitoringAlerts)
            .groupBy(monitoringAlerts.status, monitoringAlerts.severity);
    }

    async runSlaCheck(actorId?: string | null) {
        const runKey = `sla-${new Date().toISOString().slice(0, 13)}`;
        const existingRun = await db.query.slaCheckRuns.findFirst({
            where: eq(slaCheckRuns.runKey, runKey),
        });
        if (existingRun?.status === "completed") return existingRun;

        const run =
            existingRun ??
            (await db
                .insert(slaCheckRuns)
                .values({ runKey, status: "running" })
                .returning()
                .then((res) => res[0]));
        if (!run) throw new Error("Unable to create SLA check run");

        const now = new Date();
        const twoHourCutoff = new Date(now.getTime() - 2 * HOUR);
        const dayCutoff = new Date(now.getTime() - DAY);
        const twoDayCutoff = new Date(now.getTime() - 2 * DAY);
        const thirtyDayCutoff = new Date(now.getTime() + 30 * DAY);
        let checkedCount = 0;
        let breachCount = 0;

        const unassignedTickets = await db
            .select({ id: supportTickets.id, title: supportTickets.title, createdAt: supportTickets.createdAt })
            .from(supportTickets)
            .where(
                and(
                    inArray(supportTickets.status, ["open", "pending", "in_progress"]),
                    isNull(supportTickets.assignedAdminId),
                    lt(supportTickets.createdAt, twoHourCutoff)
                )
            )
            .limit(100);

        const staleAdminTickets = await db
            .select({ id: supportTickets.id, title: supportTickets.title, statusChangedAt: supportTickets.statusChangedAt })
            .from(supportTickets)
            .where(
                and(
                    inArray(supportTickets.status, ["open", "pending", "in_progress"]),
                    lt(supportTickets.statusChangedAt, dayCutoff)
                )
            )
            .limit(100);

        const staleUserTickets = await db
            .select({ id: userSupportTickets.id, title: userSupportTickets.title, statusChangedAt: userSupportTickets.statusChangedAt })
            .from(userSupportTickets)
            .where(
                and(
                    inArray(userSupportTickets.status, ["open", "pending", "in_progress"]),
                    lt(userSupportTickets.statusChangedAt, dayCutoff)
                )
            )
            .limit(100);

        const unackOrders24 = await db
            .select({ id: orders.id, createdAt: orders.createdAt })
            .from(orders)
            .where(and(inArray(orders.status, ["pending", "processing"]), isNull(orders.brandAcknowledgedAt), lt(orders.createdAt, dayCutoff)))
            .limit(100);

        const stuckOrders = await db
            .select({ id: orders.id, updatedAt: orders.updatedAt })
            .from(orders)
            .where(and(inArray(orders.status, ["pending", "processing"]), lt(orders.updatedAt, twoDayCutoff)))
            .limit(100);

        const pendingRefunds = await db
            .select({ id: refunds.id, createdAt: refunds.createdAt })
            .from(refunds)
            .where(and(eq(refunds.status, "pending"), lt(refunds.createdAt, twoDayCutoff)))
            .limit(100);

        const failedPayments = await db
            .select({ id: orders.id, updatedAt: orders.updatedAt })
            .from(orders)
            .where(eq(orders.paymentStatus, "failed"))
            .limit(100);

        const contractExpiring = await db
            .select({ id: brands.id, name: brands.name, contractExpiresAt: brands.contractExpiresAt })
            .from(brands)
            .where(and(isNotNull(brands.contractExpiresAt), lt(brands.contractExpiresAt, thirtyDayCutoff)))
            .limit(100);

        const certExpiring = await db
            .select({ id: brandConfidentials.id, sustainabilityCertificateExpiresAt: brandConfidentials.sustainabilityCertificateExpiresAt })
            .from(brandConfidentials)
            .where(and(isNotNull(brandConfidentials.sustainabilityCertificateExpiresAt), lt(brandConfidentials.sustainabilityCertificateExpiresAt, thirtyDayCutoff)))
            .limit(100);

        const lowInventory = await db
            .select({ id: productVariants.id, sku: productVariants.sku, quantity: productVariants.quantity })
            .from(productVariants)
            .where(and(gte(productVariants.quantity, 0), lt(productVariants.quantity, 5)))
            .limit(100);

        for (const ticket of unassignedTickets) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "ticket_unassigned",
                severity: "warning",
                entityType: "support_ticket",
                entityId: ticket.id,
                title: "Ticket unassigned for more than 2 hours",
                message: `${ticket.title} needs an owner within 1 hour.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(ticket.createdAt.getTime() + 3 * HOUR),
                dedupeKey: `ticket:unassigned:${ticket.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const ticket of [...staleAdminTickets, ...staleUserTickets]) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "ticket_unresponded_24h",
                severity: "critical",
                entityType: "support_ticket",
                entityId: ticket.id,
                title: "Ticket unresponded for more than 24 hours",
                message: `${ticket.title} has not moved within 24 hours.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(ticket.statusChangedAt!.getTime() + 28 * HOUR),
                dedupeKey: `ticket:stale:${ticket.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const order of unackOrders24) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "order_unacknowledged_24h",
                severity: now.getTime() - order.createdAt.getTime() > 2 * DAY ? "critical" : "warning",
                entityType: "order",
                entityId: order.id,
                title: "Order not acknowledged by brand",
                message: `Order ${order.id} has not been acknowledged within 24 hours.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(order.createdAt.getTime() + 28 * HOUR),
                dedupeKey: `order:unack:${order.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const order of stuckOrders) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "order_stuck_48h",
                severity: "critical",
                entityType: "order",
                entityId: order.id,
                title: "Order stuck with no movement",
                message: `Order ${order.id} has no status movement for more than 48 hours.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(order.updatedAt.getTime() + 52 * HOUR),
                dedupeKey: `order:stuck:${order.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const refund of pendingRefunds) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "refund_pending_48h",
                severity: "warning",
                entityType: "refund",
                entityId: refund.id,
                title: "Refund pending processing",
                message: `Refund ${refund.id} has been pending for more than 48 hours.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(refund.createdAt.getTime() + 52 * HOUR),
                dedupeKey: `refund:pending:${refund.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const order of failedPayments) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "payment_failed",
                severity: "warning",
                entityType: "order",
                entityId: order.id,
                title: "Payment failed",
                message: `Order ${order.id} has a failed payment status.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email"],
                dueAt: new Date(order.updatedAt.getTime() + 4 * HOUR),
                dedupeKey: `payment:failed:${order.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const brand of contractExpiring) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "brand_contract_expiring",
                severity: "warning",
                entityType: "brand",
                entityId: brand.id,
                title: "Brand contract expiring within 30 days",
                message: `${brand.name} contract expires on ${brand.contractExpiresAt?.toISOString().slice(0, 10)}.`,
                ownerId: actorId,
                ownerRole: "brand_manager",
                channels: ["admin", "email"],
                dueAt: brand.contractExpiresAt,
                dedupeKey: `brand:contract-expiry:${brand.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const cert of certExpiring) {
            checkedCount += 1;
            breachCount += 1;
            const expired = cert.sustainabilityCertificateExpiresAt! < now;
            await this.createAlert({
                type: expired ? "sustainability_cert_expired" : "sustainability_cert_expiring",
                severity: expired ? "critical" : "warning",
                entityType: "brand_confidential",
                entityId: cert.id,
                title: expired ? "Sustainability certificate expired" : "Sustainability certificate expiring",
                message: `Certificate date: ${cert.sustainabilityCertificateExpiresAt?.toISOString().slice(0, 10)}.`,
                ownerId: actorId,
                ownerRole: "brand_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: cert.sustainabilityCertificateExpiresAt,
                dedupeKey: `brand:cert-expiry:${cert.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const variant of lowInventory) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "inventory_below_threshold",
                severity: "info",
                entityType: "product_variant",
                entityId: variant.id,
                title: "Inventory below threshold",
                message: `${variant.sku ?? variant.id} has ${variant.quantity} units left.`,
                ownerId: actorId,
                ownerRole: "catalog_intern",
                channels: ["admin"],
                dueAt: new Date(now.getTime() + DAY),
                dedupeKey: `inventory:low:${variant.id}`,
                metadata: { source: "sla-check" },
            });
        }

        await this.escalateOverdueAlerts(actorId ?? "cron");

        return db
            .update(slaCheckRuns)
            .set({
                status: "completed",
                finishedAt: new Date(),
                checkedCount: String(checkedCount),
                breachCount: String(breachCount),
                metadata: {
                    unassignedTickets: unassignedTickets.length,
                    staleTickets: staleAdminTickets.length + staleUserTickets.length,
                    unackOrders24: unackOrders24.length,
                    stuckOrders: stuckOrders.length,
                    pendingRefunds: pendingRefunds.length,
                    failedPayments: failedPayments.length,
                    contractExpiring: contractExpiring.length,
                    certExpiring: certExpiring.length,
                    lowInventory: lowInventory.length,
                },
            })
            .where(eq(slaCheckRuns.id, run.id))
            .returning()
            .then((res) => res[0]);
    }

    async escalateOverdueAlerts(actorId: string) {
        const overdue = await db.query.monitoringAlerts.findMany({
            where: and(
                inArray(monitoringAlerts.status, ["open", "acknowledged"]),
                inArray(monitoringAlerts.severity, ["warning", "critical"]),
                lt(monitoringAlerts.acknowledgedDueAt, new Date())
            ),
            limit: 100,
        });

        for (const alert of overdue) {
            await this.updateAlertStatus("escalated", {
                alertId: alert.id,
                actorId,
                reasonCode: "auto_escalated_sla",
                notes: "Alert was not acknowledged within SLA.",
            });
        }

        return overdue.length;
    }

    async getDailyHealth() {
        const today = startOfDay();
        const weekStart = new Date(today.getTime() - 6 * DAY);
        const dayCutoff = new Date(Date.now() - DAY);
        const twoDayCutoff = new Date(Date.now() - 2 * DAY);

        const [
            ordersPlaced24h,
            ordersUnack24h,
            ordersShipped24h,
            stuckOrders48h,
            openAlerts,
            criticalAlerts,
            openAdminTickets,
            openUserTickets,
            agedAdminTickets,
            agedUserTickets,
            pendingRefunds,
            failedPayments,
            pendingBrandRequests,
            weeklyOrders,
        ] = await Promise.all([
            db.$count(orders, gte(orders.createdAt, today)),
            db.$count(orders, and(inArray(orders.status, ["pending", "processing"]), isNull(orders.brandAcknowledgedAt), lt(orders.createdAt, dayCutoff))),
            db.$count(orders, and(eq(orders.status, "shipped"), gte(orders.updatedAt, today))),
            db.$count(orders, and(inArray(orders.status, ["pending", "processing"]), lt(orders.updatedAt, twoDayCutoff))),
            db.$count(monitoringAlerts, ne(monitoringAlerts.status, "resolved")),
            db.$count(monitoringAlerts, and(eq(monitoringAlerts.severity, "critical"), ne(monitoringAlerts.status, "resolved"))),
            db.$count(supportTickets, inArray(supportTickets.status, ["open", "pending", "in_progress"])),
            db.$count(userSupportTickets, inArray(userSupportTickets.status, ["open", "pending", "in_progress"])),
            db.$count(supportTickets, and(inArray(supportTickets.status, ["open", "pending", "in_progress"]), lt(supportTickets.statusChangedAt, dayCutoff))),
            db.$count(userSupportTickets, and(inArray(userSupportTickets.status, ["open", "pending", "in_progress"]), lt(userSupportTickets.statusChangedAt, dayCutoff))),
            db.$count(refunds, eq(refunds.status, "pending")),
            db.$count(orders, eq(orders.paymentStatus, "failed")),
            db.$count(brandRequests, eq(brandRequests.status, "pending")),
            db.$count(orders, gte(orders.createdAt, weekStart)),
        ]);

        const status: "green" | "amber" | "red" =
            criticalAlerts > 0 || stuckOrders48h > 0 ? "red" : openAlerts > 0 || pendingRefunds > 0 ? "amber" : "green";

        return {
            status,
            metrics: {
                ordersPlaced24h,
                ordersUnacknowledged24h: ordersUnack24h,
                ordersShipped24h,
                stuckOrders48h,
                openTickets: openAdminTickets + openUserTickets,
                ticketsAged24h: agedAdminTickets + agedUserTickets,
                refundsPendingProcessing: pendingRefunds,
                refundsPendingQc: 0,
                failedPayments,
                brandNonResponseCases: pendingBrandRequests,
                platformUptime24h: "manual",
                ordersWtd: weeklyOrders,
                openAlerts,
                criticalAlerts,
            },
        };
    }

    async saveDailySnapshot(actorId?: string | null) {
        const snapshotDate = new Date().toISOString().slice(0, 10);
        const health = await this.getDailyHealth();
        const existing = await db.query.dailyHealthSnapshots.findFirst({
            where: eq(dailyHealthSnapshots.snapshotDate, snapshotDate),
        });
        await this.writeAudit({
            userId: actorId,
            actionType: "daily_health_snapshot_generated",
            entityType: "daily_health_snapshot",
            entityId: snapshotDate,
            afterValue: health.metrics,
            reason: "daily_health_evidence",
        });

        if (existing) {
            return db
                .update(dailyHealthSnapshots)
                .set({ metrics: health.metrics, status: health.status, generatedBy: actorId })
                .where(eq(dailyHealthSnapshots.id, existing.id))
                .returning()
                .then((res) => res[0]);
        }

        return db
            .insert(dailyHealthSnapshots)
            .values({ snapshotDate, metrics: health.metrics, status: health.status, generatedBy: actorId })
            .returning()
            .then((res) => res[0]);
    }

    async generateWeeklyPack(actorId?: string | null) {
        const end = startOfDay();
        const start = new Date(end.getTime() - 6 * DAY);
        const weekStart = start.toISOString().slice(0, 10);
        const weekEnd = end.toISOString().slice(0, 10);
        const health = await this.getDailyHealth();
        const actionItems = [
            health.metrics.criticalAlerts ? "Resolve critical monitoring alerts before founder review." : "Confirm open alerts are owned.",
            health.metrics.ticketsAged24h ? "Clear support tickets aged over 24 hours." : "Keep ticket first response SLA green.",
            health.metrics.ordersUnacknowledged24h ? "Chase brands on unacknowledged orders." : "No brand acknowledgement backlog.",
        ];

        const existing = await db.query.weeklyReportingPacks.findFirst({
            where: and(eq(weeklyReportingPacks.weekStart, weekStart), eq(weeklyReportingPacks.weekEnd, weekEnd)),
        });

        const values = {
            executiveSnapshot: `GMV/order evidence pending finance integration. System status is ${health.status}. Open alerts: ${health.metrics.openAlerts}. Open tickets: ${health.metrics.openTickets}. Orders WTD: ${health.metrics.ordersWtd}.`,
            actionItems,
            metrics: {
                executiveSnapshot: health.metrics,
                operationalMetrics: {
                    slaHitRate: health.metrics.openAlerts ? "review" : "green",
                    ticketsAged24h: health.metrics.ticketsAged24h,
                    refundsPendingProcessing: health.metrics.refundsPendingProcessing,
                },
                financialSnapshot: {
                    refundsPendingProcessing: health.metrics.refundsPendingProcessing,
                    failedPayments: health.metrics.failedPayments,
                },
                brandHealth: {
                    brandNonResponseCases: health.metrics.brandNonResponseCases,
                },
            },
            generatedBy: actorId,
        };

        await this.writeAudit({
            userId: actorId,
            actionType: "weekly_pack_generated",
            entityType: "weekly_reporting_pack",
            entityId: `${weekStart}:${weekEnd}`,
            afterValue: values,
            reason: "friday_weekly_review_pack",
        });

        if (existing) {
            return db
                .update(weeklyReportingPacks)
                .set(values)
                .where(eq(weeklyReportingPacks.id, existing.id))
                .returning()
                .then((res) => res[0]);
        }

        return db
            .insert(weeklyReportingPacks)
            .values({ weekStart, weekEnd, ...values })
            .returning()
            .then((res) => res[0]);
    }

    async buildComplianceExport(exportMonth: string, exportType: string) {
        const { start, end } = monthWindow(exportMonth);
        const auditByTypes = async (types: string[]) =>
            db
                .select({
                    timestampUtc: auditLogs.timestampUtc,
                    userId: auditLogs.userId,
                    actionType: auditLogs.actionType,
                    entityType: auditLogs.entityType,
                    entityId: auditLogs.entityId,
                    reason: auditLogs.reason,
                })
                .from(auditLogs)
                .where(and(gte(auditLogs.timestampUtc, start), lt(auditLogs.timestampUtc, end), inArray(auditLogs.entityType, types)));

        if (exportType === "refunds") {
            const rows = await db
                .select({
                    id: refunds.id,
                    orderId: refunds.orderId,
                    status: refunds.status,
                    amount: refunds.amount,
                    reasonCode: refunds.reasonCode,
                    createdAt: refunds.createdAt,
                    updatedAt: refunds.updatedAt,
                })
                .from(refunds)
                .where(and(gte(refunds.createdAt, start), lt(refunds.createdAt, end)));
            return { rows, csv: toCsv(rows), files: [{ name: `${exportMonth}-refund-audit.csv`, rowCount: rows.length }] };
        }

        const exportMap: Record<string, string[]> = {
            "brand-actions": ["brand", "brand_request", "brand_confidential"],
            "access-changes": ["user", "role", "user_role", "access_review"],
            "manual-overrides": ["manual_override", "order", "refund"],
            "sustainability-claims": ["product", "brand_confidential"],
            "data-deletion-requests": ["customer_account", "data_deletion_request"],
            "customer-escalations": ["support_ticket", "user_support_ticket"],
            alerts: ["monitoring_alert", "alert"],
        };
        const rows = await auditByTypes(exportMap[exportType] ?? exportMap.alerts);
        return { rows, csv: toCsv(rows), files: [{ name: `${exportMonth}-${exportType}.csv`, rowCount: rows.length }] };
    }

    async generateComplianceExport(exportMonth: string, exportType: string, actorId?: string | null) {
        const { start, end } = monthWindow(exportMonth);
        const built = await this.buildComplianceExport(exportMonth, exportType);
        const retentionUntil = addYears(end, 7);
        const run = await db
            .insert(complianceExportRuns)
            .values({
                exportMonth,
                exportType,
                generatedBy: actorId,
                rowCount: String(built.rows.length),
                filters: { start: start.toISOString(), end: end.toISOString() },
                metadata: { generatedFrom: "monitoring-sla", retention: "7 years" },
                files: built.files,
                retentionUntil,
            })
            .returning()
            .then((res) => res[0]);

        await db.insert(complianceExportFiles).values(
            built.files.map((file) => ({
                exportRunId: run.id,
                fileName: file.name,
                rowCount: String(file.rowCount),
                metadata: { downloadable: true, contentPreview: built.csv.slice(0, 5000) },
            }))
        );

        await this.writeAudit({
            userId: actorId,
            actionType: "compliance_export_generated",
            entityType: "compliance_export",
            entityId: run.id,
            afterValue: { exportMonth, exportType, rowCount: built.rows.length, files: built.files },
            reason: "monthly_compliance_evidence",
        });

        return run;
    }

    async generateAccessReview(actorId?: string | null) {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        const reviewPeriod = `${now.getFullYear()}-Q${quarter}`;
        const existing = await db.query.accessReviewRuns.findFirst({
            where: eq(accessReviewRuns.reviewPeriod, reviewPeriod),
        });
        if (existing) return existing;

        const review = await db
            .insert(accessReviewRuns)
            .values({ reviewPeriod, generatedBy: actorId, status: "in_review" })
            .returning()
            .then((res) => res[0]);

        const activeUsers = await db
            .select({
                id: users.id,
                email: users.email,
                roleCount: sql<number>`count(${userRoles.id})`,
            })
            .from(users)
            .leftJoin(userRoles, eq(userRoles.userId, users.id))
            .groupBy(users.id)
            .limit(500);

        if (activeUsers.length) {
            await db.insert(accessReviewItems).values(
                activeUsers.map((user) => ({
                    reviewId: review.id,
                    userId: user.id,
                    email: user.email,
                    roleSummary: `${user.roleCount ?? 0} assigned roles`,
                    decision: "pending" as const,
                }))
            );
        }

        await this.writeAudit({
            userId: actorId,
            actionType: "access_review_generated",
            entityType: "access_review",
            entityId: review.id,
            afterValue: { reviewPeriod, itemCount: activeUsers.length },
            reason: "quarterly_access_review",
        });

        return review;
    }

    async getRecentEvidence() {
        const [runs, packs, exports, reviews, snapshots, audit] = await Promise.all([
            db.query.slaCheckRuns.findMany({ orderBy: [desc(slaCheckRuns.createdAt)], limit: 5 }),
            db.query.weeklyReportingPacks.findMany({ orderBy: [desc(weeklyReportingPacks.createdAt)], limit: 5 }),
            db.query.complianceExportRuns.findMany({ orderBy: [desc(complianceExportRuns.createdAt)], limit: 5 }),
            db.query.accessReviewRuns.findMany({ orderBy: [desc(accessReviewRuns.createdAt)], limit: 5 }),
            db.query.dailyHealthSnapshots.findMany({ orderBy: [desc(dailyHealthSnapshots.createdAt)], limit: 5 }),
            db.query.auditLogs.findMany({ orderBy: [desc(auditLogs.timestampUtc)], limit: 5 }),
        ]);

        return { runs, packs, exports, reviews, snapshots, audit };
    }
}

export const monitoringSlaQueries = new MonitoringSlaQuery();

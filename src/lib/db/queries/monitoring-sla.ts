import { and, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "..";
import {
    accessReviewItems,
    accessReviewRuns,
    brandRequests,
    brands,
    complianceExportRuns,
    dailyHealthSnapshots,
    monitoringAlertEvents,
    monitoringAlerts,
    orders,
    refunds,
    slaCheckRuns,
    supportTickets,
    userRoles,
    users,
    userSupportTickets,
    weeklyReportingPacks,
} from "../schema";

type AlertInput = {
    type: string;
    severity: "info" | "warning" | "critical";
    entityType: string;
    entityId: string;
    title: string;
    message: string;
    ownerId?: string | null;
    dueAt?: Date | null;
    dedupeKey: string;
    metadata?: Record<string, unknown>;
};

type AlertAction = {
    alertId: string;
    actorId?: string | null;
    reasonCode?: string | null;
    notes?: string | null;
};

const DAY = 24 * 60 * 60 * 1000;

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

class MonitoringSlaQuery {
    async createAlert(input: AlertInput) {
        const existing = await db.query.monitoringAlerts.findFirst({
            where: and(
                eq(monitoringAlerts.dedupeKey, input.dedupeKey),
                inArray(monitoringAlerts.status, ["open", "acknowledged", "escalated"])
            ),
        });

        if (existing) return existing;

        const alert = await db
            .insert(monitoringAlerts)
            .values(input)
            .returning()
            .then((res) => res[0]);

        await db.insert(monitoringAlertEvents).values({
            alertId: alert.id,
            action: "created",
            actorId: input.ownerId,
            metadata: input.metadata ?? {},
        });

        return alert;
    }

    async updateAlertStatus(status: "acknowledged" | "escalated" | "resolved", input: AlertAction) {
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
        const rows = await db
            .select({
                status: monitoringAlerts.status,
                severity: monitoringAlerts.severity,
                count: sql<number>`count(*)`,
            })
            .from(monitoringAlerts)
            .groupBy(monitoringAlerts.status, monitoringAlerts.severity);

        return rows;
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
        const ticketCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const orderCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const refundCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        let checkedCount = 0;
        let breachCount = 0;

        const staleAdminTickets = await db
            .select({
                id: supportTickets.id,
                title: supportTickets.title,
                statusChangedAt: supportTickets.statusChangedAt,
            })
            .from(supportTickets)
            .where(
                and(
                    inArray(supportTickets.status, ["open", "pending", "in_progress"]),
                    lt(supportTickets.statusChangedAt, ticketCutoff)
                )
            )
            .limit(100);

        const staleUserTickets = await db
            .select({
                id: userSupportTickets.id,
                title: userSupportTickets.title,
                statusChangedAt: userSupportTickets.statusChangedAt,
            })
            .from(userSupportTickets)
            .where(
                and(
                    inArray(userSupportTickets.status, ["open", "pending", "in_progress"]),
                    lt(userSupportTickets.statusChangedAt, ticketCutoff)
                )
            )
            .limit(100);

        const pendingOrders = await db
            .select({ id: orders.id, createdAt: orders.createdAt })
            .from(orders)
            .where(and(inArray(orders.status, ["pending", "processing"]), lt(orders.createdAt, orderCutoff)))
            .limit(100);

        const pendingRefunds = await db
            .select({ id: refunds.id, createdAt: refunds.createdAt })
            .from(refunds)
            .where(and(eq(refunds.status, "pending"), lt(refunds.createdAt, refundCutoff)))
            .limit(100);

        for (const ticket of [...staleAdminTickets, ...staleUserTickets]) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "sla_breach",
                severity: "critical",
                entityType: "support_ticket",
                entityId: ticket.id,
                title: "Support ticket SLA breached",
                message: `${ticket.title} has not moved within 24 hours.`,
                ownerId: actorId,
                dueAt: ticket.statusChangedAt,
                dedupeKey: `sla:support_ticket:${ticket.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const order of pendingOrders) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "sla_breach",
                severity: "warning",
                entityType: "order",
                entityId: order.id,
                title: "Order processing SLA breached",
                message: `Order ${order.id} has been pending/processing for more than 48 hours.`,
                ownerId: actorId,
                dueAt: order.createdAt,
                dedupeKey: `sla:order:${order.id}`,
                metadata: { source: "sla-check" },
            });
        }

        for (const refund of pendingRefunds) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "sla_breach",
                severity: "critical",
                entityType: "refund",
                entityId: refund.id,
                title: "Refund SLA breached",
                message: `Refund ${refund.id} has been pending for more than 72 hours.`,
                ownerId: actorId,
                dueAt: refund.createdAt,
                dedupeKey: `sla:refund:${refund.id}`,
                metadata: { source: "sla-check" },
            });
        }

        return db
            .update(slaCheckRuns)
            .set({
                status: "completed",
                finishedAt: new Date(),
                checkedCount: String(checkedCount),
                breachCount: String(breachCount),
                metadata: {
                    staleAdminTickets: staleAdminTickets.length,
                    staleUserTickets: staleUserTickets.length,
                    pendingOrders: pendingOrders.length,
                    pendingRefunds: pendingRefunds.length,
                },
            })
            .where(eq(slaCheckRuns.id, run.id))
            .returning()
            .then((res) => res[0]);
    }

    async getDailyHealth() {
        const today = startOfDay();
        const weekStart = new Date(today.getTime() - 6 * DAY);

        const [orderCount, openAlerts, criticalAlerts, openAdminTickets, openUserTickets, pendingRefunds, brandPending] =
            await Promise.all([
                db.$count(orders, gte(orders.createdAt, today)),
                db.$count(monitoringAlerts, ne(monitoringAlerts.status, "resolved")),
                db.$count(
                    monitoringAlerts,
                    and(eq(monitoringAlerts.severity, "critical"), ne(monitoringAlerts.status, "resolved"))
                ),
                db.$count(supportTickets, inArray(supportTickets.status, ["open", "pending", "in_progress"])),
                db.$count(userSupportTickets, inArray(userSupportTickets.status, ["open", "pending", "in_progress"])),
                db.$count(refunds, eq(refunds.status, "pending")),
                db.$count(brandRequests, eq(brandRequests.status, "pending")),
            ]);

        const weeklyOrders = await db.$count(orders, gte(orders.createdAt, weekStart));
        const status: "green" | "amber" | "red" =
            criticalAlerts > 0 ? "red" : openAlerts > 0 || pendingRefunds > 0 ? "amber" : "green";

        return {
            status,
            metrics: {
                ordersToday: orderCount,
                orders7d: weeklyOrders,
                openAlerts,
                criticalAlerts,
                openTickets: openAdminTickets + openUserTickets,
                pendingRefunds,
                pendingBrandRequests: brandPending,
            },
        };
    }

    async saveDailySnapshot(actorId?: string | null) {
        const snapshotDate = new Date().toISOString().slice(0, 10);
        const health = await this.getDailyHealth();
        const existing = await db.query.dailyHealthSnapshots.findFirst({
            where: eq(dailyHealthSnapshots.snapshotDate, snapshotDate),
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
        const actionItems = health.metrics.criticalAlerts
            ? ["Resolve critical monitoring alerts before founder review."]
            : ["Review open alerts and confirm no manual follow-up is stuck outside the system."];

        const existing = await db.query.weeklyReportingPacks.findFirst({
            where: and(eq(weeklyReportingPacks.weekStart, weekStart), eq(weeklyReportingPacks.weekEnd, weekEnd)),
        });

        const values = {
            executiveSnapshot: `System status is ${health.status}. Open alerts: ${health.metrics.openAlerts}. Open tickets: ${health.metrics.openTickets}.`,
            actionItems,
            metrics: health.metrics,
            generatedBy: actorId,
        };

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

    async generateComplianceExport(exportMonth: string, exportType: string, actorId?: string | null) {
        const { start, end } = monthWindow(exportMonth);
        let rowCount = 0;

        if (exportType === "refunds") {
            rowCount = await db.$count(refunds, and(gte(refunds.createdAt, start), lt(refunds.createdAt, end)));
        } else if (exportType === "brand-actions") {
            rowCount = await db.$count(brandRequests, and(gte(brandRequests.createdAt, start), lt(brandRequests.createdAt, end)));
        } else if (exportType === "access-changes") {
            rowCount = await db.$count(userRoles, and(gte(userRoles.createdAt, start), lt(userRoles.createdAt, end)));
        } else {
            rowCount = await db.$count(monitoringAlertEvents, and(gte(monitoringAlertEvents.createdAt, start), lt(monitoringAlertEvents.createdAt, end)));
        }

        return db
            .insert(complianceExportRuns)
            .values({
                exportMonth,
                exportType,
                generatedBy: actorId,
                rowCount: String(rowCount),
                filters: { start: start.toISOString(), end: end.toISOString() },
                metadata: { generatedFrom: "monitoring-sla" },
            })
            .returning()
            .then((res) => res[0]);
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
                firstName: users.firstName,
                lastName: users.lastName,
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

        return review;
    }

    async getRecentEvidence() {
        const [runs, packs, exports, reviews, snapshots] = await Promise.all([
            db.query.slaCheckRuns.findMany({ orderBy: [desc(slaCheckRuns.createdAt)], limit: 5 }),
            db.query.weeklyReportingPacks.findMany({ orderBy: [desc(weeklyReportingPacks.createdAt)], limit: 5 }),
            db.query.complianceExportRuns.findMany({ orderBy: [desc(complianceExportRuns.createdAt)], limit: 5 }),
            db.query.accessReviewRuns.findMany({ orderBy: [desc(accessReviewRuns.createdAt)], limit: 5 }),
            db.query.dailyHealthSnapshots.findMany({ orderBy: [desc(dailyHealthSnapshots.createdAt)], limit: 5 }),
        ]);

        return { runs, packs, exports, reviews, snapshots };
    }
}

export const monitoringSlaQueries = new MonitoringSlaQuery();

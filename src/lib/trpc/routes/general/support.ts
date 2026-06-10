import {
    calculateCustomerAutoCloseEligibleAt,
    calculateCustomerUpdateDueAt,
    calculateFirstResponseDueAt,
    calculateReopenAllowedUntil,
    calculateResolutionDueAt,
    getSupportCategoryConfig,
    normalizeSupportCategory,
    SUPPORT_CHANNELS,
    SUPPORT_RESOLUTION_CODES,
    SUPPORT_TEMPLATE_LIBRARY,
    SUPPORT_TICKET_STATUSES,
} from "@/lib/customer-support/playbook";
import { db } from "@/lib/db";
import {
    brands,
    supportAttachments,
    supportDailyCheckIns,
    supportInternalNotes,
    supportMessages,
    supportMonthlyPatternReviews,
    supportTickets,
    supportTicketStatusHistory,
    supportWeeklySummaries,
    users,
    userSupportAttachments,
    userSupportDisputes,
    userSupportInternalNotes,
    userSupportMessages,
    userSupportTickets,
} from "@/lib/db/schema";
import {
    auditEntityChange,
    createOperationalAlert,
} from "@/lib/monitoring-sla/audit";
import { createDisputeReplacementOrder } from "@/lib/support/dispute-replacement-order";
import {
    buildAdminSupportHref,
    buildBrandSupportHref,
    buildSupportHref,
    notifyBrandUsers,
    notifyUser,
} from "@/lib/support/utils";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { generateId } from "@/lib/utils";
import {
    and,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    isNotNull,
    lt,
    or,
    sql,
} from "drizzle-orm";
import { z } from "zod";

const attachmentSchema = z.object({
    filename: z.string().min(1),
    url: z.string().url(),
    contentType: z.string().optional(),
    sizeBytes: z.string().optional(),
    fileKey: z.string().optional(),
});

const statusSchema = z.enum(SUPPORT_TICKET_STATUSES);
const resolutionCodeSchema = z.enum(SUPPORT_RESOLUTION_CODES);
const supportChannelSchema = z.enum(SUPPORT_CHANNELS);
const terminalStatuses = [
    "resolved",
    "refunded",
    "replaced",
    "declined",
    "closed",
    "auto_closed",
] as const;

function buildAutomatedSupportReply(ticketId: string, customerName?: string) {
    const humanizedId = ticketId.split("-")[0].toUpperCase();
    return SUPPORT_TEMPLATE_LIBRARY.AUTO_ACK
        .replaceAll("[Customer Name]", customerName || "Customer")
        .replaceAll("[ID]", humanizedId);
}

function formatSupportCategoryLabel(category: string) {
    return category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const activeSupportStatuses = [
    "new",
    "acknowledged",
    "in_progress",
    "waiting_customer",
    "waiting_brand",
    "waiting_internal",
    "reopened",
    "escalated",
    "open",
    "pending",
    "in_review",
    "waiting_for_customer",
    "waiting_for_brand",
    "approved",
];

function dateOnly(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

function weekWindow(date = new Date()) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
}

async function attachBrandMessageFiles(
    messageId: string,
    attachments: z.infer<typeof attachmentSchema>[]
) {
    if (!attachments.length) return;

    await db.insert(supportAttachments).values(
        attachments.map((attachment) => ({
            messageId,
            filename: attachment.filename,
            url: attachment.url,
            contentType: attachment.contentType ?? null,
            sizeBytes: attachment.sizeBytes ?? null,
            fileKey: attachment.fileKey ?? null,
        }))
    );
}

async function attachUserMessageFiles(
    messageId: string,
    attachments: z.infer<typeof attachmentSchema>[]
) {
    if (!attachments.length) return;

    await db.insert(userSupportAttachments).values(
        attachments.map((attachment) => ({
            messageId,
            filename: attachment.filename,
            url: attachment.url,
            contentType: attachment.contentType ?? null,
            sizeBytes: attachment.sizeBytes ?? null,
            fileKey: attachment.fileKey ?? null,
        }))
    );
}

async function computeSupportHealth() {
    const now = new Date();
    const dayCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDayCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const approachingCutoff = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const { start: weekStart } = weekWindow(now);

    const [
        openTickets,
        agedTickets24h,
        agedTickets48h,
        criticalTickets,
        approachingFirstResponse,
        breachedFirstResponse,
        approachingResolution,
        breachedResolution,
        weekTickets,
        recentCsat,
        weeklySummary,
    ] = await Promise.all([
        db.$count(
            userSupportTickets,
            inArray(userSupportTickets.status, activeSupportStatuses)
        ),
        db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, activeSupportStatuses),
                lt(userSupportTickets.statusChangedAt, dayCutoff)
            )
        ),
        db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, activeSupportStatuses),
                lt(userSupportTickets.statusChangedAt, twoDayCutoff)
            )
        ),
        db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, activeSupportStatuses),
                eq(userSupportTickets.priority, "critical")
            )
        ),
        db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, activeSupportStatuses),
                isNotNull(userSupportTickets.firstResponseDueAt),
                lt(userSupportTickets.firstResponseDueAt, approachingCutoff),
                gte(userSupportTickets.firstResponseDueAt, now)
            )
        ),
        db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, activeSupportStatuses),
                isNotNull(userSupportTickets.firstResponseDueAt),
                lt(userSupportTickets.firstResponseDueAt, now),
                sql`${userSupportTickets.firstRespondedAt} IS NULL`
            )
        ),
        db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, activeSupportStatuses),
                isNotNull(userSupportTickets.resolutionDueAt),
                lt(userSupportTickets.resolutionDueAt, approachingCutoff),
                gte(userSupportTickets.resolutionDueAt, now)
            )
        ),
        db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, activeSupportStatuses),
                isNotNull(userSupportTickets.resolutionDueAt),
                lt(userSupportTickets.resolutionDueAt, now)
            )
        ),
        db.query.userSupportTickets.findMany({
            where: gte(userSupportTickets.createdAt, weekStart),
            columns: {
                id: true,
                firstRespondedAt: true,
                firstResponseDueAt: true,
                status: true,
            },
        }),
        db
            .select({
                average: sql<number>`ROUND(AVG(${userSupportTickets.csatScore}) * 100)`,
                count: sql<number>`COUNT(${userSupportTickets.csatScore})`,
            })
            .from(userSupportTickets)
            .where(
                and(
                    isNotNull(userSupportTickets.csatScore),
                    gte(userSupportTickets.csatRespondedAt, weekStart)
                )
            ),
        db.query.supportWeeklySummaries.findFirst({
            orderBy: [desc(supportWeeklySummaries.createdAt)],
        }),
    ]);

    const ticketsWithDueDate = weekTickets.filter(
        (ticket) => ticket.firstResponseDueAt
    );
    const ticketsWithinSla = ticketsWithDueDate.filter(
        (ticket) =>
            ticket.firstRespondedAt &&
            ticket.firstResponseDueAt &&
            ticket.firstRespondedAt <= ticket.firstResponseDueAt
    );
    const slaHitRate = ticketsWithDueDate.length
        ? Math.round(
              (ticketsWithinSla.length / ticketsWithDueDate.length) * 100
          )
        : 100;

    return {
        openTickets,
        agedTickets24h,
        agedTickets48h,
        criticalTickets,
        approachingSla: approachingFirstResponse + approachingResolution,
        breachedSla: breachedFirstResponse + breachedResolution,
        slaHitRate,
        csatAverage: recentCsat[0]?.average
            ? Number(recentCsat[0].average) / 100
            : null,
        csatCount: Number(recentCsat[0]?.count ?? 0),
        latestWeeklySummary: weeklySummary,
    };
}

export const adminSupportRouter = createTRPCRouter({
    getSupportHealth: protectedProcedure.query(async () => {
        const now = new Date();
        const dayCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDayCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const approachingCutoff = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const { start: weekStart } = weekWindow(now);

        const [
            openTickets,
            agedTickets24h,
            agedTickets48h,
            criticalTickets,
            approachingFirstResponse,
            breachedFirstResponse,
            approachingResolution,
            breachedResolution,
            weekTickets,
            recentCsat,
            weeklySummary,
        ] = await Promise.all([
            db.$count(
                userSupportTickets,
                inArray(userSupportTickets.status, activeSupportStatuses)
            ),
            db.$count(
                userSupportTickets,
                and(
                    inArray(userSupportTickets.status, activeSupportStatuses),
                    lt(userSupportTickets.statusChangedAt, dayCutoff)
                )
            ),
            db.$count(
                userSupportTickets,
                and(
                    inArray(userSupportTickets.status, activeSupportStatuses),
                    lt(userSupportTickets.statusChangedAt, twoDayCutoff)
                )
            ),
            db.$count(
                userSupportTickets,
                and(
                    inArray(userSupportTickets.status, activeSupportStatuses),
                    eq(userSupportTickets.priority, "critical")
                )
            ),
            db.$count(
                userSupportTickets,
                and(
                    inArray(userSupportTickets.status, activeSupportStatuses),
                    isNotNull(userSupportTickets.firstResponseDueAt),
                    lt(
                        userSupportTickets.firstResponseDueAt,
                        approachingCutoff
                    ),
                    gte(userSupportTickets.firstResponseDueAt, now)
                )
            ),
            db.$count(
                userSupportTickets,
                and(
                    inArray(userSupportTickets.status, activeSupportStatuses),
                    isNotNull(userSupportTickets.firstResponseDueAt),
                    lt(userSupportTickets.firstResponseDueAt, now),
                    sql`${userSupportTickets.firstRespondedAt} IS NULL`
                )
            ),
            db.$count(
                userSupportTickets,
                and(
                    inArray(userSupportTickets.status, activeSupportStatuses),
                    isNotNull(userSupportTickets.resolutionDueAt),
                    lt(userSupportTickets.resolutionDueAt, approachingCutoff),
                    gte(userSupportTickets.resolutionDueAt, now)
                )
            ),
            db.$count(
                userSupportTickets,
                and(
                    inArray(userSupportTickets.status, activeSupportStatuses),
                    isNotNull(userSupportTickets.resolutionDueAt),
                    lt(userSupportTickets.resolutionDueAt, now)
                )
            ),
            db.query.userSupportTickets.findMany({
                where: gte(userSupportTickets.createdAt, weekStart),
                columns: {
                    id: true,
                    firstRespondedAt: true,
                    firstResponseDueAt: true,
                    status: true,
                },
            }),
            db
                .select({
                    average: sql<number>`ROUND(AVG(${userSupportTickets.csatScore}) * 100)`,
                    count: sql<number>`COUNT(${userSupportTickets.csatScore})`,
                })
                .from(userSupportTickets)
                .where(
                    and(
                        isNotNull(userSupportTickets.csatScore),
                        gte(userSupportTickets.csatRespondedAt, weekStart)
                    )
                ),
            db.query.supportWeeklySummaries.findFirst({
                orderBy: [desc(supportWeeklySummaries.createdAt)],
            }),
        ]);

        const ticketsWithDueDate = weekTickets.filter(
            (ticket) => ticket.firstResponseDueAt
        );
        const ticketsWithinSla = ticketsWithDueDate.filter(
            (ticket) =>
                ticket.firstRespondedAt &&
                ticket.firstResponseDueAt &&
                ticket.firstRespondedAt <= ticket.firstResponseDueAt
        );
        const slaHitRate = ticketsWithDueDate.length
            ? Math.round(
                  (ticketsWithinSla.length / ticketsWithDueDate.length) * 100
              )
            : 100;

        return {
            openTickets,
            agedTickets24h,
            agedTickets48h,
            criticalTickets,
            approachingSla: approachingFirstResponse + approachingResolution,
            breachedSla: breachedFirstResponse + breachedResolution,
            slaHitRate,
            csatAverage: recentCsat[0]?.average
                ? Number(recentCsat[0].average) / 100
                : null,
            csatCount: Number(recentCsat[0]?.count ?? 0),
            latestWeeklySummary: weeklySummary,
        };
    }),
    createDailyCheckIn: protectedProcedure
        .input(
            z.object({
                checkType: z.enum(["morning", "midday", "eod"]),
                summary: z.string().optional(),
                blockers: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const health = await computeSupportHealth();
            const check = await db
                .insert(supportDailyCheckIns)
                .values({
                    checkDate: dateOnly(),
                    checkType: input.checkType,
                    ownerId: ctx.user.id,
                    openTickets: health.openTickets,
                    agedTickets24h: health.agedTickets24h,
                    approachingSla: health.approachingSla,
                    breachedSla: health.breachedSla,
                    criticalTickets: health.criticalTickets,
                    summary: input.summary ?? null,
                    blockers: input.blockers ?? null,
                    metadata: { source: "admin_support_dashboard" },
                })
                .returning()
                .then((res) => res[0]);

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "support_daily_check_in_logged",
                entityType: "support_daily_check_in",
                entityId: check.id,
                afterValue: check,
                reason: `support_${input.checkType}_check`,
            });

            return check;
        }),
    generateWeeklySummary: protectedProcedure
        .input(
            z.object({
                summary: z.string().optional(),
                actionItems: z.array(z.string()).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { start, end } = weekWindow();
            const health = await computeSupportHealth();
            const weekTickets = await db.query.userSupportTickets.findMany({
                where: and(
                    gte(userSupportTickets.createdAt, start),
                    lt(userSupportTickets.createdAt, end)
                ),
                columns: {
                    id: true,
                    createdAt: true,
                    category: true,
                    resolutionCode: true,
                    firstRespondedAt: true,
                    firstResponseDueAt: true,
                    escalatedAt: true,
                    status: true,
                },
            });

            const topCategories = Object.entries(
                weekTickets.reduce<Record<string, number>>((acc, ticket) => {
                    acc[ticket.category] = (acc[ticket.category] ?? 0) + 1;
                    return acc;
                }, {})
            )
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            const topResolutionCodes = Object.entries(
                weekTickets.reduce<Record<string, number>>((acc, ticket) => {
                    if (!ticket.resolutionCode) return acc;
                    acc[ticket.resolutionCode] =
                        (acc[ticket.resolutionCode] ?? 0) + 1;
                    return acc;
                }, {})
            )
                .map(([code, count]) => ({ code, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            const firstResponseMinutes = weekTickets
                .filter((ticket) => ticket.firstRespondedAt)
                .map((ticket) =>
                    Math.max(
                        0,
                        Math.round(
                            (ticket.firstRespondedAt!.getTime() -
                                ticket.createdAt.getTime()) /
                                60000
                        )
                    )
                );
            const avgFirstResponseMinutes = firstResponseMinutes.length
                ? Math.round(
                      firstResponseMinutes.reduce(
                          (sum, value) => sum + value,
                          0
                      ) / firstResponseMinutes.length
                  )
                : null;

            const record = await db
                .insert(supportWeeklySummaries)
                .values({
                    weekStart: dateOnly(start),
                    weekEnd: dateOnly(end),
                    ownerId: ctx.user.id,
                    ticketsOpened: weekTickets.length,
                    ticketsResolved: weekTickets.filter((ticket) =>
                        terminalStatuses.includes(ticket.status as any)
                    ).length,
                    openTicketsAtWeekEnd: health.openTickets,
                    agedTickets48h: health.agedTickets48h,
                    slaBreaches: health.breachedSla,
                    escalatedToAj: weekTickets.filter(
                        (ticket) => ticket.escalatedAt
                    ).length,
                    avgFirstResponseMinutes,
                    slaHitRate: health.slaHitRate,
                    csatAverage:
                        health.csatAverage === null
                            ? null
                            : Math.round(health.csatAverage * 100),
                    topCategories,
                    topResolutionCodes,
                    summary: input.summary ?? null,
                    actionItems: input.actionItems,
                })
                .returning()
                .then((res) => res[0]);

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "support_weekly_summary_generated",
                entityType: "support_weekly_summary",
                entityId: record.id,
                afterValue: record,
                reason: "friday_support_weekly_summary",
            });

            return record;
        }),
    generateMonthlyPatternReview: protectedProcedure
        .input(
            z.object({
                reviewMonth: z
                    .string()
                    .regex(/^\d{4}-\d{2}$/)
                    .optional(),
                learnings: z.string().optional(),
                driveLink: z.string().url().optional(),
                actionItems: z.array(z.string()).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const month =
                input.reviewMonth ?? new Date().toISOString().slice(0, 7);
            const [year, monthIndex] = month.split("-").map(Number);
            const start = new Date(year, monthIndex - 1, 1);
            const end = new Date(year, monthIndex, 1);
            const rows = await db.query.userSupportTickets.findMany({
                where: and(
                    gte(userSupportTickets.createdAt, start),
                    lt(userSupportTickets.createdAt, end)
                ),
                columns: {
                    id: true,
                    userId: true,
                    brandId: true,
                    category: true,
                    csatScore: true,
                    firstRespondedAt: true,
                    resolutionCode: true,
                    preventable: true,
                },
            });

            const average = (values: number[]) =>
                values.length
                    ? Math.round(
                          (values.reduce((sum, value) => sum + value, 0) /
                              values.length) *
                              100
                      )
                    : null;
            const top = <K extends string | null>(
                values: K[],
                keyName: "category" | "brandId" | "userId"
            ) =>
                Object.entries(
                    values.reduce<Record<string, number>>((acc, value) => {
                        const key = value ?? "unassigned";
                        acc[key] = (acc[key] ?? 0) + 1;
                        return acc;
                    }, {})
                )
                    .map(([key, count]) => ({ [keyName]: key, count }))
                    .sort((a, b) => Number(b.count) - Number(a.count))
                    .slice(0, 3);

            const record = await db
                .insert(supportMonthlyPatternReviews)
                .values({
                    reviewMonth: month,
                    ownerId: ctx.user.id,
                    totalTickets: rows.length,
                    csatAverage: average(
                        rows
                            .map((row) => row.csatScore)
                            .filter(
                                (score): score is number =>
                                    typeof score === "number"
                            )
                    ),
                    firstTouchResolutionRate: rows.length
                        ? Math.round(
                              (rows.filter(
                                  (row) =>
                                      row.firstRespondedAt &&
                                      row.resolutionCode === "RES_INFO_PROVIDED"
                              ).length /
                                  rows.length) *
                                  100
                          )
                        : null,
                    preventableIssueRate: rows.length
                        ? Math.round(
                              (rows.filter((row) => row.preventable).length /
                                  rows.length) *
                                  100
                          )
                        : null,
                    topCategories: top(
                        rows.map((row) => row.category),
                        "category"
                    ) as Array<{ category: string; count: number }>,
                    topBrandsByComplaint: top(
                        rows.map((row) => row.brandId ?? null),
                        "brandId"
                    ) as Array<{ brandId: string | null; count: number }>,
                    customersWithMultipleTickets: (
                        top(
                            rows.map((row) => row.userId),
                            "userId"
                        ) as Array<{ userId: string; count: number }>
                    ).filter((row) => row.count >= 3),
                    learnings: input.learnings ?? null,
                    driveLink: input.driveLink ?? null,
                    actionItems: input.actionItems,
                })
                .returning()
                .then((res) => res[0]);

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "support_monthly_pattern_review_generated",
                entityType: "support_monthly_pattern_review",
                entityId: record.id,
                afterValue: record,
                reason: "monthly_customer_support_learnings",
            });

            return record;
        }),
    createManualUserTicket: protectedProcedure
        .input(
            z.object({
                customer: z.string().min(1),
                sourceChannel: supportChannelSchema,
                category: z.string().min(1),
                subject: z.string().min(3),
                description: z.string().min(3),
                orderId: z.string().optional(),
                brandId: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const customer = await db.query.users.findFirst({
                where: or(
                    eq(users.id, input.customer),
                    eq(users.email, input.customer)
                ),
            });
            if (!customer) {
                throw new Error(
                    "Customer not found. Use the customer user ID or email already in Renivet."
                );
            }

            const category = normalizeSupportCategory({
                category: input.category,
                issueType: input.category,
                text: `${input.subject} ${input.description}`,
            });
            const config = getSupportCategoryConfig(category);
            const now = new Date();
            const critical = config.priority === "critical";
            const ticketId = crypto.randomUUID();

            const row = await db
                .insert(userSupportTickets)
                .values({
                    id: ticketId,
                    userId: customer.id,
                    orderId: input.orderId?.trim() || null,
                    brandId: input.brandId?.trim() || null,
                    title: input.subject.trim(),
                    category,
                    issueType: category,
                    issueLabel: formatSupportCategoryLabel(category),
                    description: input.description.trim(),
                    sourceChannel: input.sourceChannel,
                    priority: config.priority,
                    status: critical ? "escalated" : "acknowledged",
                    assignedAdminId: critical
                        ? process.env.AJ_USER_ID || ctx.user.id
                        : process.env.SUPPORT_INTERN_USER_ID || ctx.user.id,
                    firstResponseDueAt: calculateFirstResponseDueAt(
                        category,
                        now
                    ),
                    resolutionDueAt: calculateResolutionDueAt(category, now),
                    autoAckSentAt: now,
                    autoAckTemplateKey: "AUTO_ACK",
                    autoCloseEligibleAt:
                        calculateCustomerAutoCloseEligibleAt(now),
                    escalatedAt: critical ? now : null,
                    escalationOwner: critical ? "AJ" : null,
                    latestMessageAt: now,
                    intakeContext: {
                        createdByAdminId: ctx.user.id,
                        manualChannel: input.sourceChannel,
                    },
                })
                .returning()
                .then((res) => res[0]);

            await db.insert(userSupportMessages).values([
                {
                    ticketId: row.id,
                    sender: "customer",
                    senderId: customer.id,
                    text: input.description.trim(),
                    messageType: "message",
                    metadata: {
                        sourceChannel: input.sourceChannel,
                        createdByAdminId: ctx.user.id,
                    },
                },
                {
                    ticketId: row.id,
                    sender: "system",
                    senderId: "support-bot",
                    text: buildAutomatedSupportReply(row.id, customer.firstName),
                    messageType: "system",
                    metadata: {
                        template: "AUTO_ACK",
                        sourceChannel: input.sourceChannel,
                    },
                },
            ]);

            await notifyUser({
                userId: customer.id,
                actorId: ctx.user.id,
                type: "support.ticket.manual_intake",
                title: "Support case created",
                body: `We created support case ${row.id.slice(0, 8)} from your ${input.sourceChannel.replaceAll("_", " ")} message.`,
                href: buildSupportHref(row.id),
                emailSubject: `Renivet support case ${row.id.slice(0, 8)} created`,
                emailIntro:
                    "We have logged your message as a Renivet support case.",
                emailDetails: [
                    `Case: ${row.id}`,
                    `Channel: ${input.sourceChannel}`,
                    `Category: ${formatSupportCategoryLabel(category)}`,
                    `Subject: ${row.title}`,
                ],
                metadata: {
                    ticketId: row.id,
                    sourceChannel: input.sourceChannel,
                },
            });

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "manual_customer_support_ticket_created",
                entityType: "user_support_ticket",
                entityId: row.id,
                beforeValue: null,
                afterValue: {
                    id: row.id,
                    userId: customer.id,
                    sourceChannel: input.sourceChannel,
                    category,
                    status: row.status,
                    firstResponseDueAt: row.firstResponseDueAt,
                    resolutionDueAt: row.resolutionDueAt,
                },
                reason: "chapter_3_manual_channel_intake",
                metadata: { href: buildAdminSupportHref(row.id, "user") },
            });

            if (critical) {
                await createOperationalAlert({
                    type:
                        category === "SOCIAL_COMPLAINT"
                            ? "social_complaint_detected"
                            : "legal_threat_detected",
                    severity: "critical",
                    entityType: "user_support_ticket",
                    entityId: row.id,
                    title:
                        category === "SOCIAL_COMPLAINT"
                            ? "Social complaint support escalation"
                            : "Legal threat support escalation",
                    message: `Manual ${input.sourceChannel} intake created critical ticket ${row.id}.`,
                    actorId: row.assignedAdminId,
                    ownerRole: "support_manager",
                    channels: ["admin", "email", "whatsapp"],
                    dedupeKey: `ticket:manual-critical:${row.id}`,
                    metadata: { sourceChannel: input.sourceChannel, category },
                });
            }

            return row;
        }),
    listTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(20),
                page: z.number().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
                brandId: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const filters = [];
            if (input.brandId)
                filters.push(eq(supportTickets.brandId, input.brandId));
            if (input.search?.trim()) {
                filters.push(
                    ilike(supportTickets.title, `%${input.search.trim()}%`)
                );
            }
            if (input.status && input.status !== "all") {
                filters.push(eq(supportTickets.status, input.status));
            }

            const rows = await db.query.supportTickets.findMany({
                where: filters.length ? and(...filters) : undefined,
                limit: input.limit,
                offset: (input.page - 1) * input.limit,
                orderBy: [
                    desc(supportTickets.latestMessageAt),
                    desc(supportTickets.createdAt),
                ],
            });

            const brandMap = new Map(
                (
                    await db.query.brands.findMany({
                        where: rows.length
                            ? inArray(
                                  brands.id,
                                  rows.map((row) => row.brandId)
                              )
                            : undefined,
                    })
                ).map((brand) => [brand.id, brand])
            );

            return {
                data: rows.map((row) => ({
                    ...row,
                    brandName:
                        brandMap.get(row.brandId)?.name ?? "Unknown brand",
                })),
                count: rows.length,
            };
        }),
    getTicket: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            const ticket = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, ticketId),
            });
            if (!ticket) return null;

            const [brand, notes] = await Promise.all([
                db.query.brands.findFirst({
                    where: eq(brands.id, ticket.brandId),
                }),
                db.query.supportInternalNotes.findMany({
                    where: eq(supportInternalNotes.ticketId, ticket.id),
                    orderBy: [desc(supportInternalNotes.createdAt)],
                }),
            ]);

            return {
                ...ticket,
                brand,
                notes,
            };
        }),
    updateStatus: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                status: statusSchema,
                reason: z.string().optional(),
                resolutionCode: resolutionCodeSchema.optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, input.ticketId),
            });
            if (!existing) throw new Error("Ticket not found");
            if (
                terminalStatuses.includes(input.status as any) &&
                !input.resolutionCode
            ) {
                throw new Error(
                    "Resolution code is required before closing a support ticket."
                );
            }

            const updated = await db
                .update(supportTickets)
                .set({
                    status: input.status,
                    resolutionCode:
                        input.resolutionCode ?? existing.resolutionCode ?? null,
                    statusChangedAt: new Date(),
                    resolvedAt: terminalStatuses.includes(input.status as any)
                        ? new Date()
                        : existing.resolvedAt,
                    closedAt: ["closed", "auto_closed"].includes(input.status)
                        ? new Date()
                        : existing.closedAt,
                    reopenAllowedUntil: terminalStatuses.includes(
                        input.status as any
                    )
                        ? calculateReopenAllowedUntil()
                        : existing.reopenAllowedUntil,
                    csatSentAt: terminalStatuses.includes(input.status as any)
                        ? new Date()
                        : existing.csatSentAt,
                    resolutionSummary:
                        input.reason ?? existing.resolutionSummary ?? null,
                    updatedAt: new Date(),
                })
                .where(eq(supportTickets.id, input.ticketId))
                .returning()
                .then((res) => res[0]);

            await db.insert(supportTicketStatusHistory).values({
                ticketId: existing.id,
                prevStatus: existing.status,
                newStatus: input.status,
                changedBy: ctx.user.id,
                reason: input.reason ?? null,
            });
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_status_changed",
                entityType: "support_ticket",
                entityId: existing.id,
                beforeValue: { status: existing.status },
                afterValue: {
                    status: input.status,
                    resolutionCode: input.resolutionCode ?? null,
                },
                reason: input.reason ?? "support_ticket_status_update",
            });

            await notifyBrandUsers({
                brandId: existing.brandId,
                actorId: ctx.user.id,
                type: "support.brand_ticket.status_changed",
                title: "Brand support ticket updated",
                body: `"${existing.title}" is now ${input.status.replace(/_/g, " ")}`,
                href: buildBrandSupportHref(existing.brandId, existing.id),
                emailSubject: `Support ticket updated: ${existing.title}`,
                emailIntro: `Your brand support ticket "${existing.title}" has been updated.`,
                emailDetails: [
                    `New status: ${input.status}`,
                    ...(input.reason ? [`Update: ${input.reason}`] : []),
                ],
                metadata: {
                    ticketId: existing.id,
                    status: input.status,
                },
            });

            return updated;
        }),
    sendMessage: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                text: z.string().min(1),
                attachments: z.array(attachmentSchema).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.supportTickets.findFirst({
                where: eq(supportTickets.id, input.ticketId),
            });
            if (!ticket) throw new Error("Ticket not found");

            const inserted = await db
                .insert(supportMessages)
                .values({
                    ticketId: ticket.id,
                    sender: "admin",
                    senderId: ctx.user.id,
                    text: input.text.trim(),
                })
                .returning()
                .then((res) => res[0]);

            await attachBrandMessageFiles(inserted.id, input.attachments);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_message_added",
                entityType: "support_ticket",
                entityId: ticket.id,
                afterValue: { messageId: inserted.id, sender: "admin" },
                reason: "brand_ticket_reply",
            });

            await db
                .update(supportTickets)
                .set({
                    unreadByBrand: "true",
                    unreadByAdmin: "false",
                    latestMessageAt: new Date(),
                    firstRespondedAt: ticket.firstRespondedAt ?? new Date(),
                    nextCustomerUpdateDueAt: calculateCustomerUpdateDueAt(),
                    status: [
                        "resolved",
                        "closed",
                        "declined",
                        "auto_closed",
                    ].includes(ticket.status)
                        ? ticket.status
                        : "waiting_brand",
                    updatedAt: new Date(),
                })
                .where(eq(supportTickets.id, ticket.id));

            await notifyBrandUsers({
                brandId: ticket.brandId,
                actorId: ctx.user.id,
                type: "support.brand_ticket.reply",
                title: "New reply on brand support ticket",
                body: `Our support team replied to "${ticket.title}"`,
                href: buildBrandSupportHref(ticket.brandId, ticket.id),
                emailSubject: `New reply on support ticket: ${ticket.title}`,
                emailIntro: `Our support team replied to your brand support ticket "${ticket.title}".`,
                emailDetails: [`Message: ${input.text.trim().slice(0, 140)}`],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return inserted;
        }),
    getMessages: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            const messages = await db.query.supportMessages.findMany({
                where: eq(supportMessages.ticketId, ticketId),
                orderBy: [supportMessages.createdAt],
            });

            const attachments = messages.length
                ? await db.query.supportAttachments.findMany({
                      where: inArray(
                          supportAttachments.messageId,
                          messages.map((message) => message.id)
                      ),
                  })
                : [];

            const attachmentMap = new Map<string, typeof attachments>();
            for (const attachment of attachments) {
                const current = attachmentMap.get(attachment.messageId) ?? [];
                current.push(attachment);
                attachmentMap.set(attachment.messageId, current);
            }

            return messages.map((message) => ({
                ...message,
                attachments: attachmentMap.get(message.id) ?? [],
            }));
        }),
    addInternalNote: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                note: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const note = await db
                .insert(supportInternalNotes)
                .values({
                    ticketId: input.ticketId,
                    authorId: ctx.user.id,
                    note: input.note.trim(),
                })
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_internal_note_added",
                entityType: "support_ticket",
                entityId: input.ticketId,
                afterValue: { noteId: note.id },
                reason: "internal_note",
            });
            return note;
        }),
    listUserTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().default(20),
                page: z.number().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const filters = [];
            if (input.search?.trim()) {
                filters.push(
                    or(
                        ilike(
                            userSupportTickets.title,
                            `%${input.search.trim()}%`
                        ),
                        ilike(
                            userSupportTickets.issueType,
                            `%${input.search.trim()}%`
                        )
                    )
                );
            }
            if (input.status && input.status !== "all") {
                filters.push(eq(userSupportTickets.status, input.status));
            }

            const rows = await db.query.userSupportTickets.findMany({
                where: filters.length ? and(...filters) : undefined,
                limit: input.limit,
                offset: (input.page - 1) * input.limit,
                orderBy: [
                    desc(userSupportTickets.latestMessageAt),
                    desc(userSupportTickets.createdAt),
                ],
            });

            const userMap = new Map(
                (
                    await db.query.users.findMany({
                        where: rows.length
                            ? inArray(
                                  users.id,
                                  rows.map((row) => row.userId)
                              )
                            : undefined,
                    })
                ).map((user) => [user.id, user])
            );

            return {
                data: rows.map((row) => ({
                    ...row,
                    userName:
                        `${userMap.get(row.userId)?.firstName ?? ""} ${userMap.get(row.userId)?.lastName ?? ""}`.trim() ||
                        String(row.intakeContext?.contactName ?? ""),
                    userEmail:
                        userMap.get(row.userId)?.email ??
                        String(row.intakeContext?.contactEmail ?? ""),
                })),
                count: rows.length,
            };
        }),
    getUserTicket: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId, ctx }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, ticketId),
            });
            if (!ticket) return null;

            const [order, notes, dispute, user] = await Promise.all([
                ticket.orderId
                    ? ctx.queries.orders.getOrderById(ticket.orderId)
                    : null,
                db.query.userSupportInternalNotes.findMany({
                    where: eq(userSupportInternalNotes.ticketId, ticket.id),
                    orderBy: [desc(userSupportInternalNotes.createdAt)],
                }),
                db.query.userSupportDisputes.findFirst({
                    where: eq(userSupportDisputes.ticketId, ticket.id),
                }),
                db.query.users.findFirst({
                    where: eq(users.id, ticket.userId),
                }),
            ]);

            return {
                ...ticket,
                order,
                notes,
                dispute,
                user,
            };
        }),
    getUserMessages: protectedProcedure
        .input(z.string())
        .query(async ({ input: ticketId }) => {
            await db
                .update(userSupportTickets)
                .set({ unreadByAdmin: "false", lastOpenedAt: new Date() })
                .where(eq(userSupportTickets.id, ticketId));

            const messages = await db.query.userSupportMessages.findMany({
                where: eq(userSupportMessages.ticketId, ticketId),
                orderBy: [userSupportMessages.createdAt],
            });

            const attachments = messages.length
                ? await db.query.userSupportAttachments.findMany({
                      where: inArray(
                          userSupportAttachments.messageId,
                          messages.map((message) => message.id)
                      ),
                  })
                : [];

            const attachmentMap = new Map<string, typeof attachments>();
            for (const attachment of attachments) {
                const current = attachmentMap.get(attachment.messageId) ?? [];
                current.push(attachment);
                attachmentMap.set(attachment.messageId, current);
            }

            return messages.map((message) => ({
                ...message,
                attachments: attachmentMap.get(message.id) ?? [],
            }));
        }),
    updateUserTicketStatus: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                status: statusSchema,
                resolutionType: z.string().optional(),
                resolutionSummary: z.string().optional(),
                resolutionCode: resolutionCodeSchema.optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const existing = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!existing) throw new Error("Ticket not found");
            if (
                terminalStatuses.includes(input.status as any) &&
                !input.resolutionCode
            ) {
                throw new Error(
                    "Resolution code is required before closing a customer support ticket."
                );
            }

            const updated = await db
                .update(userSupportTickets)
                .set({
                    status: input.status,
                    resolutionCode:
                        input.resolutionCode ?? existing.resolutionCode ?? null,
                    resolutionType:
                        input.resolutionType ?? existing.resolutionType,
                    resolutionSummary:
                        input.resolutionSummary ?? existing.resolutionSummary,
                    statusChangedAt: new Date(),
                    resolvedAt: terminalStatuses.includes(input.status as any)
                        ? new Date()
                        : existing.resolvedAt,
                    closedAt: ["closed", "auto_closed"].includes(input.status)
                        ? new Date()
                        : existing.closedAt,
                    autoCloseEligibleAt:
                        input.status === "waiting_customer"
                            ? calculateCustomerAutoCloseEligibleAt()
                            : existing.autoCloseEligibleAt,
                    reopenAllowedUntil: terminalStatuses.includes(
                        input.status as any
                    )
                        ? calculateReopenAllowedUntil()
                        : existing.reopenAllowedUntil,
                    csatSentAt: terminalStatuses.includes(input.status as any)
                        ? new Date()
                        : existing.csatSentAt,
                    updatedAt: new Date(),
                    unreadByUser: "true",
                })
                .where(eq(userSupportTickets.id, input.ticketId))
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_status_changed",
                entityType: "user_support_ticket",
                entityId: existing.id,
                beforeValue: { status: existing.status },
                afterValue: {
                    status: input.status,
                    resolutionCode: updated.resolutionCode,
                    resolutionType: updated.resolutionType,
                    resolutionSummary: updated.resolutionSummary,
                },
                reason: input.resolutionSummary ?? "user_ticket_status_update",
            });

            await notifyUser({
                userId: existing.userId,
                actorId: ctx.user.id,
                type: "support.ticket.status_changed",
                title: "Your support case was updated",
                body: `"${existing.title}" is now ${input.status.replace(/_/g, " ")}`,
                href: buildSupportHref(existing.id),
                emailSubject: `Support case updated: ${existing.title}`,
                emailIntro: `Your support case "${existing.title}" has been updated.`,
                emailDetails: [
                    `New status: ${input.status}`,
                    ...(input.resolutionSummary
                        ? [`Update: ${input.resolutionSummary}`]
                        : []),
                ],
                metadata: {
                    ticketId: existing.id,
                    status: input.status,
                },
            });

            return updated;
        }),
    sendUserMessage: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                text: z.string().min(1),
                attachments: z.array(attachmentSchema).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket) throw new Error("Ticket not found");

            const inserted = await db
                .insert(userSupportMessages)
                .values({
                    ticketId: ticket.id,
                    sender: "admin",
                    senderId: ctx.user.id,
                    text: input.text.trim(),
                })
                .returning()
                .then((res) => res[0]);

            await attachUserMessageFiles(inserted.id, input.attachments);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_message_added",
                entityType: "user_support_ticket",
                entityId: ticket.id,
                afterValue: { messageId: inserted.id, sender: "admin" },
                reason: "customer_ticket_reply",
            });

            await db
                .update(userSupportTickets)
                .set({
                    unreadByUser: "true",
                    unreadByAdmin: "false",
                    latestMessageAt: new Date(),
                    firstRespondedAt: ticket.firstRespondedAt ?? new Date(),
                    nextCustomerUpdateDueAt: calculateCustomerUpdateDueAt(),
                    status: [
                        "resolved",
                        "closed",
                        "declined",
                        "refunded",
                        "replaced",
                        "auto_closed",
                    ].includes(ticket.status)
                        ? ticket.status
                        : ticket.status === "waiting_brand"
                          ? "waiting_brand"
                          : "waiting_customer",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.ticket.reply",
                title: "New reply on your support case",
                body: `Our support team replied to "${ticket.title}"`,
                href: buildSupportHref(ticket.id),
                emailSubject: `New reply on support case: ${ticket.title}`,
                emailIntro: `Our support team replied to your support case "${ticket.title}".`,
                emailDetails: [`Message: ${input.text.trim().slice(0, 140)}`],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return inserted;
        }),
    addUserInternalNote: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                note: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const note = await db
                .insert(userSupportInternalNotes)
                .values({
                    ticketId: input.ticketId,
                    authorId: ctx.user.id,
                    note: input.note.trim(),
                })
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_internal_note_added",
                entityType: "user_support_ticket",
                entityId: input.ticketId,
                afterValue: { noteId: note.id },
                reason: "internal_note",
            });
            return note;
        }),
    assignUserTicket: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                adminId: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const before = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            const updated = await db
                .update(userSupportTickets)
                .set({
                    assignedAdminId: input.adminId,
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, input.ticketId))
                .returning()
                .then((res) => res[0]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "ticket_assigned",
                entityType: "user_support_ticket",
                entityId: input.ticketId,
                beforeValue: {
                    assignedAdminId: before?.assignedAdminId ?? null,
                },
                afterValue: { assignedAdminId: input.adminId },
                reason: "ticket_assignment",
            });
            await createOperationalAlert({
                actorId: ctx.user.id,
                type: "ticket_assigned",
                severity: "info",
                entityType: "user_support_ticket",
                entityId: input.ticketId,
                title: "Customer ticket assigned",
                message: `Ticket ${input.ticketId} assigned to ${input.adminId}.`,
                ownerRole: "support_manager",
                dedupeKey: `ticket:assigned:${input.ticketId}:${input.adminId}`,
            });
            return updated;
        }),
    listDisputes: protectedProcedure
        .input(
            z.object({
                status: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const disputes = await db.query.userSupportDisputes.findMany({
                where:
                    input.status && input.status !== "all"
                        ? eq(userSupportDisputes.status, input.status)
                        : undefined,
                orderBy: [desc(userSupportDisputes.updatedAt)],
            });

            const ticketMap = new Map(
                (
                    await db.query.userSupportTickets.findMany({
                        where: disputes.length
                            ? inArray(
                                  userSupportTickets.id,
                                  disputes.map((dispute) => dispute.ticketId)
                              )
                            : undefined,
                    })
                ).map((ticket) => [ticket.id, ticket])
            );

            return disputes.map((dispute) => ({
                ...dispute,
                ticket: ticketMap.get(dispute.ticketId) ?? null,
            }));
        }),
    getDispute: protectedProcedure
        .input(z.string())
        .query(async ({ input: disputeId, ctx }) => {
            const dispute = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.id, disputeId),
            });
            if (!dispute) return null;

            const [ticket, order] = await Promise.all([
                db.query.userSupportTickets.findFirst({
                    where: eq(userSupportTickets.id, dispute.ticketId),
                }),
                ctx.queries.orders.getOrderById(dispute.orderId),
            ]);

            return {
                ...dispute,
                ticket,
                order,
            };
        }),
    approveUserDispute: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                disputeType: z
                    .enum(["replacement", "refund", "manual_review"])
                    .default("replacement"),
                summary: z.string().min(1),
                quantityOverrides: z
                    .array(
                        z.object({
                            orderItemId: z.string().uuid(),
                            quantity: z.number().int().positive(),
                        })
                    )
                    .default([]),
                kpJointApprovalConfirmed: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket) {
                throw new Error("Support ticket not found");
            }
            if (!ticket.orderId) {
                throw new Error(
                    "This support ticket is not linked to an order, so brand action cannot be created."
                );
            }

            const sourceOrder = await ctx.queries.orders.getOrderById(
                ticket.orderId
            );

            if (!sourceOrder) {
                throw new Error(
                    "The linked order could not be loaded for this support ticket."
                );
            }

            const refundExposure = Number(sourceOrder.totalAmount ?? 0);
            const refundApprovalTier =
                refundExposure <= 1500
                    ? "support"
                    : refundExposure <= 5000
                      ? "aj"
                      : "aj_kp";

            if (input.disputeType === "refund") {
                const ajUserId = process.env.AJ_USER_ID;
                if (
                    refundApprovalTier !== "support" &&
                    ajUserId &&
                    ctx.user.id !== ajUserId
                ) {
                    throw new Error(
                        "Refunds above ₹1,500 require AJ approval before the support case can be approved."
                    );
                }

                if (
                    refundApprovalTier === "aj_kp" &&
                    !input.kpJointApprovalConfirmed
                ) {
                    throw new Error(
                        "Refunds above ₹5,000 require AJ + KP joint approval confirmation."
                    );
                }
            }

            const linkedOrderItem = ticket.orderItemId
                ? sourceOrder.items.find(
                      (item) => item.id === ticket.orderItemId
                  )
                : null;

            const resolvedBrandId =
                ticket.brandId ??
                linkedOrderItem?.product.brandId ??
                sourceOrder.items?.[0]?.product?.brandId ??
                null;

            if (!resolvedBrandId) {
                throw new Error(
                    "The linked order was found, but the brand could not be resolved from it."
                );
            }

            if (ticket.brandId !== resolvedBrandId) {
                await db
                    .update(userSupportTickets)
                    .set({
                        brandId: resolvedBrandId,
                        updatedAt: new Date(),
                    })
                    .where(eq(userSupportTickets.id, ticket.id));
            }

            const existing = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.ticketId, ticket.id),
            });

            let replacementOrderId: string | null =
                existing?.replacementOrderId ?? null;

            const quantityOverrideMap = Object.fromEntries(
                input.quantityOverrides.map((item) => [
                    item.orderItemId,
                    item.quantity,
                ])
            );

            if (input.disputeType === "replacement" && !replacementOrderId) {
                const createdReplacement = await createDisputeReplacementOrder({
                    sourceOrder,
                    brandId: resolvedBrandId,
                    orderItemId: ticket.orderItemId,
                    quantityOverrides: quantityOverrideMap,
                });

                replacementOrderId = createdReplacement.replacementOrderId;
            }

            const isRefundDispute = input.disputeType === "refund";
            const disputeStatus = replacementOrderId
                ? "replacement_created"
                : isRefundDispute
                  ? "approved_for_refund_processing"
                  : "approved_for_brand_action";

            const dispute = existing
                ? await db
                      .update(userSupportDisputes)
                      .set({
                          disputeType: input.disputeType,
                          status: disputeStatus,
                          adminDecision: "approved",
                          adminDecisionSummary: input.summary,
                          approvedBy: ctx.user.id,
                          approvedAt: new Date(),
                          actionRequestedAt: new Date(),
                          actionCompletedAt: replacementOrderId
                              ? new Date()
                              : existing.actionCompletedAt,
                          replacementOrderId,
                          metadata: {
                              ...(existing.metadata ?? {}),
                              refundApprovalTier:
                                  input.disputeType === "refund"
                                      ? refundApprovalTier
                                      : null,
                              refundExposure:
                                  input.disputeType === "refund"
                                      ? refundExposure
                                      : null,
                              kpJointApprovalConfirmed:
                                  input.kpJointApprovalConfirmed,
                          },
                          updatedAt: new Date(),
                      })
                      .where(eq(userSupportDisputes.id, existing.id))
                      .returning()
                      .then((res) => res[0])
                : await db
                      .insert(userSupportDisputes)
                      .values({
                          ticketId: ticket.id,
                          orderId: ticket.orderId,
                          orderItemId: ticket.orderItemId ?? null,
                          brandId: resolvedBrandId,
                          disputeType: input.disputeType,
                          status: disputeStatus,
                          adminDecision: "approved",
                          adminDecisionSummary: input.summary,
                          approvedBy: ctx.user.id,
                          approvedAt: new Date(),
                          actionRequestedAt: new Date(),
                          actionCompletedAt: replacementOrderId
                              ? new Date()
                              : null,
                          replacementOrderId,
                          metadata: {
                              refundApprovalTier:
                                  input.disputeType === "refund"
                                      ? refundApprovalTier
                                      : null,
                              refundExposure:
                                  input.disputeType === "refund"
                                      ? refundExposure
                                      : null,
                              kpJointApprovalConfirmed:
                                  input.kpJointApprovalConfirmed,
                          },
                      })
                      .returning()
                      .then((res) => res[0]);

            await db
                .update(userSupportTickets)
                .set({
                    brandActionRequired: !isRefundDispute,
                    brandActionStatus: replacementOrderId
                        ? "replacement_created"
                        : isRefundDispute
                          ? "not_required"
                          : "awaiting_brand_action",
                    status: replacementOrderId
                        ? "replaced"
                        : isRefundDispute
                          ? "waiting_internal"
                          : "waiting_brand",
                    resolutionCode: replacementOrderId
                        ? "RES_REPLACEMENT"
                        : null,
                    linkedReplacementOrderId: replacementOrderId,
                    unreadByUser: "true",
                    unreadByAdmin: "true",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            if (replacementOrderId) {
                await db
                    .update(userSupportDisputes)
                    .set({
                        metadata: {
                            ...(dispute.metadata ?? {}),
                            autoCreatedByAdminId: ctx.user.id,
                            autoCreatedAt: new Date().toISOString(),
                        },
                    })
                    .where(eq(userSupportDisputes.id, dispute.id));

                await db.insert(userSupportMessages).values({
                    ticketId: ticket.id,
                    sender: "admin",
                    senderId: ctx.user.id,
                    text: `Replacement order ${replacementOrderId} was automatically created and forwarded to the brand for fulfilment.`,
                    messageType: "system",
                });
            }

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "support_dispute_approved",
                entityType: "user_support_ticket",
                entityId: ticket.id,
                beforeValue: {
                    status: ticket.status,
                    existingDisputeId: existing?.id ?? null,
                },
                afterValue: {
                    disputeId: dispute.id,
                    disputeType: input.disputeType,
                    disputeStatus,
                    replacementOrderId,
                    refundApprovalTier: isRefundDispute
                        ? refundApprovalTier
                        : null,
                    refundExposure: isRefundDispute ? refundExposure : null,
                    kpJointApprovalConfirmed: input.kpJointApprovalConfirmed,
                },
                reason: input.summary,
            });

            if (!isRefundDispute) {
                await notifyBrandUsers({
                    brandId: resolvedBrandId,
                    actorId: ctx.user.id,
                    type: "support.dispute.approved",
                    title: replacementOrderId
                        ? "A dispute replacement order was created"
                        : "A dispute needs brand action",
                    body: replacementOrderId
                        ? `Replacement order ${replacementOrderId} was created for "${ticket.title}"`
                        : `Admin approved support case "${ticket.title}" for brand action`,
                    href: buildBrandSupportHref(resolvedBrandId, ticket.id),
                    emailSubject: replacementOrderId
                        ? `Replacement order created for support case ${ticket.id}`
                        : `Brand action needed for support case ${ticket.id}`,
                    emailIntro: replacementOrderId
                        ? "A dispute-linked replacement order was automatically created and is now ready for brand fulfilment."
                        : "A customer support case has been approved for brand action.",
                    emailDetails: replacementOrderId
                        ? [
                              `Ticket: ${ticket.id}`,
                              `Original order: ${ticket.orderId}`,
                              `Replacement order: ${replacementOrderId}`,
                              `Requested action: ${input.disputeType}`,
                              `Admin summary: ${input.summary}`,
                          ]
                        : [
                              `Ticket: ${ticket.id}`,
                              `Order: ${ticket.orderId}`,
                              `Requested action: ${input.disputeType}`,
                              `Admin summary: ${input.summary}`,
                          ],
                    metadata: {
                        ticketId: ticket.id,
                        disputeId: dispute.id,
                        replacementOrderId,
                    },
                });
            }

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.dispute.approved",
                title: "Your support case moved forward",
                body: replacementOrderId
                    ? `We approved your case and created replacement order ${replacementOrderId}.`
                    : isRefundDispute
                      ? "We approved your refund case and moved it to internal processing."
                      : "We approved your case and asked the brand to take action.",
                href: buildSupportHref(ticket.id),
                emailSubject: replacementOrderId
                    ? "Replacement order created for your support case"
                    : isRefundDispute
                      ? "Refund case approved for processing"
                      : "Support case approved for next action",
                emailIntro: replacementOrderId
                    ? "We reviewed your case and created a replacement order for you."
                    : isRefundDispute
                      ? "We reviewed your support case and approved it for refund processing."
                      : "We reviewed your support case and moved it forward for the next action.",
                emailDetails: replacementOrderId
                    ? [
                          `Case: ${ticket.title}`,
                          `Replacement order: ${replacementOrderId}`,
                          "Next step: the brand will fulfil this replacement order.",
                      ]
                    : isRefundDispute
                      ? [
                            `Case: ${ticket.title}`,
                            `Approval tier: ${refundApprovalTier.replace("_", "+").toUpperCase()}`,
                            "Next step: our team will process the refund and update you.",
                        ]
                      : [
                            `Case: ${ticket.title}`,
                            "Next step: the brand has been notified to act on it.",
                        ],
                metadata: {
                    ticketId: ticket.id,
                    replacementOrderId,
                },
            });

            if (input.disputeType === "refund") {
                await createOperationalAlert({
                    actorId: ctx.user.id,
                    type: "refund_dispute_approved",
                    severity:
                        refundApprovalTier === "support" ? "info" : "warning",
                    entityType: "user_support_ticket",
                    entityId: ticket.id,
                    title: "Refund support case approved",
                    message: `Refund case ${ticket.id} was approved at ${refundApprovalTier.replace("_", "+").toUpperCase()} tier for ₹${refundExposure}.`,
                    ownerRole:
                        refundApprovalTier === "support"
                            ? "support_manager"
                            : "aj",
                    channels: ["admin", "email"],
                    dedupeKey: `support:refund-approved:${ticket.id}`,
                    metadata: {
                        refundApprovalTier,
                        refundExposure,
                        kpJointApprovalConfirmed:
                            input.kpJointApprovalConfirmed,
                    },
                });
            }

            return {
                ...dispute,
                brandId: resolvedBrandId,
                replacementOrderId,
                status: replacementOrderId
                    ? "replacement_created"
                    : dispute.status,
            };
        }),
    rejectUserDispute: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                summary: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket) throw new Error("Ticket not found");

            const existing = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.ticketId, ticket.id),
            });

            const dispute = existing
                ? await db
                      .update(userSupportDisputes)
                      .set({
                          status: "rejected",
                          adminDecision: "rejected",
                          adminDecisionSummary: input.summary,
                          updatedAt: new Date(),
                      })
                      .where(eq(userSupportDisputes.id, existing.id))
                      .returning()
                      .then((res) => res[0])
                : null;

            await db
                .update(userSupportTickets)
                .set({
                    status: "declined",
                    resolutionCode: "RES_DECLINED_OTHER",
                    resolutionSummary: input.summary,
                    unreadByUser: "true",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.dispute.rejected",
                title: "Your support case was reviewed",
                body: `We reviewed "${ticket.title}" and shared an update.`,
                href: buildSupportHref(ticket.id),
                emailSubject: "Support case review update",
                emailIntro:
                    "We reviewed your support case and added an update.",
                emailDetails: [input.summary],
                metadata: {
                    ticketId: ticket.id,
                },
            });

            return dispute;
        }),
    sendApologyCoupon: protectedProcedure
        .input(
            z.object({
                ticketId: z.string(),
                description: z.string().min(1),
                discountType: z.enum(["percentage", "fixed"]),
                discountValue: z.number().int().positive(),
                minOrderAmount: z.number().int().nonnegative().default(0),
                maxDiscountAmount: z
                    .number()
                    .int()
                    .nonnegative()
                    .nullable()
                    .optional(),
                maxUses: z.number().int().positive().default(1),
                expiresInDays: z.number().int().positive().default(30),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const ticket = await db.query.userSupportTickets.findFirst({
                where: eq(userSupportTickets.id, input.ticketId),
            });
            if (!ticket) throw new Error("Ticket not found");

            const code = `CARE${generateId({ length: 6, casing: "upper" })}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

            const coupon = await ctx.queries.coupons.createCoupon({
                code,
                description: input.description,
                discountType: input.discountType,
                discountValue: input.discountValue,
                minOrderAmount: input.minOrderAmount,
                maxDiscountAmount: input.maxDiscountAmount ?? null,
                categoryId: null,
                subCategoryId: null,
                productTypeId: null,
                expiresAt,
                maxUses: input.maxUses,
            });

            const dispute = await db.query.userSupportDisputes.findFirst({
                where: eq(userSupportDisputes.ticketId, ticket.id),
            });

            if (dispute) {
                await db
                    .update(userSupportDisputes)
                    .set({
                        couponCode: coupon.code,
                        updatedAt: new Date(),
                    })
                    .where(eq(userSupportDisputes.id, dispute.id));
            }

            await db
                .update(userSupportTickets)
                .set({
                    resolutionType: "coupon",
                    resolutionSummary:
                        `${ticket.resolutionSummary ?? ""}\nCoupon sent: ${coupon.code}`.trim(),
                    unreadByUser: "true",
                    updatedAt: new Date(),
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await notifyUser({
                userId: ticket.userId,
                actorId: ctx.user.id,
                type: "support.coupon.sent",
                title: "A goodwill coupon was added to your case",
                body: `We sent coupon ${coupon.code} for the inconvenience.`,
                href: buildSupportHref(ticket.id),
                emailSubject: "A goodwill coupon from Renivet",
                emailIntro:
                    "We shared a coupon on your support case as a goodwill gesture.",
                emailDetails: [
                    `Coupon code: ${coupon.code}`,
                    `Discount: ${input.discountType === "percentage" ? `${input.discountValue}%` : `₹${(input.discountValue / 100).toLocaleString("en-IN")}`}`,
                    `Valid until: ${expiresAt.toDateString()}`,
                ],
                metadata: {
                    ticketId: ticket.id,
                    couponCode: coupon.code,
                },
            });

            return coupon;
        }),
});

import { env } from "@/../env";
import {
    DEFAULT_SLA_WHATSAPP_NUMBERS,
    DEFAULT_SUPPORT_WHATSAPP_NUMBERS,
} from "@/config/whatsapp-notifications";
import {
    WhatsappNotificationModuleKey,
    WhatsappNotificationModuleSettings,
    WhatsappNotificationSettings,
    whatsappNotificationSettingsSchema,
} from "@/lib/validations";
import { resend } from "@/lib/resend";
import { MonitoringAlertEmail } from "@/lib/resend/emails";
import {
    getPostHogAttributionBreakdown,
    getPostHogBehaviorOverview,
} from "@/lib/reports/posthog-behavior";
import { getAbsoluteURL } from "@/lib/utils";
import { sendPlainWhatsAppMessage, sendWhatsAppMessage } from "@/lib/whatsapp";
import {
    and,
    desc,
    eq,
    gte,
    inArray,
    isNotNull,
    isNull,
    lt,
    lte,
    ne,
    or,
    sql,
} from "drizzle-orm";
import { db } from "..";
import {
    accessReviewItems,
    accessReviewRuns,
    analyticsDailyBehavior,
    analyticsLandingPageDaily,
    auditLogs,
    brandConfidentials,
    brandRequests,
    brands,
    blogs,
    carrierClaims,
    categories,
    codReconciliationItems,
    codReconciliationRuns,
    complianceExportFiles,
    complianceExportRuns,
    dailyHealthSnapshots,
    emailMessageLogs,
    fraudReviews,
    monitoringAlertDeliveries,
    monitoringAlertEvents,
    monitoringAlerts,
    monitoringSettings,
    marketingPartnerships,
    orderItems,
    orderReturnRequests,
    orders,
    orderShipments,
    products,
    roles,
    productVariants,
    refunds,
    rtoDispositions,
    slaCheckRuns,
    supportTickets,
    supportWeeklySummaries,
    userRoles,
    users,
    userSupportTickets,
    weeklyReportingPacks,
} from "../schema";
import { auditLogQueries, type AuditLogInput } from "./audit-log";

type AlertSeverity = "info" | "warning" | "critical";
type AlertChannel = "whatsapp" | "email" | "admin";

export type ComplianceExportRow = Record<string, unknown>;
export type ComplianceExportFile = {
    name: string;
    rowCount: number;
    headers: string[];
};

type GoogleAdsSummary = {
    configured: boolean;
    status: string;
    spend: number;
    revenue: number;
    conversions: number;
    traffic: number;
    source: string;
};

async function getGoogleAdsSummary(
    weekStartKey: string,
    weekEndKey: string
): Promise<GoogleAdsSummary> {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

    if (
        !developerToken ||
        !customerId ||
        !refreshToken ||
        !clientId ||
        !clientSecret
    ) {
        return {
            configured: false,
            status: "not configured",
            spend: 0,
            revenue: 0,
            conversions: 0,
            traffic: 0,
            source: "Needs Google Ads integration keys",
        };
    }

    try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
            next: { revalidate: 900 },
        });

        if (!tokenResponse.ok) {
            return {
                configured: true,
                status: "token refresh failed",
                spend: 0,
                revenue: 0,
                conversions: 0,
                traffic: 0,
                source: "Google OAuth token refresh failed",
            };
        }

        const tokenPayload = (await tokenResponse.json()) as {
            access_token?: string;
        };
        const accessToken = tokenPayload.access_token;

        if (!accessToken) {
            return {
                configured: true,
                status: "access token missing",
                spend: 0,
                revenue: 0,
                conversions: 0,
                traffic: 0,
                source: "Google OAuth token missing",
            };
        }

        const query = `
            SELECT
              metrics.cost_micros,
              metrics.clicks,
              metrics.conversions,
              metrics.conversions_value,
              metrics.impressions
            FROM customer
            WHERE segments.date BETWEEN '${weekStartKey}' AND '${weekEndKey}'
        `;

        const response = await fetch(
            `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "developer-token": developerToken,
                    ...(loginCustomerId
                        ? { "login-customer-id": loginCustomerId }
                        : {}),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
                next: { revalidate: 900 },
            }
        );

        if (!response.ok) {
            const details = await response.text().catch(() => "");
            return {
                configured: true,
                status: "query failed",
                spend: 0,
                revenue: 0,
                conversions: 0,
                traffic: 0,
                source: `Google Ads API query failed${details ? `: ${details.slice(0, 80)}` : ""}`,
            };
        }

        const payload = (await response.json()) as Array<{
            results?: Array<{
                metrics?: {
                    costMicros?: string;
                    clicks?: string;
                    conversions?: string;
                    conversionsValue?: string;
                    impressions?: string;
                };
            }>;
        }>;

        const rows = payload.flatMap((chunk) => chunk.results ?? []);
        const totals = rows.reduce(
            (acc, row) => {
                acc.spend += Number(row.metrics?.costMicros ?? 0);
                acc.clicks += Number(row.metrics?.clicks ?? 0);
                acc.conversions += Number(row.metrics?.conversions ?? 0);
                acc.revenue += Number(row.metrics?.conversionsValue ?? 0);
                return acc;
            },
            { spend: 0, clicks: 0, conversions: 0, revenue: 0 }
        );

        return {
            configured: true,
            status: "connected",
            spend: Math.round(totals.spend / 10000),
            revenue: Math.round(totals.revenue * 100),
            conversions: totals.conversions,
            traffic: totals.clicks,
            source: "Google Ads API",
        };
    } catch (error) {
        return {
            configured: true,
            status: error instanceof Error ? error.message : "request failed",
            spend: 0,
            revenue: 0,
            conversions: 0,
            traffic: 0,
            source: "Google Ads API request failed",
        };
    }
}
export type ComplianceExportBuild = {
    rows: ComplianceExportRow[];
    csv: string;
    files: ComplianceExportFile[];
    headers: string[];
};

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
const MONITORING_DASHBOARD_PATH = "/dashboard/general/monitoring-sla";
const MARKETING_TARGETS_SETTING_KEY = "marketing_performance_targets";
const WHATSAPP_NOTIFICATION_SETTINGS_KEY = "whatsapp_notification_modules";

type MarketingPerformanceTargets = {
    roasGoal: number;
    cacGoalPaise: number;
    reelsTarget: number;
    postsTarget: number;
    blogsTarget: number;
};

function numberSetting(
    value: unknown,
    fallback: number,
    minimum = 0
) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(minimum, parsed);
}

function formatAlertDate(value?: Date | string | null) {
    if (!value) return "Not set";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

function buildAlertPlainText(alert: typeof monitoringAlerts.$inferSelect) {
    return [
        `[${alert.severity.toUpperCase()}] ${alert.title}`,
        "",
        alert.message,
        "",
        `Alert type: ${alert.type}`,
        `Entity: ${alert.entityType} ${alert.entityId}`,
        `Acknowledge by: ${formatAlertDate(alert.acknowledgedDueAt)}`,
        `Resolve by: ${formatAlertDate(alert.dueAt)}`,
        "",
        `Open dashboard: ${getAbsoluteURL(MONITORING_DASHBOARD_PATH)}`,
        "",
        "This automated alert was generated by Renivet monitoring.",
    ].join("\n");
}
const ACTIVE_SUPPORT_STATUSES = [
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

function toSqlDateTime(value: Date) {
    return value.toISOString().replace("T", " ").slice(0, 19);
}

function csvEscape(value: unknown) {
    const text = value === null || value === undefined ? "" : String(value);
    const quote = String.fromCharCode(34);
    return `${quote}${text.replaceAll(quote, quote + quote)}${quote}`;
}

function normalizeIndianPhoneNumber(value: string) {
    const digits = value.replace(/\D/g, "");

    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    if (value.startsWith("+") && digits.length >= 10) return `+${digits}`;
    return digits.length >= 10 ? `+${digits}` : null;
}

function dedupePhoneNumbers(numbers: string[]) {
    return Array.from(new Set(numbers));
}

function resolveAlertModule(
    alert: Pick<
        typeof monitoringAlerts.$inferSelect,
        "entityType" | "type" | "ownerRole"
    >
): WhatsappNotificationModuleKey | null {
    const entityType = alert.entityType.toLowerCase();
    const type = alert.type.toLowerCase();
    const ownerRole = alert.ownerRole?.toLowerCase() ?? "";

    if (
        entityType.includes("support") ||
        type.includes("support") ||
        ownerRole.includes("support")
    ) {
        return "support";
    }

    if (
        entityType.includes("sla") ||
        type.includes("sla") ||
        ownerRole.includes("sla") ||
        type.includes("breach") ||
        type.includes("overdue") ||
        type.includes("aging")
    ) {
        return "sla";
    }

    return null;
}

function buildSupportAlertTemplateParameters(
    alert: Pick<
        typeof monitoringAlerts.$inferSelect,
        "title" | "severity" | "message" | "entityId"
    >
) {
    return [
        alert.severity.toUpperCase(),
        alert.title,
        alert.message,
        alert.entityId,
    ];
}

function buildSlaAlertTemplateParameters(
    alert: Pick<
        typeof monitoringAlerts.$inferSelect,
        "title" | "severity" | "message" | "entityId"
    >
) {
    return [
        alert.severity.toUpperCase(),
        alert.title,
        alert.message,
        alert.entityId,
    ];
}

function toCsv<T extends Record<string, unknown>>(
    rows: T[],
    headers?: string[]
) {
    const csvHeaders = headers ?? Object.keys(rows[0] ?? {});
    if (!csvHeaders.length) return "";
    return [
        csvHeaders.map(csvEscape).join(","),
        ...rows.map((row) =>
            csvHeaders.map((header) => csvEscape(row[header])).join(",")
        ),
    ].join("\n");
}

class MonitoringSlaQuery {
    async writeAudit(input: AuditLogInput) {
        return auditLogQueries.write(input);
    }

    async getWhatsappNotificationSettings(): Promise<WhatsappNotificationSettings> {
        const saved = await db.query.monitoringSettings.findFirst({
            where: eq(
                monitoringSettings.key,
                WHATSAPP_NOTIFICATION_SETTINGS_KEY
            ),
        });

        const parsed = whatsappNotificationSettingsSchema.safeParse(
            saved?.value ?? {}
        );

        if (parsed.success) return parsed.data;
        return whatsappNotificationSettingsSchema.parse({});
    }

    async updateWhatsappNotificationModule({
        module,
        settings,
        actorId,
    }: {
        module: WhatsappNotificationModuleKey;
        settings: WhatsappNotificationModuleSettings;
        actorId: string;
    }) {
        const existing = await this.getWhatsappNotificationSettings();
        const nextSettings = {
            ...existing,
            [module]: settings,
        };

        const parsed = whatsappNotificationSettingsSchema.parse(nextSettings);

        await db
            .insert(monitoringSettings)
            .values({
                key: WHATSAPP_NOTIFICATION_SETTINGS_KEY,
                value: parsed,
                updatedBy: actorId,
            })
            .onConflictDoUpdate({
                target: monitoringSettings.key,
                set: {
                    value: parsed,
                    updatedBy: actorId,
                    updatedAt: new Date(),
                },
            });

        await auditLogQueries.write({
            userId: actorId,
            actionType: "whatsapp_notification_module_updated",
            entityType: "monitoring_settings",
            entityId: WHATSAPP_NOTIFICATION_SETTINGS_KEY,
            afterValue: {
                module,
                settings,
            },
            reason: "Admin updated WhatsApp notification module settings",
        });

        return parsed;
    }

    async resolveWhatsappRecipientsForAlert(
        alert: Pick<
            typeof monitoringAlerts.$inferSelect,
            "entityType" | "type" | "ownerRole"
        >
    ) {
        const moduleKey = resolveAlertModule(alert);
        if (!moduleKey) {
            return {
                enabled: true,
                recipients: dedupePhoneNumbers(
                    ALERT_WHATSAPP_RECIPIENTS.map(normalizeIndianPhoneNumber)
                        .filter((value): value is string => Boolean(value))
                ),
            };
        }

        const settings = await this.getWhatsappNotificationSettings();
        const moduleSettings = settings[moduleKey];

        if (!moduleSettings.enabled) {
            return {
                enabled: false,
                recipients: [] as string[],
            };
        }

        let recipients: string[] = [];

        if (moduleSettings.roleIds.length > 0) {
            const matchingRoles = await db.query.roles.findMany({
                where: and(
                    eq(roles.isSiteRole, true),
                    inArray(roles.id, moduleSettings.roleIds)
                ),
                columns: {
                    id: true,
                    phoneNumbers: true,
                },
            });

            recipients = matchingRoles.flatMap((role) =>
                (role.phoneNumbers ?? [])
                    .map(normalizeIndianPhoneNumber)
                    .filter((value): value is string => Boolean(value))
            );
        }

        if (recipients.length === 0) {
            const fallbackNumbers =
                moduleKey === "sla"
                    ? DEFAULT_SLA_WHATSAPP_NUMBERS
                    : DEFAULT_SUPPORT_WHATSAPP_NUMBERS;

            recipients = fallbackNumbers
                .map(normalizeIndianPhoneNumber)
                .filter((value): value is string => Boolean(value));
        }

        return {
            enabled: true,
            recipients: dedupePhoneNumbers(recipients),
        };
    }

    async createAlert(input: AlertInput) {
        const existing = await db.query.monitoringAlerts.findFirst({
            where: and(
                eq(monitoringAlerts.dedupeKey, input.dedupeKey),
                inArray(monitoringAlerts.status, [
                    "open",
                    "acknowledged",
                    "escalated",
                ])
            ),
        });

        if (existing) return existing;

        const channels: AlertChannel[] = input.channels?.length
            ? input.channels
            : input.severity === "info"
              ? ["admin"]
              : ["admin", "email"];
        const recipients = input.recipients?.length
            ? input.recipients
            : ALERT_RECIPIENTS;
        const now = new Date();

        const alert = await db
            .insert(monitoringAlerts)
            .values({
                ...input,
                channels,
                recipients,
                acknowledgedDueAt:
                    input.acknowledgedDueAt ??
                    new Date(
                        now.getTime() +
                            (input.severity === "critical" ? 2 : 4) * HOUR
                    ),
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
        const emailRecipients = alert.recipients?.length
            ? alert.recipients
            : ALERT_RECIPIENTS;
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
                        react: MonitoringAlertEmail({
                            severity: alert.severity,
                            title: alert.title,
                            message: alert.message,
                            entityType: alert.entityType,
                            entityId: alert.entityId,
                            alertType: alert.type,
                            dueAt: alert.dueAt,
                            acknowledgedDueAt: alert.acknowledgedDueAt,
                            href: MONITORING_DASHBOARD_PATH,
                        }),
                        text: buildAlertPlainText(alert),
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
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Email send failed",
                            })
                            .returning()
                            .then((res) => res[0])
                    );
                }
            }
        }

        if (channels.includes("whatsapp")) {
            const alertModule = resolveAlertModule(alert);
            const whatsappRouting = await this.resolveWhatsappRecipientsForAlert(
                alert
            );

            if (!whatsappRouting.enabled) {
                deliveries.push(
                    await db
                        .insert(monitoringAlertDeliveries)
                        .values({
                            alertId,
                            channel: "whatsapp",
                            recipient: "module-disabled",
                            status: "skipped",
                            error: "WhatsApp is disabled for this module",
                        })
                        .returning()
                        .then((res) => res[0])
                );

                return deliveries;
            }

            for (const recipient of whatsappRouting.recipients) {
                try {
                    const sent =
                        alertModule === "support"
                            ? await sendWhatsAppMessage({
                                  recipientPhoneNumber: recipient,
                                  templateName: "support_alert",
                                  parameters:
                                      buildSupportAlertTemplateParameters(
                                          alert
                                      ),
                              })
                            : alertModule === "sla"
                              ? await sendWhatsAppMessage({
                                    recipientPhoneNumber: recipient,
                                    templateName: "sla_alert",
                                    parameters:
                                        buildSlaAlertTemplateParameters(alert),
                                })
                            : await sendPlainWhatsAppMessage({
                                  recipientPhoneNumber: recipient,
                                  message: buildAlertPlainText(alert),
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
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "WhatsApp send failed",
                            })
                            .returning()
                            .then((res) => res[0])
                    );
                }
            }
        }

        return deliveries;
    }

    async updateAlertStatus(
        status: "acknowledged" | "escalated" | "resolved",
        input: AlertAction
    ) {
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

    async getActiveAlerts(limit = 50, offset = 0, severity?: AlertSeverity) {
        return db.query.monitoringAlerts.findMany({
            where: and(
                ne(monitoringAlerts.status, "resolved"),
                severity ? eq(monitoringAlerts.severity, severity) : undefined
            ),
            orderBy: [
                desc(monitoringAlerts.severity),
                desc(monitoringAlerts.createdAt),
            ],
            limit,
            offset,
        });
    }

    async getActiveAlertsPage(
        page = 1,
        pageSize = 10,
        severity?: AlertSeverity
    ) {
        const safePage = Math.max(1, page);
        const safePageSize = Math.min(Math.max(5, pageSize), 50);
        const total = await db.$count(
            monitoringAlerts,
            and(
                ne(monitoringAlerts.status, "resolved"),
                severity ? eq(monitoringAlerts.severity, severity) : undefined
            )
        );
        const rows = await this.getActiveAlerts(
            safePageSize,
            (safePage - 1) * safePageSize,
            severity
        );

        return {
            rows,
            total,
            page: safePage,
            pageSize: safePageSize,
            pageCount: Math.max(1, Math.ceil(total / safePageSize)),
        };
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
        const fourHourCutoff = new Date(now.getTime() - 4 * HOUR);
        const sixHourCutoff = new Date(now.getTime() - 6 * HOUR);
        const eighteenHourCutoff = new Date(now.getTime() - 18 * HOUR);
        const dayCutoff = new Date(now.getTime() - DAY);
        const twoDayCutoff = new Date(now.getTime() - 2 * DAY);
        const fourDayCutoff = new Date(now.getTime() - 4 * DAY);
        const sevenDayCutoff = new Date(now.getTime() - 7 * DAY);
        const fourteenDayCutoff = new Date(now.getTime() - 14 * DAY);
        const fortyFiveDayCutoff = new Date(now.getTime() - 45 * DAY);
        const thirtyDayCutoff = new Date(now.getTime() + 30 * DAY);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
        let checkedCount = 0;
        let breachCount = 0;

        const unassignedTickets = await db
            .select({
                id: supportTickets.id,
                title: supportTickets.title,
                createdAt: supportTickets.createdAt,
            })
            .from(supportTickets)
            .where(
                and(
                    inArray(supportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    isNull(supportTickets.assignedAdminId),
                    lt(supportTickets.createdAt, twoHourCutoff)
                )
            )
            .limit(100);

        const unassignedUserTickets = await db
            .select({
                id: userSupportTickets.id,
                title: userSupportTickets.title,
                createdAt: userSupportTickets.createdAt,
            })
            .from(userSupportTickets)
            .where(
                and(
                    inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    isNull(userSupportTickets.assignedAdminId),
                    lt(userSupportTickets.createdAt, twoHourCutoff)
                )
            )
            .limit(100);

        const staleAdminTickets = await db
            .select({
                id: supportTickets.id,
                title: supportTickets.title,
                statusChangedAt: supportTickets.statusChangedAt,
            })
            .from(supportTickets)
            .where(
                and(
                    inArray(supportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    lt(supportTickets.statusChangedAt, dayCutoff)
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
                    inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    lt(userSupportTickets.statusChangedAt, dayCutoff)
                )
            )
            .limit(100);

        const adminFirstResponseBreaches = await db
            .select({
                id: supportTickets.id,
                title: supportTickets.title,
                dueAt: supportTickets.firstResponseDueAt,
            })
            .from(supportTickets)
            .where(
                and(
                    inArray(supportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    isNotNull(supportTickets.firstResponseDueAt),
                    isNull(supportTickets.firstRespondedAt),
                    lt(supportTickets.firstResponseDueAt, now)
                )
            )
            .limit(100);

        const userFirstResponseBreaches = await db
            .select({
                id: userSupportTickets.id,
                title: userSupportTickets.title,
                dueAt: userSupportTickets.firstResponseDueAt,
            })
            .from(userSupportTickets)
            .where(
                and(
                    inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    isNotNull(userSupportTickets.firstResponseDueAt),
                    isNull(userSupportTickets.firstRespondedAt),
                    lt(userSupportTickets.firstResponseDueAt, now)
                )
            )
            .limit(100);

        const adminResolutionBreaches = await db
            .select({
                id: supportTickets.id,
                title: supportTickets.title,
                dueAt: supportTickets.resolutionDueAt,
            })
            .from(supportTickets)
            .where(
                and(
                    inArray(supportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    isNotNull(supportTickets.resolutionDueAt),
                    lt(supportTickets.resolutionDueAt, now)
                )
            )
            .limit(100);

        const userResolutionBreaches = await db
            .select({
                id: userSupportTickets.id,
                title: userSupportTickets.title,
                dueAt: userSupportTickets.resolutionDueAt,
            })
            .from(userSupportTickets)
            .where(
                and(
                    inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    isNotNull(userSupportTickets.resolutionDueAt),
                    lt(userSupportTickets.resolutionDueAt, now)
                )
            )
            .limit(100);

        const missedCustomerUpdates = await db
            .select({
                id: userSupportTickets.id,
                title: userSupportTickets.title,
                dueAt: userSupportTickets.nextCustomerUpdateDueAt,
            })
            .from(userSupportTickets)
            .where(
                and(
                    inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES),
                    isNotNull(userSupportTickets.nextCustomerUpdateDueAt),
                    lt(userSupportTickets.nextCustomerUpdateDueAt, now)
                )
            )
            .limit(100);

        const customerAutoCloseTickets = await db
            .select({
                id: userSupportTickets.id,
                title: userSupportTickets.title,
                autoCloseEligibleAt: userSupportTickets.autoCloseEligibleAt,
            })
            .from(userSupportTickets)
            .where(
                and(
                    eq(userSupportTickets.status, "waiting_customer"),
                    isNotNull(userSupportTickets.autoCloseEligibleAt),
                    lt(userSupportTickets.autoCloseEligibleAt, now)
                )
            )
            .limit(100);

        const unackOrders24 = await db
            .select({ id: orders.id, updatedAt: orders.updatedAt })
            .from(orders)
            .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    inArray(orders.status, ["pending", "processing"]),
                    lt(orders.updatedAt, dayCutoff),
                    sql`coalesce(${orderShipments.status}, '') not like 'pickup%'`
                )
            )
            .limit(100);

        const brandAckAtRisk18 = await db
            .select({ id: orders.id, updatedAt: orders.updatedAt })
            .from(orders)
            .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    inArray(orders.status, ["pending", "processing"]),
                    isNull(orders.brandAcknowledgedAt),
                    lt(orders.updatedAt, eighteenHourCutoff),
                    gte(orders.updatedAt, dayCutoff),
                    sql`coalesce(${orderShipments.status}, '') not like 'pickup%'`
                )
            )
            .limit(100);

        const brandSilenceAutoCancels = await db
            .select({
                id: orders.id,
                createdAt: orders.createdAt,
                paymentStatus: orders.paymentStatus,
                status: orders.status,
            })
            .from(orders)
            .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    inArray(orders.status, ["pending", "processing"]),
                    isNull(orders.brandAcknowledgedAt),
                    lt(orders.updatedAt, twoDayCutoff),
                    sql`coalesce(${orderShipments.status}, '') not like 'pickup%'`
                )
            )
            .limit(100);

        const stuckOrders = await db
            .select({
                id: orders.id,
                status: orders.status,
                createdAt: orders.createdAt,
                shipmentStatus: orderShipments.status,
            })
            .from(orders)
            .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    ne(orders.status, "cancelled"),
                    ne(orders.status, "delivered"),
                    isNotNull(orderShipments.pickupScheduledDate),
                    inArray(orderShipments.status, [
                        "pickup_scheduled",
                        "pickup_generated",
                        "pickup_queued",
                        "pickup_exception",
                        "pickup_rescheduled",
                        "processing",
                        "pending",
                    ]),
                    lt(orderShipments.pickupScheduledDate, twoDayCutoff)
                )
            )
            .limit(100);

        const stuckDelivery96 = await db
            .select({
                id: orders.id,
                status: orders.status,
                updatedAt: orders.updatedAt,
                shipmentStatus: orderShipments.status,
            })
            .from(orders)
            .innerJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    ne(orders.status, "cancelled"),
                    ne(orders.status, "delivered"),
                    isNotNull(orderShipments.shipmentDate),
                    inArray(orderShipments.status, [
                        "pickup_completed",
                        "in_transit",
                        "out_for_delivery",
                    ]),
                    lt(orderShipments.shipmentDate, fourDayCutoff)
                )
            )
            .limit(100);

        const codFraudReviewBreaches = await db
            .select({
                id: fraudReviews.orderId,
                reviewId: fraudReviews.id,
                createdAt: fraudReviews.createdAt,
                totalAmount: orders.totalAmount,
            })
            .from(fraudReviews)
            .innerJoin(orders, eq(orders.id, fraudReviews.orderId))
            .where(
                and(
                    eq(fraudReviews.status, "pending"),
                    or(
                        lt(fraudReviews.dueAt, now),
                        lt(fraudReviews.createdAt, fourHourCutoff)
                    )
                )
            )
            .limit(100);

        const staleTrackingShipments = await db
            .select({
                id: orderShipments.id,
                orderId: orderShipments.orderId,
                status: orderShipments.status,
                updatedAt: orderShipments.updatedAt,
            })
            .from(orderShipments)
            .where(
                and(
                    inArray(orderShipments.status, [
                        "in_transit",
                        "out_for_delivery",
                    ]),
                    lt(orderShipments.updatedAt, sixHourCutoff)
                )
            )
            .limit(100);

        const rtoDispositionBreaches = await db
            .select({
                id: rtoDispositions.id,
                orderId: rtoDispositions.orderId,
                status: rtoDispositions.status,
                updatedAt: rtoDispositions.updatedAt,
            })
            .from(rtoDispositions)
            .where(
                and(
                    inArray(rtoDispositions.status, ["pending", "recovering"]),
                    or(
                        lt(rtoDispositions.dispositionDueAt, now),
                        lt(rtoDispositions.createdAt, sevenDayCutoff)
                    )
                )
            )
            .limit(100);

        const returnQcBreaches = await db
            .select({
                id: orderReturnRequests.id,
                orderId: orderReturnRequests.orderId,
                updatedAt: orderReturnRequests.updatedAt,
            })
            .from(orderReturnRequests)
            .where(
                and(
                    eq(orderReturnRequests.status, "processing"),
                    lt(orderReturnRequests.updatedAt, twoDayCutoff)
                )
            )
            .limit(100);

        const carrierClaimBreaches = await db
            .select({
                id: carrierClaims.id,
                orderId: carrierClaims.orderId,
                updatedAt: carrierClaims.updatedAt,
            })
            .from(carrierClaims)
            .where(
                and(
                    inArray(carrierClaims.status, ["filed", "in_review"]),
                    or(
                        lt(carrierClaims.dueAt, now),
                        lt(carrierClaims.updatedAt, fortyFiveDayCutoff)
                    )
                )
            )
            .limit(100);

        const codReconciliation14 = await db
            .select({
                id: codReconciliationItems.orderId,
                itemId: codReconciliationItems.id,
                totalAmount: codReconciliationItems.codAmount,
                updatedAt: codReconciliationItems.updatedAt,
            })
            .from(codReconciliationItems)
            .where(
                and(
                    inArray(codReconciliationItems.status, [
                        "pending",
                        "missing",
                        "disputed",
                    ]),
                    lt(codReconciliationItems.updatedAt, fourteenDayCutoff),
                    gte(codReconciliationItems.updatedAt, thirtyDaysAgo)
                )
            )
            .limit(100);

        const codReconciliation30 = await db
            .select({
                id: codReconciliationItems.orderId,
                itemId: codReconciliationItems.id,
                totalAmount: codReconciliationItems.codAmount,
                updatedAt: codReconciliationItems.updatedAt,
            })
            .from(codReconciliationItems)
            .where(
                and(
                    inArray(codReconciliationItems.status, [
                        "pending",
                        "missing",
                        "disputed",
                    ]),
                    lt(codReconciliationItems.updatedAt, thirtyDaysAgo)
                )
            )
            .limit(100);

        const recentCodRuns = await db
            .select({ id: codReconciliationRuns.id })
            .from(codReconciliationRuns)
            .where(gte(codReconciliationRuns.runDate, sevenDayCutoff))
            .limit(1);
        const codReconciliationSkipped =
            now.getDay() === 5 && recentCodRuns.length === 0;

        const brandAckDelayRows = await db
            .select({
                orderId: orders.id,
                brandId: products.brandId,
            })
            .from(orders)
            .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
            .innerJoin(products, eq(products.id, orderItems.productId))
            .where(
                and(
                    inArray(orders.status, ["pending", "processing"]),
                    isNull(orders.brandAcknowledgedAt),
                    lt(orders.createdAt, dayCutoff),
                    gte(orders.createdAt, fourteenDayCutoff)
                )
            )
            .limit(500);
        const brandAckDelayCounts = new Map<
            string,
            { brandId: string; orderIds: Set<string> }
        >();
        for (const row of brandAckDelayRows) {
            if (!row.brandId) continue;
            const current = brandAckDelayCounts.get(row.brandId) ?? {
                brandId: row.brandId,
                orderIds: new Set<string>(),
            };
            current.orderIds.add(row.orderId);
            brandAckDelayCounts.set(row.brandId, current);
        }
        const repeatedBrandAckDelays = Array.from(
            brandAckDelayCounts.values()
        ).filter((item) => item.orderIds.size >= 3);

        const pendingRefunds = await db
            .select({ id: refunds.id, createdAt: refunds.createdAt })
            .from(refunds)
            .where(
                and(
                    eq(refunds.status, "pending"),
                    lt(refunds.createdAt, twoDayCutoff)
                )
            )
            .limit(100);

        const failedRefunds = await db
            .select({
                id: refunds.id,
                updatedAt: refunds.updatedAt,
                failedReason: refunds.failedReason,
            })
            .from(refunds)
            .where(eq(refunds.status, "failed"))
            .limit(100);

        const autoApprovalReturnRequests = await db
            .select({
                id: orderReturnRequests.id,
                orderId: orderReturnRequests.orderId,
                createdAt: orderReturnRequests.createdAt,
            })
            .from(orderReturnRequests)
            .where(
                and(
                    eq(orderReturnRequests.status, "pending"),
                    eq(orderReturnRequests.requestType, "return"),
                    lt(orderReturnRequests.createdAt, twoDayCutoff)
                )
            )
            .limit(100);

        const failedPayments = await db
            .select({ id: orders.id, updatedAt: orders.updatedAt })
            .from(orders)
            .where(eq(orders.paymentStatus, "failed"))
            .limit(100);

        const contractExpiring = await db
            .select({
                id: brands.id,
                name: brands.name,
                contractExpiresAt: brands.contractExpiresAt,
            })
            .from(brands)
            .where(
                and(
                    isNotNull(brands.contractExpiresAt),
                    lt(brands.contractExpiresAt, thirtyDayCutoff)
                )
            )
            .limit(100);

        const certExpiring = await db
            .select({
                id: brandConfidentials.id,
                sustainabilityCertificateExpiresAt:
                    brandConfidentials.sustainabilityCertificateExpiresAt,
            })
            .from(brandConfidentials)
            .where(
                and(
                    isNotNull(
                        brandConfidentials.sustainabilityCertificateExpiresAt
                    ),
                    lt(
                        brandConfidentials.sustainabilityCertificateExpiresAt,
                        thirtyDayCutoff
                    )
                )
            )
            .limit(100);

        const lowInventory = await db
            .select({
                id: productVariants.id,
                sku: productVariants.sku,
                quantity: productVariants.quantity,
            })
            .from(productVariants)
            .where(
                and(
                    gte(productVariants.quantity, 0),
                    lt(productVariants.quantity, 5)
                )
            )
            .limit(100);

        for (const ticket of [...unassignedTickets, ...unassignedUserTickets]) {
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

        for (const ticket of [
            ...adminFirstResponseBreaches,
            ...userFirstResponseBreaches,
        ]) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "support_first_response_breach",
                severity: "critical",
                entityType: "support_ticket",
                entityId: ticket.id,
                title: "Support first response SLA breached",
                message: `${ticket.title} missed the Chapter 3 first-response SLA.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: ticket.dueAt,
                dedupeKey: `support:first-response:${ticket.id}`,
                metadata: {
                    source: "sla-check",
                    dueAt: ticket.dueAt?.toISOString(),
                },
            });
        }

        for (const ticket of [
            ...adminResolutionBreaches,
            ...userResolutionBreaches,
        ]) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "support_resolution_breach",
                severity: "critical",
                entityType: "support_ticket",
                entityId: ticket.id,
                title: "Support resolution SLA breached",
                message: `${ticket.title} missed the Chapter 3 resolution SLA.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: ticket.dueAt,
                dedupeKey: `support:resolution:${ticket.id}`,
                metadata: {
                    source: "sla-check",
                    dueAt: ticket.dueAt?.toISOString(),
                },
            });
        }

        for (const ticket of missedCustomerUpdates) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "support_customer_update_breach",
                severity: "warning",
                entityType: "support_ticket",
                entityId: ticket.id,
                title: "Customer update SLA breached",
                message: `${ticket.title} needs a 24-hour customer update.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email"],
                dueAt: ticket.dueAt,
                dedupeKey: `support:customer-update:${ticket.id}`,
                metadata: {
                    source: "sla-check",
                    dueAt: ticket.dueAt?.toISOString(),
                },
            });
        }

        for (const ticket of customerAutoCloseTickets) {
            checkedCount += 1;

            await db
                .update(userSupportTickets)
                .set({
                    status: "auto_closed",
                    resolutionCode: "RES_AUTOCLOSED_NO_RESPONSE",
                    closedAt: now,
                    resolvedAt: now,
                    statusChangedAt: now,
                    reopenAllowedUntil: new Date(now.getTime() + 14 * DAY),
                    updatedAt: now,
                })
                .where(eq(userSupportTickets.id, ticket.id));

            await this.writeAudit({
                userId: actorId,
                actionType: "ticket_auto_closed",
                entityType: "user_support_ticket",
                entityId: ticket.id,
                beforeValue: { status: "waiting_customer" },
                afterValue: {
                    status: "auto_closed",
                    resolutionCode: "RES_AUTOCLOSED_NO_RESPONSE",
                },
                reason: "customer_no_response_7_days",
            });
        }

        for (const order of brandAckAtRisk18) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "brand_ack_at_risk_18h",
                severity: "warning",
                entityType: "order",
                entityId: order.id,
                title: "Brand acknowledgement approaching SLA",
                message: `Order ${order.id} has crossed 18 hours without brand acknowledgement. Chase the brand before the 24-hour SLA breach.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email"],
                dueAt: new Date(order.updatedAt.getTime() + DAY),
                dedupeKey: `order:brand-ack-risk:${order.id}`,
                metadata: { source: "sla-check", chapter: "order-ops" },
            });
        }

        for (const order of unackOrders24) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "order_unacknowledged_24h",
                severity:
                    now.getTime() - order.updatedAt.getTime() > 2 * DAY
                        ? "critical"
                        : "warning",
                entityType: "order",
                entityId: order.id,
                title: "Order status unmoved for 24 hours",
                message: `Order ${order.id} has not moved in Renivet status for 24 hours and is not in pickup flow.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(order.updatedAt.getTime() + 28 * HOUR),
                dedupeKey: `order:unack:${order.id}`,
                metadata: {
                    source: "sla-check",
                    rule: "own_status_unmoved_excluding_pickup",
                },
            });
        }

        for (const order of brandSilenceAutoCancels) {
            checkedCount += 1;
            breachCount += 1;

            await this.writeAudit({
                userId: actorId,
                actionType: "order_brand_silence_escalated",
                entityType: "order",
                entityId: order.id,
                beforeValue: {
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                },
                afterValue: {
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    escalationReasonCode: "CAN_BRAND_NO_RESPONSE",
                },
                reason: "brand_ack_sla_48h_breached",
                metadata: { source: "sla-check", chapter: "order-ops" },
            });

            await this.createAlert({
                type: "order_brand_silence_48h",
                severity: "critical",
                entityType: "order",
                entityId: order.id,
                title: "Brand silent for 48 hours on order",
                message: `Order ${order.id} has crossed 48 hours without brand acknowledgement. Escalate immediately, but do not treat it as a delivery or customer cancellation.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `order:brand-silence-48h:${order.id}`,
                metadata: {
                    source: "sla-check",
                    chapter: "order-ops",
                    escalationReasonCode: "CAN_BRAND_NO_RESPONSE",
                },
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
                title: "Order not picked up within 48 hours",
                message: `Order ${order.id} has not reached pickup completed / in-transit state within 48 hours.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `order:stuck:${order.id}`,
                metadata: {
                    source: "sla-check",
                    rule: "pickup_not_completed_48h",
                    shipmentStatus: order.shipmentStatus,
                },
            });
        }

        for (const order of stuckDelivery96) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "stuck_order_customer_choice_due",
                severity: "critical",
                entityType: "order",
                entityId: order.id,
                title: "Order not delivered within 96 hours",
                message: `Order ${order.id} has been picked up but not delivered within 96 hours. Check carrier status and message the customer if needed.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `order:delivery-96h:${order.id}`,
                metadata: {
                    source: "sla-check",
                    chapter: "order-ops",
                    rule: "delivery_not_completed_96h",
                    shipmentStatus: order.shipmentStatus,
                },
            });
        }

        for (const order of codFraudReviewBreaches) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "fraud_screening_breach",
                severity: "critical",
                entityType: "order",
                entityId: order.id,
                title: "COD fraud review SLA breached",
                message: `COD order ${order.id} has been awaiting fraud screening for more than 4 hours. Review risk signals and cancel with CAN_FRAUD_FLAG if needed.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + 2 * HOUR),
                dedupeKey: `order:cod-fraud-review:${order.id}`,
                metadata: {
                    source: "sla-check",
                    chapter: "order-ops",
                    fraudReviewId: order.reviewId,
                    totalAmount: order.totalAmount,
                },
            });
        }

        for (const shipment of staleTrackingShipments) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "shipment_tracking_stale_6h",
                severity: "warning",
                entityType: "order_shipment",
                entityId: shipment.id,
                title: "Shipment tracking update stale",
                message: `Shipment for order ${shipment.orderId} has not received a tracking update within 6 hours while ${shipment.status}. Check Delhivery/Shiprocket sync.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `shipment:tracking-stale:${shipment.id}`,
                metadata: { source: "sla-check", chapter: "order-ops" },
            });
        }

        for (const shipment of rtoDispositionBreaches) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "rto_disposition_breach",
                severity: "critical",
                entityType: "rto_disposition",
                entityId: shipment.id,
                title: "RTO disposition pending beyond 7 days",
                message: `RTO disposition for order ${shipment.orderId} has been in ${shipment.status} beyond the 7-day SLA.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `rto:disposition:${shipment.id}`,
                metadata: { source: "sla-check", chapter: "order-ops" },
            });
        }

        for (const request of returnQcBreaches) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "return_qc_breach",
                severity: "warning",
                entityType: "order_return_request",
                entityId: request.id,
                title: "Return QC pending beyond 48 hours",
                message: `Return request ${request.id} for order ${request.orderId} is still in quality check after 48 hours.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `return:qc-breach:${request.id}`,
                metadata: { source: "sla-check", chapter: "order-ops" },
            });
        }

        for (const shipment of carrierClaimBreaches) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "carrier_claim_45d_breach",
                severity: "critical",
                entityType: "carrier_claim",
                entityId: shipment.id,
                title: "Carrier claim pending beyond 45 days",
                message: `Carrier claim for order ${shipment.orderId} is pending beyond the 45-day SLA. Chase the carrier claim outcome.`,
                ownerId: actorId,
                ownerRole: "order_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `carrier-claim:45d:${shipment.id}`,
                metadata: { source: "sla-check", chapter: "order-ops" },
            });
        }

        for (const order of codReconciliation14) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "cod_reconciliation_pending_14d",
                severity: "warning",
                entityType: "order",
                entityId: order.id,
                title: "COD reconciliation pending beyond 14 days",
                message: `Delivered COD order ${order.id} has not been cleared in the weekly reconciliation window.`,
                ownerId: actorId,
                ownerRole: "finance",
                channels: ["admin", "email"],
                dueAt: new Date(now.getTime() + 3 * DAY),
                dedupeKey: `order:cod-recon-14d:${order.id}`,
                metadata: {
                    source: "sla-check",
                    chapter: "order-ops",
                    codReconciliationItemId: order.itemId,
                    totalAmount: order.totalAmount,
                },
            });
        }

        for (const order of codReconciliation30) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "cod_reconciliation_pending_30d",
                severity: "critical",
                entityType: "order",
                entityId: order.id,
                title: "COD reconciliation pending beyond 30 days",
                message: `Delivered COD order ${order.id} has crossed the 30-day finance escalation threshold.`,
                ownerId: actorId,
                ownerRole: "finance",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + DAY),
                dedupeKey: `order:cod-recon-30d:${order.id}`,
                metadata: {
                    source: "sla-check",
                    chapter: "order-ops",
                    codReconciliationItemId: order.itemId,
                    totalAmount: order.totalAmount,
                },
            });
        }

        if (codReconciliationSkipped) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "cod_reconciliation_skipped",
                severity: "critical",
                entityType: "cod_reconciliation_run",
                entityId: new Date().toISOString().slice(0, 10),
                title: "COD reconciliation log missing",
                message:
                    "No COD reconciliation run was created in the last 7 days. Chapter 4 requires the Thursday 3 PM reconciliation session with AJ.",
                ownerId: actorId,
                ownerRole: "finance",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + 4 * HOUR),
                dedupeKey: `cod-recon:skipped:${new Date().toISOString().slice(0, 10)}`,
                metadata: { source: "sla-check", chapter: "order-ops" },
            });
        }

        for (const brand of repeatedBrandAckDelays) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "brand_ack_delay_pattern",
                severity: "critical",
                entityType: "brand",
                entityId: brand.brandId,
                title: "Repeated brand acknowledgement delays",
                message: `Brand ${brand.brandId} has ${brand.orderIds.size} orders delayed beyond acknowledgement SLA in the last 14 days. Escalate to KP.`,
                ownerId: actorId,
                ownerRole: "brand_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + DAY),
                dedupeKey: `brand:ack-delay-pattern:${brand.brandId}:${new Date().toISOString().slice(0, 10)}`,
                metadata: {
                    source: "sla-check",
                    chapter: "order-ops",
                    orderIds: Array.from(brand.orderIds),
                },
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

        for (const refund of failedRefunds) {
            checkedCount += 1;
            breachCount += 1;
            await this.createAlert({
                type: "refund_failed",
                severity: "critical",
                entityType: "refund",
                entityId: refund.id,
                title: "Refund failed",
                message: `Refund ${refund.id} failed and needs AJ review.`,
                ownerId: actorId,
                ownerRole: "aj",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(refund.updatedAt.getTime() + 4 * HOUR),
                dedupeKey: `refund:failed:${refund.id}`,
                metadata: {
                    source: "sla-check",
                    failedReason: refund.failedReason ?? null,
                },
            });
        }

        for (const request of autoApprovalReturnRequests) {
            checkedCount += 1;
            breachCount += 1;

            const approved = await db
                .update(orderReturnRequests)
                .set({
                    status: "approved",
                    updatedAt: new Date(),
                })
                .where(eq(orderReturnRequests.id, request.id))
                .returning()
                .then((res) => res[0]);

            await this.writeAudit({
                userId: actorId,
                actionType: "return_request_auto_approved",
                entityType: "order_return_request",
                entityId: request.id,
                beforeValue: { status: "pending" },
                afterValue: {
                    status: approved?.status ?? "approved",
                    orderId: request.orderId,
                },
                reason: "brand_return_response_sla_48h_breached",
            });

            await this.createAlert({
                type: "return_auto_approved_48h",
                severity: "warning",
                entityType: "order_return_request",
                entityId: request.id,
                title: "Return auto-approved after brand silence",
                message: `Return request ${request.id} was auto-approved because the brand did not respond within 48 hours.`,
                ownerId: actorId,
                ownerRole: "support_manager",
                channels: ["admin", "email", "whatsapp"],
                dueAt: new Date(now.getTime() + DAY),
                dedupeKey: `return:auto-approved:${request.id}`,
                metadata: {
                    source: "sla-check",
                    orderId: request.orderId,
                    createdAt: request.createdAt.toISOString(),
                },
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
                type: expired
                    ? "sustainability_cert_expired"
                    : "sustainability_cert_expiring",
                severity: expired ? "critical" : "warning",
                entityType: "brand_confidential",
                entityId: cert.id,
                title: expired
                    ? "Sustainability certificate expired"
                    : "Sustainability certificate expiring",
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
                    staleTickets:
                        staleAdminTickets.length + staleUserTickets.length,
                    supportFirstResponseBreaches:
                        adminFirstResponseBreaches.length +
                        userFirstResponseBreaches.length,
                    supportResolutionBreaches:
                        adminResolutionBreaches.length +
                        userResolutionBreaches.length,
                    missedCustomerUpdates: missedCustomerUpdates.length,
                    customerAutoClosed: customerAutoCloseTickets.length,
                    brandAckAtRisk18: brandAckAtRisk18.length,
                    unackOrders24: unackOrders24.length,
                    brandSilenceAutoCancels: brandSilenceAutoCancels.length,
                    stuckOrders: stuckOrders.length,
                    stuckDelivery96: stuckDelivery96.length,
                    codFraudReviewBreaches: codFraudReviewBreaches.length,
                    staleTrackingShipments: staleTrackingShipments.length,
                    rtoDispositionBreaches: rtoDispositionBreaches.length,
                    returnQcBreaches: returnQcBreaches.length,
                    carrierClaimBreaches: carrierClaimBreaches.length,
                    codReconciliation14: codReconciliation14.length,
                    codReconciliation30: codReconciliation30.length,
                    codReconciliationSkipped,
                    repeatedBrandAckDelays: repeatedBrandAckDelays.length,
                    pendingRefunds: pendingRefunds.length,
                    failedRefunds: failedRefunds.length,
                    autoApprovalReturnRequests:
                        autoApprovalReturnRequests.length,
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
        const yesterday = new Date(today.getTime() - DAY);
        const fourHourCutoff = new Date(Date.now() - 4 * HOUR);
        const eighteenHourCutoff = new Date(Date.now() - 18 * HOUR);
        const dayCutoff = new Date(Date.now() - DAY);
        const twoDayCutoff = new Date(Date.now() - 2 * DAY);
        const fourDayCutoff = new Date(Date.now() - 4 * DAY);
        const sevenDayCutoff = new Date(Date.now() - 7 * DAY);
        const fourteenDayCutoff = new Date(Date.now() - 14 * DAY);

        const ordersPlaced24h = await db.$count(
            orders,
            gte(orders.createdAt, today)
        );
        const ordersUnack24h = await db
            .select({ count: sql<number>`count(distinct ${orders.id})` })
            .from(orders)
            .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    inArray(orders.status, ["pending", "processing"]),
                    lt(orders.updatedAt, dayCutoff),
                    sql`coalesce(${orderShipments.status}, '') not like 'pickup%'`
                )
            )
            .then((res) => res[0]?.count ?? 0);
        const brandAckAtRisk18h = await db
            .select({ count: sql<number>`count(distinct ${orders.id})` })
            .from(orders)
            .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    inArray(orders.status, ["pending", "processing"]),
                    isNull(orders.brandAcknowledgedAt),
                    lt(orders.updatedAt, eighteenHourCutoff),
                    gte(orders.updatedAt, dayCutoff),
                    sql`coalesce(${orderShipments.status}, '') not like 'pickup%'`
                )
            )
            .then((res) => res[0]?.count ?? 0);
        const codFraudReviewQueue = await db.$count(
            fraudReviews,
            and(
                eq(fraudReviews.status, "pending"),
                or(
                    lt(fraudReviews.dueAt, new Date()),
                    lt(fraudReviews.createdAt, fourHourCutoff)
                )
            )
        );
        const ordersShipped24h = await db.$count(
            orders,
            and(eq(orders.status, "shipped"), gte(orders.updatedAt, today))
        );
        const pickupStuck48h = await db
            .select({ count: sql<number>`count(distinct ${orders.id})` })
            .from(orders)
            .leftJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    ne(orders.status, "cancelled"),
                    ne(orders.status, "delivered"),
                    isNotNull(orderShipments.pickupScheduledDate),
                    inArray(orderShipments.status, [
                        "pickup_scheduled",
                        "pickup_generated",
                        "pickup_queued",
                        "pickup_exception",
                        "pickup_rescheduled",
                        "processing",
                        "pending",
                    ]),
                    lt(orderShipments.pickupScheduledDate, twoDayCutoff)
                )
            )
            .then((res) => res[0]?.count ?? 0);
        const deliveryStuck96h = await db
            .select({ count: sql<number>`count(distinct ${orders.id})` })
            .from(orders)
            .innerJoin(orderShipments, eq(orderShipments.orderId, orders.id))
            .where(
                and(
                    ne(orders.status, "cancelled"),
                    ne(orders.status, "delivered"),
                    isNotNull(orderShipments.shipmentDate),
                    inArray(orderShipments.status, [
                        "pickup_completed",
                        "in_transit",
                        "out_for_delivery",
                    ]),
                    lt(orderShipments.shipmentDate, fourDayCutoff)
                )
            )
            .then((res) => res[0]?.count ?? 0);
        const stuckOrders48h = pickupStuck48h + deliveryStuck96h;
        const rtoInTransit = await db.$count(
            orderShipments,
            eq(orderShipments.status, "rto_initiated")
        );
        const rtoDispositionPending7d = await db.$count(
            rtoDispositions,
            and(
                inArray(rtoDispositions.status, ["pending", "recovering"]),
                or(
                    lt(rtoDispositions.dispositionDueAt, new Date()),
                    lt(rtoDispositions.createdAt, sevenDayCutoff)
                )
            )
        );
        const deliveredToday = await db.$count(
            orders,
            and(eq(orders.status, "delivered"), gte(orders.updatedAt, today))
        );
        const failedDeliveryToday = await db.$count(
            orderShipments,
            and(
                eq(orderShipments.status, "failed"),
                gte(orderShipments.updatedAt, today)
            )
        );
        const pendingCodAmount = await db
            .select({
                amount: sql<number>`coalesce(sum(${codReconciliationItems.codAmount} - ${codReconciliationItems.remittedAmount}), 0)`,
            })
            .from(codReconciliationItems)
            .where(
                and(
                    inArray(codReconciliationItems.status, [
                        "pending",
                        "missing",
                        "disputed",
                        "short_paid",
                    ]),
                    lt(codReconciliationItems.updatedAt, fourteenDayCutoff)
                )
            )
            .then((res) => res[0]?.amount ?? 0);
        const ordersPlacedYesterday = await db.$count(
            orders,
            and(gte(orders.createdAt, yesterday), lt(orders.createdAt, today))
        );
        const rtoRateSpike =
            ordersPlacedYesterday > 0 &&
            rtoInTransit / ordersPlacedYesterday > 0.2
                ? "review"
                : "normal";
        const openAlerts = await db.$count(
            monitoringAlerts,
            ne(monitoringAlerts.status, "resolved")
        );
        const criticalAlerts = await db.$count(
            monitoringAlerts,
            and(
                eq(monitoringAlerts.severity, "critical"),
                ne(monitoringAlerts.status, "resolved")
            )
        );
        const openAdminTickets = await db.$count(
            supportTickets,
            inArray(supportTickets.status, ACTIVE_SUPPORT_STATUSES)
        );
        const openUserTickets = await db.$count(
            userSupportTickets,
            inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES)
        );
        const agedAdminTickets = await db.$count(
            supportTickets,
            and(
                inArray(supportTickets.status, ACTIVE_SUPPORT_STATUSES),
                lt(supportTickets.statusChangedAt, dayCutoff)
            )
        );
        const agedUserTickets = await db.$count(
            userSupportTickets,
            and(
                inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES),
                lt(userSupportTickets.statusChangedAt, dayCutoff)
            )
        );
        const pendingRefunds = await db.$count(
            refunds,
            eq(refunds.status, "pending")
        );
        const failedPayments = await db.$count(
            orders,
            eq(orders.paymentStatus, "failed")
        );
        const pendingBrandRequests = await db.$count(
            brandRequests,
            eq(brandRequests.status, "pending")
        );
        const weeklyOrders = await db.$count(
            orders,
            gte(orders.createdAt, weekStart)
        );
        const activeBrands = await db.$count(brands, eq(brands.isActive, true));
        const inactiveOrPendingBrands = await db.$count(
            brands,
            or(
                eq(brands.isActive, false),
                ne(brands.confidentialVerificationStatus, "approved")
            )
        );
        const weeklyBusiness = await db
            .select({
                gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                orderCount: sql<number>`count(${orders.id})`,
                newCustomers: sql<number>`count(distinct ${orders.userId})`,
                aov: sql<number>`case when count(${orders.id}) = 0 then 0 else coalesce(sum(${orders.totalAmount}), 0) / count(${orders.id}) end`,
            })
            .from(orders)
            .where(gte(orders.createdAt, weekStart))
            .then((res) => res[0]);
        const pendingRefundAmount = await db
            .select({
                amount: sql<number>`coalesce(sum(${refunds.amount}), 0)`,
            })
            .from(refunds)
            .where(eq(refunds.status, "pending"))
            .then((res) => res[0]?.amount ?? 0);

        const status: "green" | "amber" | "red" =
            criticalAlerts > 0 || stuckOrders48h > 0
                ? "red"
                : openAlerts > 0 || pendingRefunds > 0
                  ? "amber"
                  : "green";

        return {
            status,
            metrics: {
                ordersPlaced24h,
                brandAckAtRisk18h,
                ordersUnacknowledged24h: ordersUnack24h,
                codFraudReviewQueue,
                ordersShipped24h,
                stuckOrders48h,
                rtoInTransit,
                rtoDispositionPending7d,
                pendingCodAmount,
                deliveredToday,
                failedDeliveryToday,
                rtoRateSpike,
                openTickets: openAdminTickets + openUserTickets,
                ticketsAged24h: agedAdminTickets + agedUserTickets,
                refundsPendingProcessing: pendingRefunds,
                refundsPendingQc: pendingRefunds,
                failedPayments,
                brandNonResponseCases: pendingBrandRequests,
                platformUptime24h: criticalAlerts > 0 ? "review" : "100%",
                ordersWtd: weeklyOrders,
                gmvWtd: weeklyBusiness.gmv ?? 0,
                aovWtd: weeklyBusiness.aov ?? 0,
                newCustomersWtd: weeklyBusiness.newCustomers ?? 0,
                activeBrands,
                inactiveOrPendingBrands,
                pendingRefundAmount,
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
                .set({
                    metrics: health.metrics,
                    status: health.status,
                    generatedBy: actorId,
                })
                .where(eq(dailyHealthSnapshots.id, existing.id))
                .returning()
                .then((res) => res[0]);
        }

        return db
            .insert(dailyHealthSnapshots)
            .values({
                snapshotDate,
                metrics: health.metrics,
                status: health.status,
                generatedBy: actorId,
            })
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
            health.metrics.criticalAlerts
                ? "Resolve critical monitoring alerts before founder review."
                : "Confirm open alerts are owned.",
            health.metrics.ticketsAged24h
                ? "Clear support tickets aged over 24 hours."
                : "Keep ticket first response SLA green.",
            health.metrics.ordersUnacknowledged24h
                ? "Review orders whose Renivet status has not moved for 24 hours, excluding pickup flow."
                : "No 24-hour unmoved order backlog.",
        ];

        const existing = await db.query.weeklyReportingPacks.findFirst({
            where: and(
                eq(weeklyReportingPacks.weekStart, weekStart),
                eq(weeklyReportingPacks.weekEnd, weekEnd)
            ),
        });

        const values = {
            executiveSnapshot: `System status is ${health.status}. GMV WTD: ${health.metrics.gmvWtd}. Orders WTD: ${health.metrics.ordersWtd}. New customers WTD: ${health.metrics.newCustomersWtd}. Open alerts: ${health.metrics.openAlerts}. Open tickets: ${health.metrics.openTickets}.`,
            actionItems,
            metrics: {
                executiveSnapshot: health.metrics,
                operationalMetrics: {
                    slaHitRate: health.metrics.openAlerts ? "review" : "green",
                    ticketsAged24h: health.metrics.ticketsAged24h,
                    refundsPendingProcessing:
                        health.metrics.refundsPendingProcessing,
                },
                financialSnapshot: {
                    gmvWtd: health.metrics.gmvWtd,
                    aovWtd: health.metrics.aovWtd,
                    refundsPendingProcessing:
                        health.metrics.refundsPendingProcessing,
                    pendingRefundAmount: health.metrics.pendingRefundAmount,
                    failedPayments: health.metrics.failedPayments,
                },
                brandHealth: {
                    activeBrands: health.metrics.activeBrands,
                    inactiveOrPendingBrands:
                        health.metrics.inactiveOrPendingBrands,
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

    async getWeeklyBusiness() {
        const today = startOfDay();
        const weekStart = new Date(today.getTime() - 6 * DAY);
        const previousWeekStart = new Date(weekStart.getTime() - 7 * DAY);
        const previousWeekEnd = weekStart;
        const previousFourWeekStart = new Date(weekStart.getTime() - 28 * DAY);
        const weekStartSql = toSqlDateTime(weekStart);
        const weekStartKey = weekStart.toISOString().slice(0, 10);
        const weekEndKey = today.toISOString().slice(0, 10);

        const [currentWeek, previousWeek, priorFourWeek] = await Promise.all([
            db
                .select({
                    gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                    orderCount: sql<number>`count(${orders.id})`,
                    customerCount: sql<number>`count(distinct ${orders.userId})`,
                    repeatCustomers: sql<number>`count(distinct case when first_orders.first_order_at < ${weekStartSql} then ${orders.userId} end)`,
                    aov: sql<number>`case when count(${orders.id}) = 0 then 0 else coalesce(sum(${orders.totalAmount}), 0) / count(${orders.id}) end`,
                })
                .from(orders)
                .leftJoin(
                    sql`(
                        select user_id, min(created_at) as first_order_at
                        from ${orders}
                        where status <> 'cancelled' and payment_status <> 'failed'
                        group by user_id
                    ) first_orders`,
                    sql`first_orders.user_id = ${orders.userId}`
                )
                .where(
                    and(
                        gte(orders.createdAt, weekStart),
                        ne(orders.status, "cancelled"),
                        ne(orders.paymentStatus, "failed")
                    )
                )
                .then((res) => res[0]),
            db
                .select({
                    gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                    orderCount: sql<number>`count(${orders.id})`,
                    aov: sql<number>`case when count(${orders.id}) = 0 then 0 else coalesce(sum(${orders.totalAmount}), 0) / count(${orders.id}) end`,
                })
                .from(orders)
                .where(
                    and(
                        gte(orders.createdAt, previousWeekStart),
                        lt(orders.createdAt, previousWeekEnd),
                        ne(orders.status, "cancelled"),
                        ne(orders.paymentStatus, "failed")
                    )
                )
                .then((res) => res[0]),
            db
                .select({
                    gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                    orderCount: sql<number>`count(${orders.id})`,
                    aov: sql<number>`case when count(${orders.id}) = 0 then 0 else coalesce(sum(${orders.totalAmount}), 0) / count(${orders.id}) end`,
                })
                .from(orders)
                .where(
                    and(
                        gte(orders.createdAt, previousFourWeekStart),
                        lt(orders.createdAt, weekStart),
                        ne(orders.status, "cancelled"),
                        ne(orders.paymentStatus, "failed")
                    )
                )
                .then((res) => res[0]),
        ]);

        const [
            activeBrands,
            sellingBrandsThisWeek,
            sellingBrandsPreviousWeek,
            supportAdminOpen,
            supportUserOpen,
            supportStats,
            latestSupportSummary,
            refundStats,
            refundReasonRows,
            rtoStats,
            funnelStats,
            slaBreaches,
            slaBreachesByFunction,
            topBrands,
            bottomBrands,
        ] = await Promise.all([
            db.$count(brands, eq(brands.isActive, true)),
            db
                .select({
                    count: sql<number>`count(distinct ${products.brandId})`,
                })
                .from(orderItems)
                .innerJoin(products, eq(orderItems.productId, products.id))
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .where(
                    and(
                        gte(orders.createdAt, weekStart),
                        ne(orders.status, "cancelled"),
                        ne(orders.paymentStatus, "failed")
                    )
                )
                .then((res) => res[0]?.count ?? 0),
            db
                .select({
                    count: sql<number>`count(distinct ${products.brandId})`,
                })
                .from(orderItems)
                .innerJoin(products, eq(orderItems.productId, products.id))
                .innerJoin(orders, eq(orderItems.orderId, orders.id))
                .where(
                    and(
                        gte(orders.createdAt, previousWeekStart),
                        lt(orders.createdAt, previousWeekEnd),
                        ne(orders.status, "cancelled"),
                        ne(orders.paymentStatus, "failed")
                    )
                )
                .then((res) => res[0]?.count ?? 0),
            db.$count(
                supportTickets,
                inArray(supportTickets.status, ACTIVE_SUPPORT_STATUSES)
            ),
            db.$count(
                userSupportTickets,
                inArray(userSupportTickets.status, ACTIVE_SUPPORT_STATUSES)
            ),
            db.execute(sql`
                with weekly_tickets as (
                    select
                        created_at,
                        first_responded_at,
                        resolved_at,
                        csat_score,
                        status
                    from ${supportTickets}
                    where created_at >= ${weekStartSql}::timestamp
                    union all
                    select
                        created_at,
                        first_responded_at,
                        resolved_at,
                        csat_score,
                        status
                    from ${userSupportTickets}
                    where created_at >= ${weekStartSql}::timestamp
                )
                select
                    count(*)::int as tickets_opened,
                    count(case when resolved_at is not null or status in ('resolved', 'closed') then 1 end)::int as tickets_resolved,
                    avg(extract(epoch from (first_responded_at - created_at)) / 60)
                        filter (where first_responded_at is not null)::int as avg_first_response_minutes,
                    avg(extract(epoch from (resolved_at - created_at)) / 60)
                        filter (where resolved_at is not null)::int as avg_resolution_minutes,
                    avg(csat_score) filter (where csat_score is not null)::numeric(10, 2) as csat_average
                from weekly_tickets
            `),
            db.query.supportWeeklySummaries.findFirst({
                where: and(
                    eq(supportWeeklySummaries.weekStart, weekStartKey),
                    eq(supportWeeklySummaries.weekEnd, weekEndKey)
                ),
                orderBy: [desc(supportWeeklySummaries.createdAt)],
            }),
            db
                .select({
                    count: sql<number>`count(${refunds.id})`,
                    amount: sql<number>`coalesce(sum(${refunds.amount}), 0)`,
                })
                .from(refunds)
                .where(gte(refunds.createdAt, weekStart))
                .then((res) => res[0]),
            db
                .select({
                    reasonCode: refunds.reasonCode,
                    count: sql<number>`count(${refunds.id})`,
                    amount: sql<number>`coalesce(sum(${refunds.amount}), 0)`,
                })
                .from(refunds)
                .where(gte(refunds.createdAt, weekStart))
                .groupBy(refunds.reasonCode)
                .orderBy(sql`count(${refunds.id}) desc`)
                .limit(6),
            db
                .select({
                    delivered: sql<number>`count(case when ${orderShipments.status} = 'delivered' then 1 end)`,
                    rto: sql<number>`count(case when ${orderShipments.status} in ('rto_initiated', 'rto_delivered') then 1 end)`,
                })
                .from(orderShipments)
                .where(gte(orderShipments.updatedAt, weekStart))
                .then((res) => res[0]),
            db
                .select({
                    sessions: sql<number>`coalesce(sum(${analyticsDailyBehavior.sessions}), 0)`,
                    carts: sql<number>`coalesce(sum(${analyticsDailyBehavior.sessionsWithCart}), 0)`,
                    checkouts: sql<number>`coalesce(sum(${analyticsDailyBehavior.sessionsReachedCheckout}), 0)`,
                })
                .from(analyticsDailyBehavior)
                .where(
                    and(
                        gte(analyticsDailyBehavior.dateKey, weekStartKey),
                        lte(analyticsDailyBehavior.dateKey, weekEndKey)
                    )
                )
                .then((res) => res[0]),
            db.$count(
                monitoringAlerts,
                and(
                    gte(monitoringAlerts.createdAt, weekStart),
                    eq(monitoringAlerts.severity, "critical")
                )
            ),
            db
                .select({
                    functionName: sql<string>`coalesce(${monitoringAlerts.ownerRole}, ${monitoringAlerts.entityType}, 'unassigned')`,
                    count: sql<number>`count(${monitoringAlerts.id})`,
                })
                .from(monitoringAlerts)
                .where(
                    and(
                        gte(monitoringAlerts.createdAt, weekStart),
                        eq(monitoringAlerts.severity, "critical")
                    )
                )
                .groupBy(
                    sql`coalesce(${monitoringAlerts.ownerRole}, ${monitoringAlerts.entityType}, 'unassigned')`
                )
                .orderBy(sql`count(${monitoringAlerts.id}) desc`),
            db.execute(sql`
                select b.name as brand_name, coalesce(sum(o.total_amount), 0)::int as gmv
                from ${brands} b
                inner join ${products} p on p.brand_id = b.id
                inner join ${orderItems} oi on oi.product_id = p.id
                inner join ${orders} o on o.id = oi.order_id
                where o.created_at >= ${weekStartSql}
                  and o.status <> 'cancelled'
                  and o.payment_status <> 'failed'
                group by b.id, b.name
                order by gmv desc
                limit 5
            `),
            db.execute(sql`
                select b.name as brand_name, coalesce(sum(o.total_amount), 0)::int as gmv
                from ${brands} b
                inner join ${products} p on p.brand_id = b.id
                inner join ${orderItems} oi on oi.product_id = p.id
                inner join ${orders} o on o.id = oi.order_id
                where o.created_at >= ${weekStartSql}
                  and o.status <> 'cancelled'
                  and o.payment_status <> 'failed'
                group by b.id, b.name
                order by gmv asc
                limit 5
            `),
        ]);

        const currentGmv = Number(currentWeek.gmv ?? 0);
        const previousGmv = Number(previousWeek.gmv ?? 0);
        const priorFourWeekGmvAvg = Number(priorFourWeek.gmv ?? 0) / 4;
        const gmvWoW =
            previousGmv === 0
                ? currentGmv > 0
                    ? 100
                    : 0
                : ((currentGmv - previousGmv) / previousGmv) * 100;
        const gmvVsPriorFourWeekAvg =
            priorFourWeekGmvAvg === 0
                ? currentGmv > 0
                    ? 100
                    : 0
                : ((currentGmv - priorFourWeekGmvAvg) /
                      priorFourWeekGmvAvg) *
                  100;
        const orderCount = Number(currentWeek.orderCount ?? 0);
        const previousOrderCount = Number(previousWeek.orderCount ?? 0);
        const orderVolumeWoW =
            previousOrderCount === 0
                ? orderCount > 0
                    ? 100
                    : 0
                : ((orderCount - previousOrderCount) / previousOrderCount) *
                  100;
        const aov = Number(currentWeek.aov ?? 0);
        const previousAov = Number(previousWeek.aov ?? 0);
        const aovWoW =
            previousAov === 0
                ? aov > 0
                    ? 100
                    : 0
                : ((aov - previousAov) / previousAov) * 100;
        const supportSummary = Array.from(
            supportStats as Iterable<Record<string, unknown>>
        )[0] ?? {};
        const deliveredShipments = Number(rtoStats.delivered ?? 0);
        const rtoShipments = Number(rtoStats.rto ?? 0);
        const shipmentOutcomeCount = deliveredShipments + rtoShipments;
        const funnelSessions = Number(funnelStats.sessions ?? 0);
        const funnelCarts = Number(funnelStats.carts ?? 0);
        const funnelCheckouts = Number(funnelStats.checkouts ?? 0);

        return {
            weekStart: weekStart.toISOString().slice(0, 10),
            weekEnd: today.toISOString().slice(0, 10),
            gmv: currentGmv,
            previousGmv,
            priorFourWeekGmvAvg,
            gmvWoW,
            gmvVsPriorFourWeekAvg,
            orderCount,
            previousOrderCount,
            orderVolumeWoW,
            aov,
            previousAov,
            aovWoW,
            customerCount: Number(currentWeek.customerCount ?? 0),
            repeatCustomers: Number(currentWeek.repeatCustomers ?? 0),
            conversionFunnel: {
                sessions: funnelSessions,
                carts: funnelCarts,
                checkouts: funnelCheckouts,
                paid: orderCount,
                cartRate:
                    funnelSessions === 0 ? 0 : funnelCarts / funnelSessions,
                checkoutRate:
                    funnelCarts === 0 ? 0 : funnelCheckouts / funnelCarts,
                paidRate:
                    funnelCheckouts === 0
                        ? 0
                        : orderCount / funnelCheckouts,
            },
            cacByChannel: [
                { channel: "Meta", value: "Needs ad spend import" },
                { channel: "Google", value: "Needs ad spend import" },
                { channel: "Organic", value: "No paid spend" },
                { channel: "Partnerships", value: "Needs spend import" },
            ],
            roasByChannel: [
                { channel: "Meta", value: "Needs ad spend import" },
                { channel: "Google", value: "Needs ad spend import" },
                { channel: "Organic", value: "No paid spend" },
                { channel: "Partnerships", value: "Needs spend import" },
            ],
            activeBrands,
            sellingBrandsThisWeek: Number(sellingBrandsThisWeek),
            sellingBrandsPreviousWeek: Number(sellingBrandsPreviousWeek),
            supportOpenTickets: supportAdminOpen + supportUserOpen,
            supportMetrics: {
                ticketsOpened: Number(
                    supportSummary.tickets_opened ??
                        latestSupportSummary?.ticketsOpened ??
                        0
                ),
                ticketsResolved: Number(
                    supportSummary.tickets_resolved ??
                        latestSupportSummary?.ticketsResolved ??
                        0
                ),
                avgFirstResponseMinutes: Number(
                    supportSummary.avg_first_response_minutes ??
                        latestSupportSummary?.avgFirstResponseMinutes ??
                        0
                ),
                avgResolutionMinutes: Number(
                    supportSummary.avg_resolution_minutes ?? 0
                ),
                csatAverage:
                    supportSummary.csat_average ??
                    latestSupportSummary?.csatAverage ??
                    null,
            },
            refundRate:
                orderCount === 0
                    ? 0
                    : Number(refundStats.count ?? 0) / orderCount,
            refundCount: Number(refundStats.count ?? 0),
            refundAmount: Number(refundStats.amount ?? 0),
            refundReasons: refundReasonRows.map((row) => ({
                reasonCode: row.reasonCode ?? "Uncoded",
                count: Number(row.count ?? 0),
                amount: Number(row.amount ?? 0),
            })),
            rtoRate:
                shipmentOutcomeCount === 0
                    ? 0
                    : rtoShipments / shipmentOutcomeCount,
            deliveredShipments,
            rtoShipments,
            slaBreachCount: slaBreaches,
            slaBreachesByFunction: slaBreachesByFunction.map((row) => ({
                functionName: String(row.functionName ?? "unassigned"),
                count: Number(row.count ?? 0),
            })),
            topBrands: Array.from(
                topBrands as Iterable<Record<string, unknown>>
            ).map((row) => ({
                name: String(row.brand_name ?? "Unknown"),
                gmv: Number(row.gmv ?? 0),
            })),
            bottomBrands: Array.from(
                bottomBrands as Iterable<Record<string, unknown>>
            ).map((row) => ({
                name: String(row.brand_name ?? "Unknown"),
                gmv: Number(row.gmv ?? 0),
            })),
        };
    }

    async getBrandHealth() {
        const now = new Date();
        const today = startOfDay();
        const weekStart = new Date(today.getTime() - 6 * DAY);
        const previousFourWeekStart = new Date(weekStart.getTime() - 28 * DAY);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * DAY);
        const sixtyDaysFromNow = new Date(now.getTime() + 60 * DAY);
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * DAY);

        const [
            activeBrands,
            pausedBrands,
            pendingVerification,
            activeProducts,
            lowInventoryVariants,
            requestPipelineRows,
            brandStageRows,
            daysToGoLiveRows,
            noOrderRows,
            decliningSalesRows,
            certExpiryRows,
            contractExpiryRows,
            brandTicketRows,
            nonResponsiveRows,
        ] = await Promise.all([
            db.$count(brands, eq(brands.isActive, true)),
            db.$count(brands, eq(brands.isActive, false)),
            db.$count(brands, ne(brands.confidentialVerificationStatus, "approved")),
            db.$count(
                products,
                and(
                    eq(products.isActive, true),
                    eq(products.isDeleted, false),
                    eq(products.isPublished, true)
                )
            ),
            db.$count(
                productVariants,
                and(
                    gte(productVariants.quantity, 0),
                    lt(productVariants.quantity, 5)
                )
            ),
            db
                .select({
                    status: brandRequests.status,
                    count: sql<number>`count(${brandRequests.id})`,
                })
                .from(brandRequests)
                .groupBy(brandRequests.status),
            db.execute(sql`
                select stage, count(*)::int as count
                from (
                    select 'outreach' as stage
                    from ${brandRequests}
                    where status = 'pending'
                    union all
                    select 'discussion' as stage
                    from ${brandRequests}
                    where status = 'approved'
                    union all
                    select
                        case
                            when b.contract_signed_at is null then 'contract'
                            when b.confidential_verification_status <> 'approved' then 'onboarding'
                            else 'live'
                        end as stage
                    from ${brands} b
                ) stages
                group by stage
            `),
            db.execute(sql`
                select
                    b.id,
                    b.name,
                    b.created_at,
                    b.contract_signed_at,
                    b.confidential_verification_status,
                    min(o.created_at) as first_order_at,
                    case
                        when min(o.created_at) is not null then extract(day from min(o.created_at) - b.created_at)::int
                        else extract(day from ${toSqlDateTime(now)}::timestamp - b.created_at)::int
                    end as days_to_go_live
                from ${brands} b
                left join ${products} p on p.brand_id = b.id
                left join ${orderItems} oi on oi.product_id = p.id
                left join ${orders} o on o.id = oi.order_id
                  and o.status <> 'cancelled'
                  and o.payment_status <> 'failed'
                where b.is_active = true
                group by b.id, b.name, b.created_at, b.contract_signed_at, b.confidential_verification_status
                order by days_to_go_live desc
                limit 8
            `),
            db.execute(sql`
                with recent_order_brands as (
                    select distinct p.brand_id
                    from ${orders} o
                    inner join ${orderItems} oi on oi.order_id = o.id
                    inner join ${products} p on p.id = oi.product_id
                    where o.created_at >= ${toSqlDateTime(thirtyDaysAgo)}
                      and o.status <> 'cancelled'
                      and o.payment_status <> 'failed'
                )
                select b.id, b.name, b.created_at
                from ${brands} b
                left join recent_order_brands rob on rob.brand_id = b.id
                where b.is_active = true
                  and rob.brand_id is null
                order by b.created_at asc
                limit 10
            `),
            db.execute(sql`
                with brand_sales as (
                    select
                        p.brand_id,
                        coalesce(sum(case when o.created_at >= ${toSqlDateTime(weekStart)} then o.total_amount else 0 end), 0)::int as current_week_gmv,
                        coalesce(sum(case when o.created_at >= ${toSqlDateTime(previousFourWeekStart)} and o.created_at < ${toSqlDateTime(weekStart)} then o.total_amount else 0 end), 0)::int as prior_4w_gmv
                    from ${orders} o
                    inner join ${orderItems} oi on oi.order_id = o.id
                    inner join ${products} p on p.id = oi.product_id
                    where o.created_at >= ${toSqlDateTime(previousFourWeekStart)}
                      and o.status <> 'cancelled'
                      and o.payment_status <> 'failed'
                    group by p.brand_id
                )
                select
                    b.id,
                    b.name,
                    bs.current_week_gmv,
                    (bs.prior_4w_gmv / 4)::int as prior_4w_avg,
                    case
                        when bs.prior_4w_gmv = 0 then 0
                        else ((bs.current_week_gmv - (bs.prior_4w_gmv / 4.0)) / (bs.prior_4w_gmv / 4.0)) * 100
                    end as decline_pct
                from brand_sales bs
                inner join ${brands} b on b.id = bs.brand_id
                where b.is_active = true
                  and bs.prior_4w_gmv > 0
                  and bs.current_week_gmv < (bs.prior_4w_gmv / 4.0)
                order by decline_pct asc
                limit 10
            `),
            db.execute(sql`
                select
                    b.id,
                    b.name,
                    bc.sustainability_certificate_expires_at as expires_at,
                    case
                        when bc.sustainability_certificate_expires_at < ${toSqlDateTime(thirtyDaysFromNow)} then '30'
                        when bc.sustainability_certificate_expires_at < ${toSqlDateTime(sixtyDaysFromNow)} then '60'
                        else '90'
                    end as window
                from ${brandConfidentials} bc
                inner join ${brands} b on b.id = bc.id
                where bc.sustainability_certificate_expires_at is not null
                  and bc.sustainability_certificate_expires_at < ${toSqlDateTime(ninetyDaysFromNow)}
                order by bc.sustainability_certificate_expires_at asc
            `),
            db.execute(sql`
                select
                    id,
                    name,
                    contract_expires_at as expires_at,
                    case
                        when contract_expires_at < ${toSqlDateTime(thirtyDaysFromNow)} then '30'
                        when contract_expires_at < ${toSqlDateTime(sixtyDaysFromNow)} then '60'
                        else '90'
                    end as window
                from ${brands}
                where contract_expires_at is not null
                  and contract_expires_at < ${toSqlDateTime(ninetyDaysFromNow)}
                order by contract_expires_at asc
            `),
            db
                .select({
                    id: supportTickets.id,
                    brandId: supportTickets.brandId,
                    brandName: brands.name,
                    title: supportTickets.title,
                    status: supportTickets.status,
                    priority: supportTickets.priority,
                    createdAt: supportTickets.createdAt,
                })
                .from(supportTickets)
                .leftJoin(brands, eq(brands.id, supportTickets.brandId))
                .where(gte(supportTickets.createdAt, thirtyDaysAgo))
                .orderBy(desc(supportTickets.createdAt))
                .limit(10),
            db.execute(sql`
                with last_order as (
                    select p.brand_id, max(o.created_at) as last_order_at
                    from ${orders} o
                    inner join ${orderItems} oi on oi.order_id = o.id
                    inner join ${products} p on p.id = oi.product_id
                    where o.status <> 'cancelled'
                      and o.payment_status <> 'failed'
                    group by p.brand_id
                ),
                last_ticket as (
                    select brand_id, max(created_at) as last_ticket_at
                    from ${supportTickets}
                    group by brand_id
                )
                select
                    b.id,
                    b.name,
                    lo.last_order_at,
                    lt.last_ticket_at,
                    greatest(coalesce(lo.last_order_at, b.created_at), coalesce(lt.last_ticket_at, b.created_at), b.updated_at) as last_activity_at
                from ${brands} b
                left join last_order lo on lo.brand_id = b.id
                left join last_ticket lt on lt.brand_id = b.id
                where b.is_active = true
                  and greatest(coalesce(lo.last_order_at, b.created_at), coalesce(lt.last_ticket_at, b.created_at), b.updated_at) < ${toSqlDateTime(fourteenDaysAgo)}
                order by last_activity_at asc
                limit 10
            `),
        ]);

        const stageCounts = new Map(
            Array.from(brandStageRows as Iterable<Record<string, unknown>>).map(
                (row) => [String(row.stage), Number(row.count ?? 0)]
            )
        );
        const pipelineStages = [
            "outreach",
            "discussion",
            "contract",
            "onboarding",
            "live",
        ].map((stage) => ({
            stage,
            count:
                stage === "live"
                    ? activeBrands
                    : Number(stageCounts.get(stage) ?? 0),
        }));
        const expiryBuckets = (
            rows: Iterable<Record<string, unknown>>
        ) => {
            const list = Array.from(rows).map((row) => ({
                id: String(row.id ?? ""),
                name: String(row.name ?? "Unknown"),
                expiresAt: row.expires_at
                    ? new Date(String(row.expires_at)).toISOString().slice(0, 10)
                    : "Not set",
                window: String(row.window ?? "90"),
            }));
            return {
                next30: list.filter((row) => row.window === "30"),
                next60: list.filter((row) => row.window === "60"),
                next90: list.filter((row) => row.window === "90"),
                all: list,
            };
        };
        const brandsWithOrders30d = Math.max(
            0,
            activeBrands -
                Array.from(noOrderRows as Iterable<Record<string, unknown>>)
                    .length
        );
        const supportTickets30d = brandTicketRows.length;
        const certExpiries = expiryBuckets(
            certExpiryRows as Iterable<Record<string, unknown>>
        );
        const contractExpiries = expiryBuckets(
            contractExpiryRows as Iterable<Record<string, unknown>>
        );

        return {
            owner: "KP",
            reviewCadence: "Every Monday morning",
            source: "Admin panel brand module",
            activeBrands,
            pausedBrands,
            pendingVerification,
            activeProducts,
            lowInventoryVariants,
            pipelineStages,
            requestPipeline: requestPipelineRows.map((row) => ({
                status: row.status,
                count: Number(row.count ?? 0),
            })),
            daysToGoLiveTarget: 14,
            daysToGoLive: Array.from(
                daysToGoLiveRows as Iterable<Record<string, unknown>>
            ).map((row) => ({
                id: String(row.id ?? ""),
                name: String(row.name ?? "Unknown"),
                createdAt: row.created_at
                    ? new Date(String(row.created_at)).toISOString().slice(0, 10)
                    : "Unknown",
                contractSignedAt: row.contract_signed_at
                    ? new Date(String(row.contract_signed_at))
                          .toISOString()
                          .slice(0, 10)
                    : null,
                verificationStatus: String(
                    row.confidential_verification_status ?? "idle"
                ),
                days: Number(row.days_to_go_live ?? 0),
                status:
                    Number(row.days_to_go_live ?? 0) > 14 ? "At risk" : "On track",
            })),
            brandsWithNoOrders30d: Array.from(
                noOrderRows as Iterable<Record<string, unknown>>
            ).map((row) => ({
                id: String(row.id ?? ""),
                name: String(row.name ?? "Unknown"),
                createdAt: row.created_at
                    ? new Date(String(row.created_at)).toISOString().slice(0, 10)
                    : "Unknown",
            })),
            decliningSales: Array.from(
                decliningSalesRows as Iterable<Record<string, unknown>>
            ).map((row) => ({
                id: String(row.id ?? ""),
                name: String(row.name ?? "Unknown"),
                currentWeekGmv: Number(row.current_week_gmv ?? 0),
                priorFourWeekAvg: Number(row.prior_4w_avg ?? 0),
                declinePct: Number(row.decline_pct ?? 0),
            })),
            certExpiries,
            contractExpiries,
            certExpiring30d: certExpiries.next30.length,
            contractExpiring30d: contractExpiries.next30.length,
            brandSideSupportTickets: brandTicketRows.map((row) => ({
                id: row.id,
                brandId: row.brandId,
                brandName: row.brandName ?? "Unknown brand",
                title: row.title,
                status: row.status,
                priority: row.priority ?? "normal",
                createdAt: row.createdAt
                    ? new Date(row.createdAt).toISOString().slice(0, 10)
                    : "Unknown",
            })),
            nonResponsiveBrands: Array.from(
                nonResponsiveRows as Iterable<Record<string, unknown>>
            ).map((row) => ({
                id: String(row.id ?? ""),
                name: String(row.name ?? "Unknown"),
                lastOrderAt: row.last_order_at
                    ? new Date(String(row.last_order_at)).toISOString().slice(0, 10)
                    : null,
                lastTicketAt: row.last_ticket_at
                    ? new Date(String(row.last_ticket_at)).toISOString().slice(0, 10)
                    : null,
                lastActivityAt: row.last_activity_at
                    ? new Date(String(row.last_activity_at))
                          .toISOString()
                          .slice(0, 10)
                    : null,
            })),
            supportTickets30d,
            brandsWithOrders30d,
            brandsWithNoOrders30dCount: Array.from(
                noOrderRows as Iterable<Record<string, unknown>>
            ).length,
            decliningSalesCount: Array.from(
                decliningSalesRows as Iterable<Record<string, unknown>>
            ).length,
            nonResponsiveBrandsCount: Array.from(
                nonResponsiveRows as Iterable<Record<string, unknown>>
            ).length,
            dataNotes: [
                "Pipeline stages are derived from brand_requests plus brand contract/verification/live status.",
                "Days-to-go-live uses brand created date to first valid order; in-progress brands use age so far.",
                "Non-responsive brands are a proxy from last order/support/admin update because no brand-login timestamp exists yet.",
            ],
        };
    }

    async getMarketingPerformanceTargets(): Promise<MarketingPerformanceTargets> {
        const defaults: MarketingPerformanceTargets = {
            roasGoal: numberSetting(
                process.env.MARKETING_CAMPAIGN_ROAS_GOAL,
                2,
                0
            ),
            cacGoalPaise: numberSetting(
                process.env.MARKETING_CAMPAIGN_CAC_GOAL_PAISE,
                150000,
                0
            ),
            reelsTarget: numberSetting(
                process.env.MARKETING_WEEKLY_REELS_TARGET,
                3,
                0
            ),
            postsTarget: numberSetting(
                process.env.MARKETING_WEEKLY_POSTS_TARGET,
                3,
                0
            ),
            blogsTarget: numberSetting(
                process.env.MARKETING_WEEKLY_BLOGS_TARGET,
                1,
                0
            ),
        };
        const saved = await db.query.monitoringSettings.findFirst({
            where: eq(monitoringSettings.key, MARKETING_TARGETS_SETTING_KEY),
        });
        const value = saved?.value ?? {};

        return {
            roasGoal: numberSetting(value.roasGoal, defaults.roasGoal, 0),
            cacGoalPaise: numberSetting(
                value.cacGoalPaise,
                defaults.cacGoalPaise,
                0
            ),
            reelsTarget: Math.round(
                numberSetting(value.reelsTarget, defaults.reelsTarget, 0)
            ),
            postsTarget: Math.round(
                numberSetting(value.postsTarget, defaults.postsTarget, 0)
            ),
            blogsTarget: Math.round(
                numberSetting(value.blogsTarget, defaults.blogsTarget, 0)
            ),
        };
    }

    async updateMarketingPerformanceTargets({
        targets,
        actorId,
    }: {
        targets: MarketingPerformanceTargets;
        actorId: string;
    }) {
        const safeTargets: MarketingPerformanceTargets = {
            roasGoal: numberSetting(targets.roasGoal, 2, 0),
            cacGoalPaise: Math.round(
                numberSetting(targets.cacGoalPaise, 150000, 0)
            ),
            reelsTarget: Math.round(numberSetting(targets.reelsTarget, 3, 0)),
            postsTarget: Math.round(numberSetting(targets.postsTarget, 3, 0)),
            blogsTarget: Math.round(numberSetting(targets.blogsTarget, 1, 0)),
        };

        await db
            .insert(monitoringSettings)
            .values({
                key: MARKETING_TARGETS_SETTING_KEY,
                value: safeTargets,
                updatedBy: actorId,
            })
            .onConflictDoUpdate({
                target: monitoringSettings.key,
                set: {
                    value: safeTargets,
                    updatedBy: actorId,
                    updatedAt: new Date(),
                },
            });

        await auditLogQueries.write({
            userId: actorId,
            actionType: "marketing_targets_updated",
            entityType: "monitoring_settings",
            entityId: MARKETING_TARGETS_SETTING_KEY,
            afterValue: safeTargets,
            reason: "Admin updated Marketing Performance dashboard targets",
        });

        return safeTargets;
    }

    async getMarketingPerformance() {
        const today = startOfDay();
        const weekStart = new Date(today.getTime() - 6 * DAY);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const weekStartKey = weekStart.toISOString().slice(0, 10);
        const weekEndKey = today.toISOString().slice(0, 10);
        const metaToken = process.env.META_ACCESS_TOKEN;
        const metaAdAccountId = process.env.META_AD_ACCOUNT_ID;
        const instagramBusinessAccountId =
            process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
        const graphVersion = process.env.META_GRAPH_API_VERSION || "v20.0";
        const targets = await this.getMarketingPerformanceTargets();
        const roasGoal = targets.roasGoal;
        const cacGoalPaise = targets.cacGoalPaise;
        const contentTargets = {
            reels: targets.reelsTarget,
            posts: targets.postsTarget,
            blogs: targets.blogsTarget,
        };

        const fetchMetaInsights = async (params: Record<string, string>) => {
            if (!metaToken || !metaAdAccountId) return [];

            const normalizedAccountId = metaAdAccountId.startsWith("act_")
                ? metaAdAccountId
                : `act_${metaAdAccountId}`;
            const url = new URL(
                `https://graph.facebook.com/${graphVersion}/${normalizedAccountId}/insights`
            );
            Object.entries({
                access_token: metaToken,
                time_range: JSON.stringify({
                    since: weekStartKey,
                    until: weekEndKey,
                }),
                ...params,
            }).forEach(([key, value]) => url.searchParams.set(key, value));

            try {
                const response = await fetch(url, {
                    next: { revalidate: 900 },
                });
                if (!response.ok) return [];
                const payload = (await response.json()) as {
                    data?: Array<Record<string, unknown>>;
                };
                return payload.data ?? [];
            } catch {
                return [];
            }
        };

        const readActionCount = (
            row: Record<string, unknown>,
            actionTypes: string[]
        ) => {
            const actions = Array.isArray(row.actions) ? row.actions : [];
            return actions.reduce((total, action) => {
                if (
                    typeof action === "object" &&
                    action &&
                    actionTypes.includes(
                        String(
                            (action as Record<string, unknown>).action_type ??
                                ""
                        )
                    )
                ) {
                    return (
                        total +
                        Number(
                            (action as Record<string, unknown>).value ?? 0
                        )
                    );
                }
                return total;
            }, 0);
        };

        const readActionValue = (
            row: Record<string, unknown>,
            actionTypes: string[]
        ) => {
            const values = Array.isArray(row.action_values)
                ? row.action_values
                : [];
            return values.reduce((total, action) => {
                if (
                    typeof action === "object" &&
                    action &&
                    actionTypes.includes(
                        String(
                            (action as Record<string, unknown>).action_type ??
                                ""
                        )
                    )
                ) {
                    return (
                        total +
                        Number(
                            (action as Record<string, unknown>).value ?? 0
                        ) *
                            100
                    );
                }
                return total;
            }, 0);
        };

        const [
            week,
            month,
            behavior,
            behaviorOverview,
            trafficRows,
            attributionRows,
            metaChannelRows,
            metaCreativeRows,
            metaCampaignRows,
            googleSummary,
            blogsPublishedThisWeek,
            instagramMedia,
            emailSends,
            partnershipRows,
            weeklyCustomers,
        ] = await Promise.all([
            db
                .select({
                    gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                    orders: sql<number>`count(${orders.id})`,
                    customers: sql<number>`count(distinct ${orders.userId})`,
                })
                .from(orders)
                .where(gte(orders.createdAt, weekStart))
                .then((res) => res[0]),
            db
                .select({
                    gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                    orders: sql<number>`count(${orders.id})`,
                    customers: sql<number>`count(distinct ${orders.userId})`,
                })
                .from(orders)
                .where(gte(orders.createdAt, monthStart))
                .then((res) => res[0]),
            db
                .select({
                    sessions: sql<number>`coalesce(sum(${analyticsDailyBehavior.sessions}), 0)`,
                    visitors: sql<number>`coalesce(sum(${analyticsDailyBehavior.visitors}), 0)`,
                    carts: sql<number>`coalesce(sum(${analyticsDailyBehavior.sessionsWithCart}), 0)`,
                    checkouts: sql<number>`coalesce(sum(${analyticsDailyBehavior.sessionsReachedCheckout}), 0)`,
                })
                .from(analyticsDailyBehavior)
                .where(
                    and(
                        gte(analyticsDailyBehavior.dateKey, weekStartKey),
                        lte(analyticsDailyBehavior.dateKey, weekEndKey)
                    )
                )
                .then((res) => res[0]),
            getPostHogBehaviorOverview(weekStart, today),
            db
                .select({
                    source: analyticsLandingPageDaily.landingType,
                    sessions: sql<number>`coalesce(sum(${analyticsLandingPageDaily.sessions}), 0)`,
                    visitors: sql<number>`coalesce(sum(${analyticsLandingPageDaily.visitors}), 0)`,
                    carts: sql<number>`coalesce(sum(${analyticsLandingPageDaily.sessionsWithCart}), 0)`,
                    checkouts: sql<number>`coalesce(sum(${analyticsLandingPageDaily.sessionsReachedCheckout}), 0)`,
                })
                .from(analyticsLandingPageDaily)
                .where(
                    and(
                        gte(analyticsLandingPageDaily.dateKey, weekStartKey),
                        lte(analyticsLandingPageDaily.dateKey, weekEndKey)
                    )
                )
                .groupBy(analyticsLandingPageDaily.landingType)
                .orderBy(
                    desc(
                        sql<number>`coalesce(sum(${analyticsLandingPageDaily.sessions}), 0)`
                    )
                )
                .limit(8),
            getPostHogAttributionBreakdown(weekStart, today, 250),
            fetchMetaInsights({
                level: "account",
                fields: "spend,impressions,clicks,actions,action_values,purchase_roas",
            }),
            fetchMetaInsights({
                level: "ad",
                fields: "ad_id,ad_name,campaign_name,spend,impressions,clicks,actions,action_values,purchase_roas",
                limit: "20",
            }),
            fetchMetaInsights({
                level: "campaign",
                fields: "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,purchase_roas",
                limit: "20",
            }),
            getGoogleAdsSummary(weekStartKey, weekEndKey),
            db.$count(
                blogs,
                and(
                    eq(blogs.isPublished, true),
                    gte(blogs.publishedAt, weekStart)
                )
            ),
            (async () => {
                if (!metaToken || !instagramBusinessAccountId) return [];
                const url = new URL(
                    `https://graph.facebook.com/${graphVersion}/${instagramBusinessAccountId}/media`
                );
                url.searchParams.set("access_token", metaToken);
                url.searchParams.set(
                    "fields",
                    "id,caption,media_type,timestamp,permalink,like_count,comments_count"
                );
                url.searchParams.set("limit", "50");
                try {
                    const response = await fetch(url, {
                        next: { revalidate: 900 },
                    });
                    if (!response.ok) return [];
                    const payload = (await response.json()) as {
                        data?: Array<Record<string, unknown>>;
                    };
                    return (payload.data ?? []).filter((item) => {
                        const timestamp = new Date(String(item.timestamp));
                        return timestamp >= weekStart;
                    });
                } catch {
                    return [];
                }
            })(),
            db
                .select({
                    campaignType: emailMessageLogs.campaignType,
                    sends: sql<number>`count(${emailMessageLogs.id})`,
                })
                .from(emailMessageLogs)
                .where(
                    and(
                        eq(emailMessageLogs.success, true),
                        gte(emailMessageLogs.sentAt, weekStart)
                    )
                )
                .groupBy(emailMessageLogs.campaignType),
            db.query.marketingPartnerships.findMany({
                orderBy: [desc(marketingPartnerships.createdAt)],
                limit: 50,
            }),
            db
                .select({
                    userId: orders.userId,
                })
                .from(orders)
                .where(gte(orders.createdAt, weekStart))
                .groupBy(orders.userId),
        ]);

        const purchaseActionTypes = [
            "purchase",
            "omni_purchase",
            "offsite_conversion.fb_pixel_purchase",
        ];
        const weekGmv = Number(week.gmv ?? 0);
        const weekCustomers = Number(week.customers ?? 0);
        const repeatCustomerRows = weeklyCustomers.length
            ? await db
                  .select({
                      userId: orders.userId,
                  })
                  .from(orders)
                  .where(
                      and(
                          inArray(
                              orders.userId,
                              weeklyCustomers.map((row) => row.userId)
                          ),
                          lt(orders.createdAt, weekStart)
                      )
                  )
                  .groupBy(orders.userId)
            : [];
        const repeatCustomerCount = repeatCustomerRows.length;
        const metaAccount = metaChannelRows[0] ?? {};
        const metaSpendPaise = Math.round(Number(metaAccount.spend ?? 0) * 100);
        const metaPurchases = readActionCount(metaAccount, purchaseActionTypes);
        const metaRevenuePaise = readActionValue(
            metaAccount,
            purchaseActionTypes
        );
        const organicTrafficSessions = Number(behavior.sessions ?? 0);
        const paidMetaClicks = Number(metaAccount.clicks ?? 0);
        const bounceRate =
            behaviorOverview.sessions === 0
                ? 0
                : behaviorOverview.bounceSessions / behaviorOverview.sessions;
        const browseRate = 1 - bounceRate;
        const cartRate =
            Number(behavior.sessions ?? 0) === 0
                ? 0
                : Number(behavior.carts ?? 0) / Number(behavior.sessions ?? 0);
        const checkoutRate =
            Number(behavior.sessions ?? 0) === 0
                ? 0
                : Number(behavior.checkouts ?? 0) / Number(behavior.sessions ?? 0);
        const purchaseRate =
            Number(behavior.sessions ?? 0) === 0
                ? 0
                : Number(week.orders ?? 0) / Number(behavior.sessions ?? 0);
        const returningCustomerRate =
            weekCustomers === 0 ? 0 : repeatCustomerCount / weekCustomers;
        const contentCounts = {
            reels: instagramMedia.filter(
                (item) => item.media_type === "REELS"
            ).length,
            posts: instagramMedia.filter(
                (item) => item.media_type !== "REELS"
            ).length,
            blogs: Number(blogsPublishedThisWeek),
        };

        const channelRows = [
            {
                channel: "Meta",
                spend: metaSpendPaise,
                revenue: metaRevenuePaise,
                conversions: metaPurchases,
                traffic: paidMetaClicks,
                source: metaToken && metaAdAccountId ? "Meta Ads API" : "Needs META_ACCESS_TOKEN + META_AD_ACCOUNT_ID",
            },
            {
                channel: "Google",
                spend: googleSummary.spend,
                revenue: googleSummary.revenue,
                conversions: googleSummary.conversions,
                traffic: googleSummary.traffic,
                source: googleSummary.source,
            },
            {
                channel: "Organic",
                spend: 0,
                revenue: weekGmv,
                conversions: Number(week.orders ?? 0),
                traffic: organicTrafficSessions,
                source: "Admin analytics + orders",
            },
            {
                channel: "Partnerships",
                spend: 0,
                revenue: 0,
                conversions: partnershipRows.filter(
                    (row) => row.status === "completed"
                ).length,
                traffic: partnershipRows.filter((row) => row.trackingUrl).length,
                source: "Tracked URLs + coupon-based partnership records",
            },
        ].map((row) => ({
            ...row,
            cac:
                row.spend === 0 || row.conversions === 0
                    ? null
                    : row.spend / row.conversions,
            roas: row.spend === 0 ? null : row.revenue / row.spend,
        }));

        const creativeRows = metaCreativeRows
            .map((row) => {
                const spend = Math.round(Number(row.spend ?? 0) * 100);
                const revenue = readActionValue(row, purchaseActionTypes);
                const purchases = readActionCount(row, purchaseActionTypes);
                const roas = spend === 0 ? 0 : revenue / spend;
                return {
                    id: String(row.ad_id ?? row.ad_name ?? "unknown"),
                    name: String(row.ad_name ?? "Unnamed creative"),
                    campaign: String(row.campaign_name ?? "Unassigned"),
                    spend,
                    impressions: Number(row.impressions ?? 0),
                    clicks: Number(row.clicks ?? 0),
                    purchases,
                    revenue,
                    roas,
                    ctr:
                        Number(row.impressions ?? 0) === 0
                            ? 0
                            : Number(row.clicks ?? 0) /
                              Number(row.impressions),
                };
            })
            .sort((a, b) => b.roas - a.roas);

        const campaignRows = metaCampaignRows
            .map((row) => {
                const spend = Math.round(Number(row.spend ?? 0) * 100);
                const revenue = readActionValue(row, purchaseActionTypes);
                const purchases = readActionCount(row, purchaseActionTypes);
                const cac = purchases === 0 ? null : spend / purchases;
                const roas = spend === 0 ? null : revenue / spend;
                const goalStatus =
                    (roas ?? 0) >= roasGoal ||
                    (cac !== null && cac <= cacGoalPaise)
                        ? "On goal"
                        : "Below goal";
                return {
                    id: String(row.campaign_id ?? row.campaign_name ?? "unknown"),
                    name: String(row.campaign_name ?? "Unnamed campaign"),
                    spend,
                    revenue,
                    purchases,
                    roas,
                    cac,
                    goalStatus,
                };
            })
            .sort((a, b) => b.spend - a.spend);

        const sourceMediumRows = Array.from(
            attributionRows.reduce<
                Map<
                    string,
                    {
                        source: string;
                        medium: string;
                        sessions: number;
                        visitors: number;
                    }
                >
            >((map, row) => {
                const key = `${row.source}::${row.medium}`;
                const existing = map.get(key) ?? {
                    source: row.source,
                    medium: row.medium,
                    sessions: 0,
                    visitors: 0,
                };
                existing.sessions += row.sessions;
                existing.visitors += row.visitors;
                map.set(key, existing);
                return map;
            }, new Map())
        )
            .map(([, value]) => value)
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10);

        const landingPerformanceByCampaign = Array.from(
            attributionRows.reduce<
                Map<
                    string,
                    {
                        campaign: string;
                        landingPath: string;
                        sessions: number;
                        visitors: number;
                    }
                >
            >((map, row) => {
                const key = `${row.campaign}::${row.landingPath}`;
                const existing = map.get(key) ?? {
                    campaign: row.campaign,
                    landingPath: row.landingPath,
                    sessions: 0,
                    visitors: 0,
                };
                existing.sessions += row.sessions;
                existing.visitors += row.visitors;
                map.set(key, existing);
                return map;
            }, new Map())
        )
            .map(([, value]) => value)
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10);

        const topTrafficContributors = Array.from(
            attributionRows.reduce<
                Map<string, { campaign: string; sessions: number; visitors: number }>
            >((map, row) => {
                const key = row.campaign;
                const existing = map.get(key) ?? {
                    campaign: row.campaign,
                    sessions: 0,
                    visitors: 0,
                };
                existing.sessions += row.sessions;
                existing.visitors += row.visitors;
                map.set(key, existing);
                return map;
            }, new Map())
        )
            .map(([, value]) => value)
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10);

        const partnershipPerformance = {
            total: partnershipRows.length,
            planned: partnershipRows.filter((row) => row.status === "planned")
                .length,
            live: partnershipRows.filter((row) => row.status === "live").length,
            completed: partnershipRows.filter((row) => row.status === "completed")
                .length,
            withCouponCode: partnershipRows.filter((row) => row.couponCode).length,
            withTrackingUrl: partnershipRows.filter((row) => row.trackingUrl)
                .length,
        };

        const totalEmailSends = emailSends.reduce(
            (sum, row) => sum + Number(row.sends ?? 0),
            0
        );

        return {
            owner: "PS reviews weekly with Performance Marketing freelancer",
            source: "Admin panel + ad platform data",
            reviewCadence: "Weekly with freelancer",
            weekStart: weekStartKey,
            weekEnd: weekEndKey,
            gmvWtd: weekGmv,
            ordersWtd: Number(week.orders ?? 0),
            customersWtd: weekCustomers,
            gmvMtd: Number(month.gmv ?? 0),
            ordersMtd: Number(month.orders ?? 0),
            customersMtd: Number(month.customers ?? 0),
            kpis: {
                sessions: Number(behavior.sessions ?? 0),
                visitors: Number(behavior.visitors ?? 0),
                browseRate,
                cartRate,
                checkoutRate,
                purchaseRate,
                returningCustomerRate,
                emailSends: totalEmailSends,
            },
            totalSpend: channelRows.reduce((total, row) => total + row.spend, 0),
            blendedCac:
                channelRows.reduce((total, row) => total + row.spend, 0) === 0 ||
                weekCustomers === 0
                    ? null
                    : channelRows.reduce((total, row) => total + row.spend, 0) /
                      weekCustomers,
            blendedRoas:
                channelRows.reduce((total, row) => total + row.spend, 0) === 0
                    ? null
                    : weekGmv /
                      channelRows.reduce((total, row) => total + row.spend, 0),
            trafficBySource: Array.from(
                trafficRows as Iterable<Record<string, unknown>>
            ).map((row) => {
                const sessions = Number(row.sessions ?? 0);
                const checkouts = Number(row.checkouts ?? 0);
                return {
                    source: String(row.source ?? "unknown"),
                    sessions,
                    visitors: Number(row.visitors ?? 0),
                    carts: Number(row.carts ?? 0),
                    checkouts,
                    conversionRate:
                        sessions === 0
                            ? 0
                            : Number(week.orders ?? 0) / sessions,
                    checkoutRate: sessions === 0 ? 0 : checkouts / sessions,
                };
            }),
            conversionBySource: Array.from(
                trafficRows as Iterable<Record<string, unknown>>
            ).map((row) => {
                const sessions = Number(row.sessions ?? 0);
                return {
                    source: String(row.source ?? "unknown"),
                    conversionRate:
                        sessions === 0
                            ? 0
                            : Number(week.orders ?? 0) / sessions,
                };
            }),
            sourceMediumPerformance: sourceMediumRows,
            landingPerformanceByCampaign,
            topTrafficContributors,
            channelPerformance: channelRows,
            topCreatives: creativeRows.slice(0, 5),
            underperformingCreatives: creativeRows
                .filter((row) => row.spend > 0 && row.roas < roasGoal)
                .sort((a, b) => b.spend - a.spend)
                .slice(0, 5),
            contentOutput: [
                {
                    type: "Reels",
                    count: contentCounts.reels,
                    target: contentTargets.reels,
                    source:
                        metaToken && instagramBusinessAccountId
                            ? "Instagram Graph API"
                            : "Needs META_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID",
                },
                {
                    type: "Posts",
                    count: contentCounts.posts,
                    target: contentTargets.posts,
                    source:
                        metaToken && instagramBusinessAccountId
                            ? "Instagram Graph API"
                            : "Needs META_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID",
                },
                {
                    type: "Blogs",
                    count: contentCounts.blogs,
                    target: contentTargets.blogs,
                    source: "blogs table",
                },
            ],
            campaignPerformance: campaignRows,
            emailSends: {
                total: totalEmailSends,
                byCampaignType: emailSends.map((row) => ({
                    campaignType: String(row.campaignType ?? "unknown"),
                    sends: Number(row.sends ?? 0),
                })),
            },
            partnerships: partnershipPerformance,
            goals: {
                roas: roasGoal,
                cac: cacGoalPaise,
                reelsTarget: targets.reelsTarget,
                postsTarget: targets.postsTarget,
                blogsTarget: targets.blogsTarget,
            },
            integrations: {
                metaAds:
                    metaToken && metaAdAccountId
                        ? "connected"
                        : "missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID",
                instagram:
                    metaToken && instagramBusinessAccountId
                        ? "connected"
                        : "missing META_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID",
                googleAds: googleSummary.status,
            },
        };
    }

    async getMonthlyStrategic() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );
        const lastMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const monthStartSql = toSqlDateTime(monthStart);
        const nextMonthStartSql = toSqlDateTime(nextMonthStart);
        const lastMonthStartSql = toSqlDateTime(lastMonthStart);
        const sixMonthsAgoSql = toSqlDateTime(sixMonthsAgo);

        const current = await db
            .select({
                gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                orderCount: sql<number>`count(${orders.id})`,
                customerCount: sql<number>`count(distinct ${orders.userId})`,
            })
            .from(orders)
            .where(gte(orders.createdAt, monthStart))
            .then((res) => res[0]);
        const lastMonth = await db
            .select({
                gmv: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
                orderCount: sql<number>`count(${orders.id})`,
                customerCount: sql<number>`count(distinct ${orders.userId})`,
            })
            .from(orders)
            .where(
                and(
                    gte(orders.createdAt, lastMonthStart),
                    lt(orders.createdAt, monthStart)
                )
            )
            .then((res) => res[0]);
        const refundCount = await db.$count(
            refunds,
            gte(refunds.createdAt, monthStart)
        );
        const complianceExportsThisMonth = await db.$count(
            complianceExportRuns,
            gte(complianceExportRuns.createdAt, monthStart)
        );
        const openCriticalAlerts = await db.$count(
            monitoringAlerts,
            and(
                eq(monitoringAlerts.severity, "critical"),
                ne(monitoringAlerts.status, "resolved")
            )
        );
        const [
            cohortRows,
            brandChurnRows,
            contributionRows,
            categoryRows,
            categoryMixRows,
            complianceRows,
            sustainabilityRows,
        ] = await Promise.all([
            db.execute(sql`
                with first_orders as (
                    select user_id, date_trunc('month', min(created_at)) as cohort_month
                    from ${orders}
                    where status <> 'cancelled' and payment_status <> 'failed'
                    group by user_id
                ),
                cohort_users as (
                    select *
                    from first_orders
                    where cohort_month >= date_trunc('month', ${sixMonthsAgoSql}::timestamp)
                      and cohort_month < date_trunc('month', ${nextMonthStartSql}::timestamp)
                ),
                orders_by_user_month as (
                    select distinct user_id, date_trunc('month', created_at) as order_month
                    from ${orders}
                    where status <> 'cancelled' and payment_status <> 'failed'
                )
                select
                    to_char(cu.cohort_month, 'YYYY-MM') as cohort,
                    count(*)::int as m0_users,
                    count(distinct case when obum.order_month = cu.cohort_month + interval '1 month' then cu.user_id end)::int as m1_users,
                    count(distinct case when obum.order_month = cu.cohort_month + interval '2 months' then cu.user_id end)::int as m2_users,
                    count(distinct case when obum.order_month = cu.cohort_month + interval '3 months' then cu.user_id end)::int as m3_users
                from cohort_users cu
                left join orders_by_user_month obum on obum.user_id = cu.user_id
                group by cu.cohort_month
                order by cu.cohort_month desc
                limit 6
            `),
            db.execute(sql`
                with prior_active as (
                    select distinct p.brand_id
                    from ${orders} o
                    inner join ${orderItems} oi on oi.order_id = o.id
                    inner join ${products} p on p.id = oi.product_id
                    where o.created_at >= ${lastMonthStartSql}
                      and o.created_at < ${monthStartSql}
                      and o.status <> 'cancelled'
                      and o.payment_status <> 'failed'
                ),
                current_active as (
                    select distinct p.brand_id
                    from ${orders} o
                    inner join ${orderItems} oi on oi.order_id = o.id
                    inner join ${products} p on p.id = oi.product_id
                    where o.created_at >= ${monthStartSql}
                      and o.status <> 'cancelled'
                      and o.payment_status <> 'failed'
                )
                select
                    count(pa.brand_id)::int as prior_active,
                    count(case when ca.brand_id is null then 1 end)::int as churned
                from prior_active pa
                left join current_active ca on ca.brand_id = pa.brand_id
            `),
            db.execute(sql`
                select
                    coalesce(sum(o.total_amount), 0)::int as revenue,
                    coalesce(sum(coalesce(p.cost_per_item, pv.cost_per_item, 0) * oi.quantity), 0)::int as product_cost,
                    coalesce(sum(o.delivery_amount), 0)::int as shipping,
                    count(distinct o.id)::int as orders_count
                from ${orders} o
                inner join ${orderItems} oi on oi.order_id = o.id
                inner join ${products} p on p.id = oi.product_id
                left join ${productVariants} pv on pv.id = oi.variant_id
                where o.created_at >= ${monthStartSql}
                  and o.status <> 'cancelled'
                  and o.payment_status <> 'failed'
            `),
            db.execute(sql`
                select
                    c.name as category_name,
                    coalesce(sum(o.total_amount), 0)::int as revenue,
                    coalesce(sum(coalesce(p.cost_per_item, pv.cost_per_item, 0) * oi.quantity), 0)::int as product_cost,
                    count(distinct o.id)::int as orders_count
                from ${orders} o
                inner join ${orderItems} oi on oi.order_id = o.id
                inner join ${products} p on p.id = oi.product_id
                left join ${productVariants} pv on pv.id = oi.variant_id
                inner join ${categories} c on c.id = p.category_id
                where o.created_at >= ${monthStartSql}
                  and o.status <> 'cancelled'
                  and o.payment_status <> 'failed'
                group by c.id, c.name
                order by revenue desc
                limit 6
            `),
            db.execute(sql`
                select
                    c.name as category_name,
                    coalesce(sum(case when o.created_at >= ${monthStartSql} then o.total_amount else 0 end), 0)::int as current_revenue,
                    coalesce(sum(case when o.created_at >= ${lastMonthStartSql} and o.created_at < ${monthStartSql} then o.total_amount else 0 end), 0)::int as previous_revenue
                from ${orders} o
                inner join ${orderItems} oi on oi.order_id = o.id
                inner join ${products} p on p.id = oi.product_id
                inner join ${categories} c on c.id = p.category_id
                where o.created_at >= ${lastMonthStartSql}
                  and o.status <> 'cancelled'
                  and o.payment_status <> 'failed'
                group by c.id, c.name
                order by current_revenue desc
                limit 6
            `),
            db.execute(sql`
                select
                    count(case when entity_type in ('compliance_export', 'access_review') then 1 end)::int as evidence_events,
                    count(case when entity_type = 'compliance_export' then 1 end)::int as compliance_exports,
                    count(case when entity_type = 'access_review' then 1 end)::int as access_reviews
                from ${auditLogs}
                where timestamp_utc >= ${monthStartSql}
            `),
            db.execute(sql`
                select
                    count(*)::int as live_products,
                    count(case when nullif(sustainability_certificate, '') is not null then 1 end)::int as products_with_cert,
                    count(case when verification_status = 'approved' then 1 end)::int as approved_products
                from ${products}
                where is_deleted = false
                  and is_active = true
                  and is_published = true
            `),
        ]);

        const contribution =
            Array.from(
                contributionRows as Iterable<Record<string, unknown>>
            )[0] ?? {};
        const revenue = Number(contribution.revenue ?? 0);
        const productCost = Number(contribution.product_cost ?? 0);
        const shipping = Number(contribution.shipping ?? 0);
        const contributionMargin = revenue - productCost - shipping;
        const contributionOrderCount = Number(contribution.orders_count ?? 0);
        const brandChurn =
            Array.from(
                brandChurnRows as Iterable<Record<string, unknown>>
            )[0] ?? {};
        const priorActiveBrands = Number(brandChurn.prior_active ?? 0);
        const churnedBrands = Number(brandChurn.churned ?? 0);
        const compliance =
            Array.from(
                complianceRows as Iterable<Record<string, unknown>>
            )[0] ?? {};
        const sustainability =
            Array.from(
                sustainabilityRows as Iterable<Record<string, unknown>>
            )[0] ?? {};
        const liveProducts = Number(sustainability.live_products ?? 0);
        const productsWithCert = Number(sustainability.products_with_cert ?? 0);
        const approvedProducts = Number(sustainability.approved_products ?? 0);
        const currentGmv = Number(current.gmv ?? 0);
        const previousGmv = Number(lastMonth.gmv ?? 0);
        const currentOrderCount = Number(current.orderCount ?? 0);
        const currentCustomerCount = Number(current.customerCount ?? 0);
        const previousOrderCount = Number(lastMonth.orderCount ?? 0);
        const gmvMoM =
            previousGmv === 0
                ? currentGmv > 0
                    ? 100
                    : 0
                : ((currentGmv - previousGmv) / previousGmv) * 100;
        const orderMoM =
            previousOrderCount === 0
                ? currentOrderCount > 0
                    ? 100
                    : 0
                : ((currentOrderCount - previousOrderCount) /
                      previousOrderCount) *
                  100;
        const contributionMarginRate =
            revenue === 0 ? 0 : contributionMargin / revenue;
        const categoryMixTotal = Array.from(
            categoryMixRows as Iterable<Record<string, unknown>>
        ).reduce(
            (total, row) => total + Number(row.current_revenue ?? 0),
            0
        );

        return {
            monthLabel: monthStart.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
            }),
            previousMonthLabel: lastMonthStart.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
            }),
            reviewCadence: "1st Monday 10am",
            timeToReview: "90 minutes",
            owner: "Each founder presents their function",
            source: "Composite from all modules",
            currentMonth: {
                gmv: currentGmv,
                orderCount: currentOrderCount,
                customerCount: currentCustomerCount,
            },
            previousMonth: {
                gmv: previousGmv,
                orderCount: previousOrderCount,
                customerCount: Number(lastMonth.customerCount ?? 0),
            },
            gmvMoM,
            orderMoM,
            refundRate:
                currentOrderCount === 0
                    ? 0
                    : Number(refundCount) / currentOrderCount,
            complianceExportsThisMonth,
            openCriticalAlerts,
            cohortRetention: Array.from(
                cohortRows as Iterable<Record<string, unknown>>
            ).map((row) => ({
                cohort: String(row.cohort ?? ""),
                m0Users: Number(row.m0_users ?? 0),
                m1Rate:
                    Number(row.m0_users ?? 0) === 0
                        ? 0
                        : Number(row.m1_users ?? 0) / Number(row.m0_users),
                m2Rate:
                    Number(row.m0_users ?? 0) === 0
                        ? 0
                        : Number(row.m2_users ?? 0) / Number(row.m0_users),
                m3Rate:
                    Number(row.m0_users ?? 0) === 0
                        ? 0
                        : Number(row.m3_users ?? 0) / Number(row.m0_users),
            })),
            brandChurnRate:
                priorActiveBrands === 0 ? 0 : churnedBrands / priorActiveBrands,
            churnedBrands,
            priorActiveBrands,
            contributionMarginPerOrder:
                contributionOrderCount === 0
                    ? 0
                    : contributionMargin / contributionOrderCount,
            contributionMargin,
            contributionMarginRate,
            contributionBreakdown: {
                revenue,
                productCost,
                shipping,
                gateway: 0,
                packaging: 0,
                platformFee: 0,
                orderCount: contributionOrderCount,
                note: "Platform fee, gateway, and packaging inputs are not stored yet; current contribution subtracts product cost and delivery amount from paid order revenue.",
            },
            grossMarginByCategory: Array.from(
                categoryRows as Iterable<Record<string, unknown>>
            ).map((row) => {
                const categoryRevenue = Number(row.revenue ?? 0);
                const categoryCost = Number(row.product_cost ?? 0);
                return {
                    category: String(row.category_name ?? "Uncategorized"),
                    revenue: categoryRevenue,
                    productCost: categoryCost,
                    grossMargin:
                        categoryRevenue === 0
                            ? 0
                            : (categoryRevenue - categoryCost) /
                              categoryRevenue,
                };
            }),
            categoryMixEvolution: Array.from(
                categoryMixRows as Iterable<Record<string, unknown>>
            ).map((row) => {
                const currentRevenue = Number(row.current_revenue ?? 0);
                const previousRevenue = Number(row.previous_revenue ?? 0);
                return {
                    category: String(row.category_name ?? "Uncategorized"),
                    currentRevenue,
                    previousRevenue,
                    currentShare:
                        categoryMixTotal === 0
                            ? 0
                            : currentRevenue / categoryMixTotal,
                    revenueChange:
                        previousRevenue === 0
                            ? currentRevenue > 0
                                ? 100
                                : 0
                            : ((currentRevenue - previousRevenue) /
                                  previousRevenue) *
                              100,
                };
            }),
            headcountEfficiency: {
                value: currentGmv,
                fteEquivalent: 1,
                note: "Assumes 1 FTE-equivalent until headcount config is added",
            },
            runway: "Needs cash-on-hand and monthly burn finance inputs",
            complianceStatusSnapshot: {
                evidenceEvents: Number(compliance.evidence_events ?? 0),
                complianceExports: Number(compliance.compliance_exports ?? 0),
                accessReviews: Number(compliance.access_reviews ?? 0),
                openCriticalAlerts,
            },
            sustainabilityClaimsAudit: {
                liveProducts,
                productsWithCert,
                approvedProducts,
                certCoverage:
                    liveProducts === 0 ? 0 : productsWithCert / liveProducts,
                approvalCoverage:
                    liveProducts === 0 ? 0 : approvedProducts / liveProducts,
            },
        };
    }

    async buildComplianceExport(
        exportMonth: string,
        exportType: string
    ): Promise<ComplianceExportBuild> {
        const { start, end } = monthWindow(exportMonth);
        const auditHeaders = [
            "timestampUtc",
            "userId",
            "actionType",
            "entityType",
            "entityId",
            "reason",
        ];
        const refundHeaders = [
            "id",
            "orderId",
            "status",
            "amount",
            "reasonCode",
            "createdAt",
            "updatedAt",
        ];
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
                .where(
                    and(
                        gte(auditLogs.timestampUtc, start),
                        lt(auditLogs.timestampUtc, end),
                        inArray(auditLogs.entityType, types)
                    )
                );

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
                .where(
                    and(
                        gte(refunds.createdAt, start),
                        lt(refunds.createdAt, end)
                    )
                );
            return {
                rows,
                csv: toCsv(rows, refundHeaders),
                headers: refundHeaders,
                files: [
                    {
                        name: `${exportMonth}-refund-audit.csv`,
                        rowCount: rows.length,
                        headers: refundHeaders,
                    },
                ],
            };
        }

        const exportMap: Record<string, string[]> = {
            "brand-actions": ["brand", "brand_request", "brand_confidential"],
            "access-changes": ["user", "role", "user_role", "access_review"],
            "manual-overrides": ["manual_override", "order", "refund"],
            "sustainability-claims": ["product", "brand_confidential"],
            "data-deletion-requests": [
                "customer_account",
                "data_deletion_request",
            ],
            "customer-escalations": ["support_ticket", "user_support_ticket"],
            alerts: ["monitoring_alert", "alert"],
        };
        const rows = await auditByTypes(
            exportMap[exportType] ?? exportMap.alerts
        );
        return {
            rows,
            csv: toCsv(rows, auditHeaders),
            headers: auditHeaders,
            files: [
                {
                    name: `${exportMonth}-${exportType}.csv`,
                    rowCount: rows.length,
                    headers: auditHeaders,
                },
            ],
        };
    }

    async generateComplianceExport(
        exportMonth: string,
        exportType: string,
        actorId?: string | null
    ) {
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
                metadata: {
                    generatedFrom: "monitoring-sla",
                    retention: "7 years",
                },
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
                metadata: {
                    downloadable: true,
                    contentPreview: built.csv.slice(0, 5000),
                },
            }))
        );

        await this.writeAudit({
            userId: actorId,
            actionType: "compliance_export_generated",
            entityType: "compliance_export",
            entityId: run.id,
            afterValue: {
                exportMonth,
                exportType,
                rowCount: built.rows.length,
                files: built.files,
            },
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
        const [runs, packs, exports, reviews, snapshots, audit] =
            await Promise.all([
                db.query.slaCheckRuns.findMany({
                    orderBy: [desc(slaCheckRuns.createdAt)],
                    limit: 5,
                }),
                db.query.weeklyReportingPacks.findMany({
                    orderBy: [desc(weeklyReportingPacks.createdAt)],
                    limit: 5,
                }),
                db.query.complianceExportRuns.findMany({
                    orderBy: [desc(complianceExportRuns.createdAt)],
                    limit: 5,
                }),
                db.query.accessReviewRuns.findMany({
                    orderBy: [desc(accessReviewRuns.createdAt)],
                    limit: 5,
                }),
                db.query.dailyHealthSnapshots.findMany({
                    orderBy: [desc(dailyHealthSnapshots.createdAt)],
                    limit: 5,
                }),
                db.query.auditLogs.findMany({
                    orderBy: [desc(auditLogs.timestampUtc)],
                    limit: 5,
                }),
            ]);

        return { runs, packs, exports, reviews, snapshots, audit };
    }
}

export const monitoringSlaQueries = new MonitoringSlaQuery();

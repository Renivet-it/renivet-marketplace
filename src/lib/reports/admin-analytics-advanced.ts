import { db } from "@/lib/db";
import {
    analyticsSavedReports,
    users,
} from "@/lib/db/schema";
import {
    ANALYTICS_DATE_PRESETS,
    ANALYTICS_COMPARISONS,
    FREEFORM_DIMENSIONS,
    FREEFORM_METRICS,
    type AnalyticsDateInput,
    type AnalyticsReportLibraryItem,
    type FreeformDimension,
    type FreeformMetric,
    getAdminReportLibrary as getSystemReportLibrary,
    resolveDateWindow,
    refreshAdminAnalyticsSnapshots,
} from "@/lib/reports/admin-analytics";
import {
    getPostHogBehaviorOverview,
    getPostHogDailyBehavior,
    getPostHogLandingPageDaily,
    getPostHogSessionsByLocation,
    isPostHogBehaviorConfigured,
} from "@/lib/reports/posthog-behavior";
import { and, desc, eq } from "drizzle-orm";

export const REPORT_CATEGORIES = ["Sales", "Behavior", "Acquisition"] as const;
export const REPORT_VISUALIZATIONS = [
    "line",
    "area",
    "bar",
    "horizontal_bar",
    "pie",
    "table",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportVisualization = (typeof REPORT_VISUALIZATIONS)[number];

export interface SaveAnalyticsReportInput {
    name: string;
    category: ReportCategory;
    metrics: FreeformMetric[];
    dimensions: FreeformDimension[];
    filtersJson?: Record<string, unknown>;
    visualizationType: ReportVisualization;
}

export interface UpdateAnalyticsReportInput extends SaveAnalyticsReportInput {
    id: string;
}

export interface AdminBehaviorOverview {
    sessions: number;
    visitors: number;
    sessionsWithCart: number;
    sessionsReachedCheckout: number;
    checkoutConversionRate: number;
    bounceRate: number;
    comparison: {
        sessions: number;
        visitors: number;
        sessionsWithCart: number;
        sessionsReachedCheckout: number;
        checkoutConversionRate: number;
        bounceRate: number;
    };
    source: "posthog" | "unconfigured";
}

export interface LandingPagePerformanceRow {
    landingPath: string;
    landingType: string;
    sessions: number;
    visitors: number;
    sessionsWithCart: number;
    sessionsReachedCheckout: number;
}

export interface AdminBehaviorTimeSeriesPoint {
    date: string;
    sessions: number;
    visitors: number;
    bounceRate: number;
    checkoutConversionRate: number;
}

export interface AdminSessionsByLocationRow {
    location: string;
    sessions: number;
    visitors: number;
}

export interface RefreshAnalyticsSnapshotsInput {
    startDate?: string;
    endDate?: string;
    timezone?: string;
    currency?: string;
}

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

function percentDelta(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : 100;
    return Number((((current - previous) / previous) * 100).toFixed(2));
}

function safeRate(numerator: number, denominator: number) {
    if (!denominator) return 0;
    return Number(((numerator / denominator) * 100).toFixed(2));
}

function normalizeMetrics(value: FreeformMetric[]) {
    const metrics = value.filter((metric) => FREEFORM_METRICS.includes(metric));
    return metrics.length ? metrics : (["total_sales"] as FreeformMetric[]);
}

function normalizeDimensions(value: FreeformDimension[]) {
    const dimensions = value.filter((dimension) =>
        FREEFORM_DIMENSIONS.includes(dimension)
    );
    return dimensions.length ? dimensions : (["product_title"] as FreeformDimension[]);
}

function toVisualization(value: unknown): ReportVisualization {
    if (REPORT_VISUALIZATIONS.includes(value as ReportVisualization)) {
        return value as ReportVisualization;
    }
    return "line";
}

export async function getAdminBehaviorOverview(
    input: AnalyticsDateInput
): Promise<AdminBehaviorOverview> {
    if (!isPostHogBehaviorConfigured()) {
        return {
            sessions: 0,
            visitors: 0,
            sessionsWithCart: 0,
            sessionsReachedCheckout: 0,
            checkoutConversionRate: 0,
            bounceRate: 0,
            comparison: {
                sessions: 0,
                visitors: 0,
                sessionsWithCart: 0,
                sessionsReachedCheckout: 0,
                checkoutConversionRate: 0,
                bounceRate: 0,
            },
            source: "unconfigured",
        };
    }

    const window = resolveDateWindow(input);
    const current = await getPostHogBehaviorOverview(window.current.start, window.current.end);
    const previous = window.previous
        ? await getPostHogBehaviorOverview(window.previous.start, window.previous.end)
        : {
              sessions: 0,
              visitors: 0,
              sessionsWithCart: 0,
              sessionsReachedCheckout: 0,
              bounceSessions: 0,
          };

    const currentCheckoutRate = safeRate(current.sessionsReachedCheckout, current.sessions);
    const previousCheckoutRate = safeRate(previous.sessionsReachedCheckout, previous.sessions);

    const currentBounceRate = safeRate(current.bounceSessions, current.sessions);
    const previousBounceRate = safeRate(previous.bounceSessions, previous.sessions);

    return {
        sessions: current.sessions,
        visitors: current.visitors,
        sessionsWithCart: current.sessionsWithCart,
        sessionsReachedCheckout: current.sessionsReachedCheckout,
        checkoutConversionRate: currentCheckoutRate,
        bounceRate: currentBounceRate,
        comparison: {
            sessions: percentDelta(current.sessions, previous.sessions),
            visitors: percentDelta(current.visitors, previous.visitors),
            sessionsWithCart: percentDelta(current.sessionsWithCart, previous.sessionsWithCart),
            sessionsReachedCheckout: percentDelta(
                current.sessionsReachedCheckout,
                previous.sessionsReachedCheckout
            ),
            checkoutConversionRate: percentDelta(currentCheckoutRate, previousCheckoutRate),
            bounceRate: percentDelta(currentBounceRate, previousBounceRate),
        },
        source: "posthog",
    };
}


export async function getAdminBehaviorTimeSeries(
    input: AnalyticsDateInput
): Promise<AdminBehaviorTimeSeriesPoint[]> {
    if (!isPostHogBehaviorConfigured()) return [];

    const window = resolveDateWindow(input);
    const rows = await getPostHogDailyBehavior(window.current.start, window.current.end);

    return rows.map((row) => ({
        date: row.dateKey,
        sessions: row.sessions,
        visitors: row.visitors,
        bounceRate: safeRate(row.bounceSessions, row.sessions),
        checkoutConversionRate: safeRate(row.sessionsReachedCheckout, row.sessions),
    }));
}

export async function getAdminSessionsByLocation(
    input: AnalyticsDateInput,
    limit = 20
): Promise<AdminSessionsByLocationRow[]> {
    if (!isPostHogBehaviorConfigured()) return [];

    const window = resolveDateWindow(input);
    const rows = await getPostHogSessionsByLocation(
        window.current.start,
        window.current.end,
        Math.max(limit, 1)
    );

    return rows
        .map((row) => ({
            location: String(row.location ?? "Unknown").trim() || "Unknown",
            sessions: Number(row.sessions ?? 0),
            visitors: Number(row.visitors ?? 0),
        }))
        .filter((row) => row.sessions > 0 || row.visitors > 0)
        .slice(0, limit);
}

export async function getAdminLandingPagePerformance(
    input: AnalyticsDateInput,
    limit = 20
): Promise<LandingPagePerformanceRow[]> {
    if (!isPostHogBehaviorConfigured()) return [];

    const window = resolveDateWindow(input);
    const rows = await getPostHogLandingPageDaily(
        window.current.start,
        window.current.end,
        Math.max(limit * 10, 100)
    );

    const normalizedRows = rows
        .map((row) => ({
            landingPath: String(row.landingPath ?? "unknown").trim() || "unknown",
            landingType: String(row.landingType ?? "unknown").trim() || "unknown",
            sessions: Number(row.sessions ?? 0),
            visitors: Number(row.visitors ?? 0),
            sessionsWithCart: Number(row.sessionsWithCart ?? 0),
            sessionsReachedCheckout: Number(row.sessionsReachedCheckout ?? 0),
        }))
        .filter(
            (row) =>
                Number.isFinite(row.sessions) &&
                Number.isFinite(row.visitors) &&
                Number.isFinite(row.sessionsWithCart) &&
                Number.isFinite(row.sessionsReachedCheckout)
        )
        .filter(
            (row) =>
                row.sessions > 0 ||
                row.visitors > 0 ||
                row.sessionsWithCart > 0 ||
                row.sessionsReachedCheckout > 0
        );

    const grouped = new Map<string, LandingPagePerformanceRow>();

    for (const row of normalizedRows) {
        const key = `${row.landingPath}::${row.landingType}`;
        const existing = grouped.get(key);

        if (existing) {
            existing.sessions += row.sessions;
            existing.visitors += row.visitors;
            existing.sessionsWithCart += row.sessionsWithCart;
            existing.sessionsReachedCheckout += row.sessionsReachedCheckout;
            continue;
        }

        grouped.set(key, {
            landingPath: row.landingPath,
            landingType: row.landingType,
            sessions: row.sessions,
            visitors: row.visitors,
            sessionsWithCart: row.sessionsWithCart,
            sessionsReachedCheckout: row.sessionsReachedCheckout,
        });
    }

    const rankedRows = Array.from(grouped.values())
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, limit);

    if (rankedRows.length > 0) {
        return rankedRows;
    }

    const summary = await getPostHogBehaviorOverview(
        window.current.start,
        window.current.end
    );

    if (
        summary.sessions <= 0 &&
        summary.visitors <= 0 &&
        summary.sessionsWithCart <= 0 &&
        summary.sessionsReachedCheckout <= 0
    ) {
        return [];
    }

    return [
        {
            landingPath: "(all landing pages)",
            landingType: "summary",
            sessions: summary.sessions,
            visitors: summary.visitors,
            sessionsWithCart: summary.sessionsWithCart,
            sessionsReachedCheckout: summary.sessionsReachedCheckout,
        },
    ];
}

export async function getAdminReportLibrary(userId?: string): Promise<AnalyticsReportLibraryItem[]> {
    const systemReports = await getSystemReportLibrary();

    const rows = await db
        .select({
            id: analyticsSavedReports.id,
            name: analyticsSavedReports.name,
            category: analyticsSavedReports.category,
            createdById: analyticsSavedReports.createdBy,
            firstName: users.firstName,
            lastName: users.lastName,
            metrics: analyticsSavedReports.metrics,
            dimensions: analyticsSavedReports.dimensions,
            filtersJson: analyticsSavedReports.filtersJson,
            visualizationType: analyticsSavedReports.visualizationType,
            isSystemReport: analyticsSavedReports.isSystemReport,
            lastViewedAt: analyticsSavedReports.lastViewedAt,
            createdAt: analyticsSavedReports.createdAt,
        })
        .from(analyticsSavedReports)
        .leftJoin(users, eq(analyticsSavedReports.createdBy, users.id))
        .where(
            and(
                eq(analyticsSavedReports.isActive, true),
                userId ? eq(analyticsSavedReports.createdBy, userId) : undefined,
                eq(analyticsSavedReports.isSystemReport, false)
            )
        )
        .orderBy(desc(analyticsSavedReports.createdAt));

    const savedReports: AnalyticsReportLibraryItem[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: (REPORT_CATEGORIES.includes(row.category as ReportCategory)
            ? row.category
            : "Sales") as ReportCategory,
        createdBy:
            row.firstName && row.lastName
                ? `${row.firstName} ${row.lastName}`
                : "You",
        createdById: row.createdById ?? undefined,
        lastViewed: row.lastViewedAt ?? toDateKey(row.createdAt),
        dimensions: normalizeDimensions((row.dimensions as FreeformDimension[]) ?? []),
        metrics: normalizeMetrics((row.metrics as FreeformMetric[]) ?? []),
        visualizationType: toVisualization(row.visualizationType),
        filtersJson:
            row.filtersJson && typeof row.filtersJson === "object"
                ? (row.filtersJson as Record<string, unknown>)
                : {},
        isSystemReport: false,
    }));

    return [...systemReports, ...savedReports];
}

export async function saveAdminReport(input: SaveAnalyticsReportInput, userId: string) {
    const [created] = await db
        .insert(analyticsSavedReports)
        .values({
            name: input.name,
            category: input.category,
            createdBy: userId,
            metrics: normalizeMetrics(input.metrics),
            dimensions: normalizeDimensions(input.dimensions),
            filtersJson: input.filtersJson ?? {},
            visualizationType: input.visualizationType,
            isSystemReport: false,
            isActive: true,
            lastViewedAt: toDateKey(new Date()),
        })
        .returning({ id: analyticsSavedReports.id });

    return created;
}

export async function updateAdminReport(input: UpdateAnalyticsReportInput, userId: string) {
    const rows = await db
        .update(analyticsSavedReports)
        .set({
            name: input.name,
            category: input.category,
            metrics: normalizeMetrics(input.metrics),
            dimensions: normalizeDimensions(input.dimensions),
            filtersJson: input.filtersJson ?? {},
            visualizationType: input.visualizationType,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(analyticsSavedReports.id, input.id),
                eq(analyticsSavedReports.createdBy, userId),
                eq(analyticsSavedReports.isSystemReport, false),
                eq(analyticsSavedReports.isActive, true)
            )
        )
        .returning({ id: analyticsSavedReports.id });

    return rows[0] ?? null;
}

export async function deleteAdminReport(id: string, userId: string) {
    const rows = await db
        .update(analyticsSavedReports)
        .set({
            isActive: false,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(analyticsSavedReports.id, id),
                eq(analyticsSavedReports.createdBy, userId),
                eq(analyticsSavedReports.isSystemReport, false),
                eq(analyticsSavedReports.isActive, true)
            )
        )
        .returning({ id: analyticsSavedReports.id });

    return rows.length > 0;
}

export async function refreshSnapshots(input: RefreshAnalyticsSnapshotsInput = {}) {
    const summary = await refreshAdminAnalyticsSnapshots({
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone ?? "Asia/Kolkata",
        currency: input.currency ?? "INR",
    });

    return {
        ...summary,
        posthogConfigured: isPostHogBehaviorConfigured(),
    };
}

export const ANALYTICS_ADVANCED_INPUTS = {
    datePreset: ANALYTICS_DATE_PRESETS,
    comparison: ANALYTICS_COMPARISONS,
    dimensions: FREEFORM_DIMENSIONS,
    metrics: FREEFORM_METRICS,
    categories: REPORT_CATEGORIES,
    visualizations: REPORT_VISUALIZATIONS,
};


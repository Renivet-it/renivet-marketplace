
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ANALYTICS_COMPARISONS,
    ANALYTICS_DATE_PRESETS,
    FREEFORM_DIMENSIONS,
    FREEFORM_METRICS,
    type AnalyticsComparison,
    type AnalyticsDatePreset,
    type FreeformDimension,
    type FreeformMetric,
} from "@/lib/reports/admin-analytics-shared";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type Filters = {
    datePreset: AnalyticsDatePreset;
    comparison: AnalyticsComparison;
    startDate?: string;
    endDate?: string;
};

type FreeformFilters = Filters & {
    metrics: FreeformMetric[];
    dimension: FreeformDimension;
    limit: number;
    offset: number;
    sortBy: FreeformMetric | "dimension";
    sortDirection: "asc" | "desc";
};

type LandingSortBy = "sessions" | "visitors" | "sessionShare" | "visitorRate";

type LandingSectionFilters = {
    search: string;
    type: "all" | "page" | "product" | "collection" | "unknown" | "summary";
    minSessions: number;
    hideInternal: boolean;
    sortBy: LandingSortBy;
    sortDirection: "asc" | "desc";
    limit: number;
};

type DashboardSection = "overview" | "behavior" | "landing" | "reports" | "freeform" | "all";

const DATE_LABEL: Record<AnalyticsDatePreset, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    ytd: "Year to date",
    custom: "Custom",
};

const COMP_LABEL: Record<AnalyticsComparison, string> = {
    none: "No comparison",
    previous_period: "Previous period",
    previous_year: "Previous year",
};

const DIM_LABEL: Record<FreeformDimension, string> = {
    product_title: "Product title",
    product_vendor: "Product vendor",
    product_type: "Product type",
    order_status: "Order status",
    order_date: "Order date",
};

const METRIC_LABEL: Record<FreeformMetric, string> = {
    gross_sales: "Gross sales",
    discounts: "Discounts",
    returns: "Returns",
    net_sales: "Net sales",
    taxes: "Taxes",
    shipping: "Shipping",
    total_sales: "Total sales",
    orders: "Orders",
    units_sold: "Units sold",
};

const CURRENCY_METRICS: FreeformMetric[] = [
    "gross_sales",
    "discounts",
    "returns",
    "net_sales",
    "taxes",
    "shipping",
    "total_sales",
];

const toInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(value || 0);

const percent = (value: number) => `${Number.isFinite(value) ? value.toFixed(2) : "0.00"}%`;

function Delta({ value }: { value: number }) {
    const positive = value >= 0;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            )}
        >
            {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(value).toFixed(2)}%
        </span>
    );
}

export function AdminAnalyticsDashboard() {
    const [filters, setFilters] = useState<Filters>({
        datePreset: "30d",
        comparison: "previous_period",
    });

    const [draft, setDraft] = useState<FreeformFilters>({
        ...filters,
        metrics: ["total_sales", "orders"],
        dimension: "product_title",
        limit: 20,
        offset: 0,
        sortBy: "total_sales",
        sortDirection: "desc",
    });

    const [applied, setApplied] = useState<FreeformFilters>(draft);

    const [landingSectionFilters, setLandingSectionFilters] = useState<LandingSectionFilters>({
        search: "",
        type: "all",
        minSessions: 0,
        hideInternal: true,
        sortBy: "sessions",
        sortDirection: "desc",
        limit: 20,
    });

    const [activeSection, setActiveSection] = useState<DashboardSection>("overview");

    const hasValidDateRange =
        filters.datePreset !== "custom" ||
        (Boolean(filters.startDate) && Boolean(filters.endDate));

    const hasValidAppliedDateRange =
        applied.datePreset !== "custom" ||
        (Boolean(applied.startDate) && Boolean(applied.endDate));

    const landingQueryLimit = Math.min(100, Math.max(landingSectionFilters.limit * 3, 40));

    const overview = trpc.general.analytics.getOverview.useQuery(filters, {
        enabled: hasValidDateRange,
    });
    const behavior = trpc.general.analytics.getBehaviorOverview.useQuery(filters, {
        enabled: hasValidDateRange,
    });
    const landing = trpc.general.analytics.getLandingPagePerformance.useQuery(
        { ...filters, limit: landingQueryLimit },
        { enabled: hasValidDateRange }
    );
    const series = trpc.general.analytics.getSalesTimeSeries.useQuery(filters, {
        enabled: hasValidDateRange,
    });
    const breakdown = trpc.general.analytics.getSalesBreakdown.useQuery(filters, {
        enabled: hasValidDateRange,
    });
    const reports = trpc.general.analytics.getReportLibrary.useQuery();
    const saveReport = trpc.general.analytics.saveReport.useMutation({
        onSuccess: async () => {
            await reports.refetch();
        },
    });
    const freeform = trpc.general.analytics.runFreeformReport.useQuery(applied, {
        enabled: hasValidAppliedDateRange,
    });
    const refreshSnapshots = trpc.general.analytics.refreshSnapshots.useMutation();

    const landingRows = useMemo(
        () =>
            ((landing.data ?? []) as Array<{
                landingPath: string;
                landingType: string;
                sessions: number;
                visitors: number;
                sessionsReachedCheckout: number;
            }>),
        [landing.data]
    );
    const reportRows = useMemo(() => {
        const allowedIds = [
            "sales_by_product",
            "sessions_by_landing_page",
            "sessions_by_location",
            "bounce_rate_over_time",
            "checkout_conversion_over_time",
        ];

        const byId = new Map((reports.data ?? []).map((report) => [report.id, report]));
        return allowedIds.flatMap((id) => {
            const report = byId.get(id);
            return report ? [report] : [];
        });
    }, [reports.data]);
    const freeformMetrics = freeform.data?.metrics ?? applied.metrics;
    const freeformMetricColSpan = 1 + freeformMetrics.length;

    const chartData = useMemo(() => {
        if (!series.data) return [];
        return series.data.current.map((point, index) => ({
            date: point.date,
            totalSales: point.totalSales,
            previousTotalSales: series.data?.previous?.[index]?.totalSales ?? 0,
        }));
    }, [series.data]);

    const landingSectionRows = useMemo(() => {
        const q = landingSectionFilters.search.trim().toLowerCase();
        const normalizePath = (value: string) => String(value ?? "").trim() || "unknown";

        const normalized = landingRows.map((row) => {
            const path = normalizePath(row.landingPath);
            const type = String(row.landingType ?? "unknown").trim() || "unknown";
            const sessions = Number.isFinite(Number(row.sessions)) ? Number(row.sessions) : 0;
            const visitors = Number.isFinite(Number(row.visitors)) ? Number(row.visitors) : 0;
            return {
                landingPath: path,
                landingType: type,
                sessions,
                visitors,
            };
        });

        const totalVisibleSessions = normalized.reduce((sum, row) => sum + row.sessions, 0);

        const internalPrefixes = ["/dashboard", "/auth", "/api", "/admin"];

        const filtered = normalized.filter((row) => {
            if (landingSectionFilters.type !== "all" && row.landingType !== landingSectionFilters.type) {
                return false;
            }

            if (landingSectionFilters.hideInternal && internalPrefixes.some((prefix) => row.landingPath.startsWith(prefix))) {
                return false;
            }

            if (row.sessions < landingSectionFilters.minSessions) {
                return false;
            }

            if (q && !(row.landingPath.toLowerCase().includes(q) || row.landingType.toLowerCase().includes(q))) {
                return false;
            }

            return true;
        });

        const withDerived = filtered.map((row) => ({
            ...row,
            sessionShare: totalVisibleSessions > 0 ? (row.sessions / totalVisibleSessions) * 100 : 0,
            visitorRate: row.sessions > 0 ? (row.visitors / row.sessions) * 100 : 0,
        }));

        const direction = landingSectionFilters.sortDirection === "asc" ? 1 : -1;
        withDerived.sort((a, b) => {
            if (landingSectionFilters.sortBy === "visitors") {
                return (a.visitors - b.visitors) * direction;
            }

            if (landingSectionFilters.sortBy === "sessionShare") {
                return (a.sessionShare - b.sessionShare) * direction;
            }

            if (landingSectionFilters.sortBy === "visitorRate") {
                return (a.visitorRate - b.visitorRate) * direction;
            }

            return (a.sessions - b.sessions) * direction;
        });

        return {
            rows: withDerived.slice(0, landingSectionFilters.limit),
            totalRowsBeforeLimit: withDerived.length,
            totalSessions: totalVisibleSessions,
        };
    }, [landingRows, landingSectionFilters]);

    const loading =
        overview.isLoading ||
        behavior.isLoading ||
        landing.isLoading ||
        series.isLoading ||
        breakdown.isLoading ||
        reports.isLoading;

    const sectionOptions: Array<{ key: DashboardSection; label: string }> = [
        { key: "overview", label: "Overview" },
        { key: "behavior", label: "Behavior" },
        { key: "landing", label: "Landing" },
        { key: "reports", label: "Reports" },
        { key: "freeform", label: "Freeform" },
        { key: "all", label: "All" },
    ];

    const toggleMetric = (metric: FreeformMetric) => {
        setDraft((prev) => {
            const exists = prev.metrics.includes(metric);
            const next = exists ? prev.metrics.filter((m) => m !== metric) : [...prev.metrics, metric];
            return { ...prev, metrics: next.length ? next : [metric] };
        });
    };

    const saveCurrentReport = async () => {
        const name = window.prompt("Enter report name");
        if (!name) return;

        await saveReport.mutateAsync({
            name,
            category: "Sales",
            metrics: draft.metrics,
            dimensions: [draft.dimension],
            filtersJson: {},
            visualizationType: "table",
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">Unified sales analytics with freeform reporting.</p>
            </div>

            <Card>
                <CardContent className="grid gap-4 p-4 md:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Date range</label>
                        <select
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={filters.datePreset}
                            onChange={(e) => {
                                const datePreset = e.target.value as AnalyticsDatePreset;
                                const today = toInputDate(new Date());
                                const defaultStartDate = toInputDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
                                const extra =
                                    datePreset === "custom"
                                        ? {
                                              startDate: filters.startDate ?? defaultStartDate,
                                              endDate: filters.endDate ?? today,
                                          }
                                        : { startDate: undefined, endDate: undefined };

                                setFilters((prev) => ({ ...prev, datePreset, ...extra }));
                                setDraft((prev) => ({ ...prev, datePreset, ...extra }));
                            }}
                        >
                            {ANALYTICS_DATE_PRESETS.map((preset) => (
                                <option key={preset} value={preset}>{DATE_LABEL[preset]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Comparison</label>
                        <select
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={filters.comparison}
                            onChange={(e) => {
                                const comparison = e.target.value as AnalyticsComparison;
                                setFilters((prev) => ({ ...prev, comparison }));
                                setDraft((prev) => ({ ...prev, comparison }));
                            }}
                        >
                            {ANALYTICS_COMPARISONS.map((comparison) => (
                                <option key={comparison} value={comparison}>{COMP_LABEL[comparison]}</option>
                            ))}
                        </select>
                    </div>

                    {filters.datePreset === "custom" ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">Start date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={filters.startDate ?? ""}
                                    onChange={(e) => {
                                        const startDate = e.target.value || undefined;
                                        setFilters((prev) => ({ ...prev, startDate }));
                                        setDraft((prev) => ({ ...prev, startDate }));
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">End date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={filters.endDate ?? ""}
                                    onChange={(e) => {
                                        const endDate = e.target.value || undefined;
                                        setFilters((prev) => ({ ...prev, endDate }));
                                        setDraft((prev) => ({ ...prev, endDate }));
                                    }}
                                />
                            </div>
                        </>
                    ) : null}

                    <div className="flex justify-end md:col-span-4">
                        <Button
                            onClick={() =>
                                refreshSnapshots.mutate({
                                    startDate: filters.startDate,
                                    endDate: filters.endDate,
                                    timezone: "Asia/Kolkata",
                                    currency: "INR",
                                })
                            }
                            disabled={refreshSnapshots.isPending}
                        >
                            {refreshSnapshots.isPending ? "Refreshing snapshots..." : "Refresh snapshots"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="flex flex-wrap items-center gap-2 p-3">
                    <span className="mr-2 text-xs font-semibold uppercase text-muted-foreground">Section menu</span>
                    {sectionOptions.map((section) => (
                        <button
                            key={section.key}
                            type="button"
                            onClick={() => setActiveSection(section.key)}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                activeSection === section.key
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-foreground/80 hover:bg-muted"
                            )}
                        >
                            {section.label}
                        </button>
                    ))}
                </CardContent>
            </Card>

            {loading ? (
                <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">Loading dashboard data...</CardContent>
                </Card>
            ) : (
                <>
                    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", activeSection !== "all" && activeSection !== "overview" && "hidden")}>
                        <Kpi title="Gross sales" value={money(overview.data?.grossSales ?? 0)} change={overview.data?.comparison.grossSales ?? 0} />
                        <Kpi
                            title="Returning customer rate"
                            value={percent(overview.data?.returningCustomerRate ?? 0)}
                            change={overview.data?.comparison.returningCustomerRate ?? 0}
                            subtext={`${overview.data?.returningCustomers ?? 0} returning / ${overview.data?.newCustomers ?? 0} new`}
                        />
                        <Kpi title="Orders fulfilled" value={(overview.data?.ordersFulfilled ?? 0).toLocaleString()} change={overview.data?.comparison.ordersFulfilled ?? 0} />
                        <Kpi title="Orders" value={(overview.data?.orders ?? 0).toLocaleString()} change={overview.data?.comparison.orders ?? 0} />
                    </div>

                    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", activeSection !== "all" && activeSection !== "behavior" && "hidden")}>
                        <Kpi title="Sessions" value={(behavior.data?.sessions ?? 0).toLocaleString()} change={behavior.data?.comparison.sessions ?? 0} />
                        <Kpi title="Visitors" value={(behavior.data?.visitors ?? 0).toLocaleString()} change={behavior.data?.comparison.visitors ?? 0} />
                        <Kpi title="Checkout conversion" value={percent(behavior.data?.checkoutConversionRate ?? 0)} change={behavior.data?.comparison.checkoutConversionRate ?? 0} />
                        <Kpi title="Bounce rate" value={percent(behavior.data?.bounceRate ?? 0)} change={behavior.data?.comparison.bounceRate ?? 0} />
                    </div>

                    <div className={cn("grid gap-4 xl:grid-cols-[2fr_1fr]", activeSection !== "all" && activeSection !== "overview" && "hidden")}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Total sales over time</CardTitle>
                                <CardDescription>{DATE_LABEL[filters.datePreset]} with {COMP_LABEL[filters.comparison].toLowerCase()}</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[340px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis tickFormatter={(v) => `INR ${Number(v).toLocaleString()}`} />
                                        <Tooltip formatter={(value: number, name) => [money(Number(value)), name]} />
                                        <Legend />
                                        <Line type="monotone" dataKey="totalSales" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Total sales" />
                                        <Line type="monotone" dataKey="previousTotalSales" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Comparison" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Total sales breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Breakdown label="Gross sales" value={breakdown.data?.grossSales ?? 0} change={breakdown.data?.comparison.grossSales ?? 0} />
                                <Breakdown label="Discounts" value={breakdown.data?.discounts ?? 0} change={breakdown.data?.comparison.discounts ?? 0} negative />
                                <Breakdown label="Returns" value={breakdown.data?.returns ?? 0} change={breakdown.data?.comparison.returns ?? 0} negative />
                                <Breakdown label="Net sales" value={breakdown.data?.netSales ?? 0} change={breakdown.data?.comparison.netSales ?? 0} />
                                <Breakdown label="Shipping" value={breakdown.data?.shipping ?? 0} change={breakdown.data?.comparison.shipping ?? 0} />
                                <Breakdown label="Taxes" value={breakdown.data?.taxes ?? 0} change={breakdown.data?.comparison.taxes ?? 0} />
                                <Breakdown label="Total sales" value={breakdown.data?.totalSales ?? 0} change={breakdown.data?.comparison.totalSales ?? 0} strong />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className={cn(activeSection !== "all" && activeSection !== "landing" && "hidden")}>
                        <CardHeader>
                            <CardTitle>Landing page performance</CardTitle>
                            <CardDescription>Top landing paths by sessions with dedicated PostHog filters.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                                <div className="space-y-1 xl:col-span-2">
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Search path/type</label>
                                    <input
                                        type="text"
                                        value={landingSectionFilters.search}
                                        onChange={(e) =>
                                            setLandingSectionFilters((prev) => ({ ...prev, search: e.target.value }))
                                        }
                                        placeholder="/shop, /men, page"
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    />
                                </div>

                                <SelectBlock
                                    label="Landing type"
                                    value={landingSectionFilters.type}
                                    onChange={(value) =>
                                        setLandingSectionFilters((prev) => ({
                                            ...prev,
                                            type: value as LandingSectionFilters["type"],
                                        }))
                                    }
                                    options={[
                                        { value: "all", label: "All types" },
                                        { value: "page", label: "Page" },
                                        { value: "product", label: "Product" },
                                        { value: "collection", label: "Collection" },
                                        { value: "unknown", label: "Unknown" },
                                        { value: "summary", label: "Summary" },
                                    ]}
                                />

                                <InputBlock
                                    label="Min sessions"
                                    value={String(landingSectionFilters.minSessions)}
                                    onChange={(value) =>
                                        setLandingSectionFilters((prev) => ({
                                            ...prev,
                                            minSessions: Math.max(0, Number(value || 0)),
                                        }))
                                    }
                                />

                                <SelectBlock
                                    label="Sort by"
                                    value={landingSectionFilters.sortBy}
                                    onChange={(value) =>
                                        setLandingSectionFilters((prev) => ({
                                            ...prev,
                                            sortBy: value as LandingSortBy,
                                        }))
                                    }
                                    options={[
                                        { value: "sessions", label: "Sessions" },
                                        { value: "visitors", label: "Visitors" },
                                        { value: "sessionShare", label: "Session share" },
                                        { value: "visitorRate", label: "Visitor rate" },
                                    ]}
                                />

                                <div className="grid grid-cols-2 gap-2">
                                    <SelectBlock
                                        label="Direction"
                                        value={landingSectionFilters.sortDirection}
                                        onChange={(value) =>
                                            setLandingSectionFilters((prev) => ({
                                                ...prev,
                                                sortDirection: value as "asc" | "desc",
                                            }))
                                        }
                                        options={[
                                            { value: "desc", label: "Desc" },
                                            { value: "asc", label: "Asc" },
                                        ]}
                                    />
                                    <InputBlock
                                        label="Rows"
                                        value={String(landingSectionFilters.limit)}
                                        onChange={(value) =>
                                            setLandingSectionFilters((prev) => ({
                                                ...prev,
                                                limit: Math.max(5, Math.min(Number(value || 20), 100)),
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={landingSectionFilters.hideInternal}
                                        onChange={(e) =>
                                            setLandingSectionFilters((prev) => ({
                                                ...prev,
                                                hideInternal: e.target.checked,
                                            }))
                                        }
                                        className="h-4 w-4 rounded border"
                                    />
                                    Hide internal paths (/dashboard, /auth, /api)
                                </label>

                                <p className="text-xs text-muted-foreground">
                                    Showing {landingSectionRows.rows.length} of {landingSectionRows.totalRowsBeforeLimit} rows - total sessions {landingSectionRows.totalSessions.toLocaleString()}
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="px-2 py-2">Landing path</th>
                                            <th className="px-2 py-2">Type</th>
                                            <th className="px-2 py-2 text-right">Sessions</th>
                                            <th className="px-2 py-2 text-right">Visitors</th>
                                            <th className="px-2 py-2 text-right">Session share</th>
                                            <th className="px-2 py-2 text-right">Visitor rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {landingSectionRows.rows.map((row) => (
                                            <tr key={`${row.landingPath}-${row.landingType}`} className="border-b">
                                                <td className="px-2 py-2 font-medium">{row.landingPath}</td>
                                                <td className="px-2 py-2">{row.landingType}</td>
                                                <td className="px-2 py-2 text-right">{row.sessions.toLocaleString()}</td>
                                                <td className="px-2 py-2 text-right">{row.visitors.toLocaleString()}</td>
                                                <td className="px-2 py-2 text-right">{percent(row.sessionShare)}</td>
                                                <td className="px-2 py-2 text-right">{percent(row.visitorRate)}</td>
                                            </tr>
                                        ))}
                                        {landingSectionRows.rows.length === 0 ? (
                                            <tr>
                                                <td className="px-2 py-6 text-center text-muted-foreground" colSpan={6}>
                                                    {behavior.data?.source === "unconfigured"
                                                        ? "PostHog behavior query API is not configured yet."
                                                        : "No landing rows match the selected landing filters."}
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={cn(activeSection !== "all" && activeSection !== "reports" && "hidden")}>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>Reports</CardTitle>
                                <CardDescription>Curated report templates (red-box selection).</CardDescription>
                            </div>
                            <Button onClick={saveCurrentReport} disabled={saveReport.isPending}>
                                {saveReport.isPending ? "Saving..." : "Save current report"}
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-2 py-2">Name</th>
                                        <th className="px-2 py-2">Category</th>
                                        <th className="px-2 py-2">Created by</th>
                                        <th className="px-2 py-2">Last viewed</th>
                                        <th className="px-2 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportRows.map((report) => (
                                        <tr key={report.id} className="border-b">
                                            <td className="px-2 py-2 font-medium"><Link className="hover:underline" href={`/dashboard/general/analytics/reports/${report.id}`}>{report.name}</Link></td>
                                            <td className="px-2 py-2"><Badge variant="outline">{report.category}</Badge></td>
                                            <td className="px-2 py-2">{report.createdBy}</td>
                                            <td className="px-2 py-2">{report.lastViewed}</td>
                                            <td className="px-2 py-2">
                                                <div className="flex justify-end gap-2">
                                                    <Button className="h-7 px-2 text-xs" asChild>
                                                        <Link href={`/dashboard/general/analytics/reports/${report.id}`}>Open</Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    <Card className={cn(activeSection !== "all" && activeSection !== "freeform" && "hidden")}>
                        <CardHeader>
                            <CardTitle>Freeform report</CardTitle>
                            <CardDescription>Choose metrics and dimension, then run.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-4">
                                <SelectBlock label="Dimension" value={draft.dimension} onChange={(value) => setDraft((prev) => ({ ...prev, dimension: value as FreeformDimension }))} options={FREEFORM_DIMENSIONS.map((d) => ({ value: d, label: DIM_LABEL[d] }))} />
                                <InputBlock label="Limit" value={String(draft.limit)} onChange={(value) => setDraft((prev) => ({ ...prev, limit: Math.max(1, Math.min(Number(value || 20), 200)) }))} />
                                <SelectBlock label="Sort by" value={draft.sortBy} onChange={(value) => setDraft((prev) => ({ ...prev, sortBy: value as FreeformMetric | "dimension" }))} options={[{ value: "dimension", label: "Dimension" }, ...FREEFORM_METRICS.map((m) => ({ value: m, label: METRIC_LABEL[m] }))]} />
                                <SelectBlock label="Direction" value={draft.sortDirection} onChange={(value) => setDraft((prev) => ({ ...prev, sortDirection: value as "asc" | "desc" }))} options={[{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }]} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {FREEFORM_METRICS.map((metric) => (
                                    <button
                                        type="button"
                                        key={metric}
                                        onClick={() => toggleMetric(metric)}
                                        className={cn(
                                            "rounded-full border px-3 py-1 text-xs font-medium",
                                            draft.metrics.includes(metric) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/80"
                                        )}
                                    >
                                        {METRIC_LABEL[metric]}
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={() => setApplied({ ...draft, datePreset: filters.datePreset, comparison: filters.comparison, startDate: filters.startDate, endDate: filters.endDate })}>Run report</Button>
                            </div>

                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="px-3 py-2">{DIM_LABEL[freeform.data?.dimension ?? applied.dimension]}</th>
                                            {freeformMetrics.map((metric) => (
                                                <th key={metric} className="px-3 py-2 text-right">{METRIC_LABEL[metric]}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {freeform.isLoading ? (
                                            <tr>
                                                <td colSpan={freeformMetricColSpan} className="px-3 py-8 text-center text-muted-foreground">Running freeform report...</td>
                                            </tr>
                                        ) : null}

                                        {!freeform.isLoading && (freeform.data?.rows.length ?? 0) === 0 ? (
                                            <tr>
                                                <td colSpan={freeformMetricColSpan} className="px-3 py-8 text-center text-muted-foreground">No rows found.</td>
                                            </tr>
                                        ) : null}

                                        {(freeform.data?.rows ?? []).map((row) => (
                                            <tr key={row.dimension} className="border-b">
                                                <td className="px-3 py-2 font-medium">{row.dimension}</td>
                                                {freeformMetrics.map((metric) => (
                                                    <td key={metric} className="px-3 py-2 text-right">
                                                        {CURRENCY_METRICS.includes(metric)
                                                            ? money(row.metrics[metric])
                                                            : Number(row.metrics[metric] ?? 0).toLocaleString()}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

function Kpi({ title, value, change, subtext }: { title: string; value: string; change: number; subtext?: string }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
                <Delta value={change} />
                {subtext ? <p className="text-xs text-muted-foreground">{subtext}</p> : null}
            </CardContent>
        </Card>
    );
}

function Breakdown({ label, value, change, negative, strong }: { label: string; value: number; change: number; negative?: boolean; strong?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
                <p className={cn("text-sm", strong ? "font-semibold" : "text-muted-foreground")}>{label}</p>
                <p className="text-lg font-semibold">{negative ? "-" : ""}{money(Math.abs(value))}</p>
            </div>
            <Delta value={change} />
        </div>
    );
}

function SelectBlock({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
}

function InputBlock({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
            <input type="number" min={1} max={200} className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}












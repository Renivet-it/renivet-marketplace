
"use client";

import { Button } from "@/components/ui/button-general";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ANALYTICS_COMPARISONS,
    ANALYTICS_DATE_PRESETS,
    type AnalyticsComparison,
    type AnalyticsDatePreset,
} from "@/lib/reports/admin-analytics-shared";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
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

type ReportId =
    | "sales_by_product"
    | "sessions_by_landing_page"
    | "sessions_by_location"
    | "bounce_rate_over_time"
    | "checkout_conversion_over_time";

type SearchParamReader = {
    get: (key: string) => string | null;
};

const REPORT_META: Record<ReportId, { title: string; description: string }> = {
    sales_by_product: {
        title: "Total sales by product",
        description: "Gross, taxes, net, total sales, and orders by product.",
    },
    sessions_by_landing_page: {
        title: "Sessions by landing page",
        description: "Top landing paths ranked by sessions and visitors.",
    },
    sessions_by_location: {
        title: "Sessions by location",
        description: "Visitor and session distribution by location.",
    },
    bounce_rate_over_time: {
        title: "Bounce rate over time",
        description: "Daily bounce trend from PostHog behavior events.",
    },
    checkout_conversion_over_time: {
        title: "Checkout conversion rate over time",
        description: "Daily checkout conversion trend from PostHog behavior events.",
    },
};

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

const escapeCsv = (value: unknown) => {
    const raw = String(value ?? "");
    return `"${raw.replace(/"/g, "\"\"")}"`;
};

const buildCsv = (headers: string[], rows: Array<Array<unknown>>) =>
    [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");

const downloadCsvFile = (fileName: string, csv: string) => {
    if (typeof window === "undefined") return;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const parseDatePreset = (value: string | null): AnalyticsDatePreset => {
    if (value && ANALYTICS_DATE_PRESETS.includes(value as AnalyticsDatePreset)) {
        return value as AnalyticsDatePreset;
    }
    return "30d";
};

const parseComparison = (value: string | null): AnalyticsComparison => {
    if (value && ANALYTICS_COMPARISONS.includes(value as AnalyticsComparison)) {
        return value as AnalyticsComparison;
    }
    return "previous_period";
};

const parseFiltersFromSearchParams = (searchParams: SearchParamReader): Filters => {
    const datePreset = parseDatePreset(searchParams.get("datePreset"));
    const comparison = parseComparison(searchParams.get("comparison"));

    if (datePreset !== "custom") {
        return { datePreset, comparison };
    }

    return {
        datePreset,
        comparison,
        startDate: searchParams.get("startDate") ?? undefined,
        endDate: searchParams.get("endDate") ?? undefined,
    };
};

const buildFilterQuery = (filters: Filters) => {
    const params = new URLSearchParams();
    params.set("datePreset", filters.datePreset);
    params.set("comparison", filters.comparison);

    if (filters.datePreset === "custom") {
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);
    }

    return params.toString();
};

const buildFileSuffix = (filters: Filters) =>
    filters.datePreset === "custom"
        ? `${filters.startDate ?? "start"}_to_${filters.endDate ?? "end"}`
        : filters.datePreset;

function isReportId(value: string): value is ReportId {
    return value in REPORT_META;
}

export function AnalyticsReportDetailPage({ reportId }: { reportId: string }) {
    const activeReportId = isReportId(reportId) ? reportId : null;

    const searchParams = useSearchParams();
    const initialFilters = useMemo(
        () => parseFiltersFromSearchParams(searchParams),
        [searchParams]
    );

    const [filters, setFilters] = useState<Filters>(() => initialFilters);

    const hasValidDateRange =
        filters.datePreset !== "custom" ||
        (Boolean(filters.startDate) && Boolean(filters.endDate));

    const salesByProduct = trpc.general.analytics.runFreeformReport.useQuery(
        {
            ...filters,
            metrics: ["gross_sales", "taxes", "net_sales", "total_sales", "orders"],
            dimension: "product_title",
            limit: 50,
            offset: 0,
            sortBy: "gross_sales",
            sortDirection: "desc",
        },
        {
            enabled: hasValidDateRange && activeReportId === "sales_by_product",
        }
    );

    const landing = trpc.general.analytics.getLandingPagePerformance.useQuery(
        {
            ...filters,
            limit: 100,
        },
        {
            enabled: hasValidDateRange && activeReportId === "sessions_by_landing_page",
        }
    );

    const locations = trpc.general.analytics.getSessionsByLocation.useQuery(
        {
            ...filters,
            limit: 100,
        },
        {
            enabled: hasValidDateRange && activeReportId === "sessions_by_location",
        }
    );

    const behaviorSeries = trpc.general.analytics.getBehaviorTimeSeries.useQuery(filters, {
        enabled:
            hasValidDateRange &&
            (activeReportId === "bounce_rate_over_time" || activeReportId === "checkout_conversion_over_time"),
    });

    const chartData = useMemo(() => {
        const rows = behaviorSeries.data ?? [];
        return rows.map((row) => ({
            date: row.date,
            bounceRate: row.bounceRate,
            checkoutConversionRate: row.checkoutConversionRate,
            sessions: row.sessions,
            visitors: row.visitors,
        }));
    }, [behaviorSeries.data]);

    const backHref = useMemo(() => {
        const query = buildFilterQuery(filters);
        return query ? `/dashboard/general/analytics?${query}` : "/dashboard/general/analytics";
    }, [filters]);

    const exportCurrentReport = useCallback(() => {
        if (!activeReportId) return;

        if (activeReportId === "sales_by_product") {
            const csv = buildCsv(
                ["product", "gross_sales", "taxes", "net_sales", "total_sales", "orders"],
                (salesByProduct.data?.rows ?? []).map((row) => [
                    row.dimension,
                    row.metrics.gross_sales,
                    row.metrics.taxes,
                    row.metrics.net_sales,
                    row.metrics.total_sales,
                    row.metrics.orders ?? 0,
                ])
            );
            downloadCsvFile(`report-sales-by-product-${buildFileSuffix(filters)}.csv`, csv);
            return;
        }

        if (activeReportId === "sessions_by_landing_page") {
            const csv = buildCsv(
                ["landing_path", "type", "brand", "product_title", "category", "subcategory", "sessions", "visitors"],
                (landing.data ?? []).map((row) => [
                    row.landingPath,
                    row.landingType,
                    row.landingType === "product" ? row.productBrandName ?? "" : "",
                    row.landingType === "product" ? row.productTitle ?? "" : "",
                    row.landingType === "product" ? row.productCategoryName ?? "" : "",
                    row.landingType === "product" ? row.productSubcategoryName ?? "" : "",
                    row.sessions,
                    row.visitors,
                ])
            );
            downloadCsvFile(`report-sessions-by-landing-${buildFileSuffix(filters)}.csv`, csv);
            return;
        }

        if (activeReportId === "sessions_by_location") {
            const total = (locations.data ?? []).reduce((sum, row) => sum + row.sessions, 0);
            const csv = buildCsv(
                ["location", "sessions", "visitors", "session_share"],
                (locations.data ?? []).map((row) => [
                    row.location,
                    row.sessions,
                    row.visitors,
                    total > 0 ? ((row.sessions / total) * 100).toFixed(2) : "0.00",
                ])
            );
            downloadCsvFile(`report-sessions-by-location-${buildFileSuffix(filters)}.csv`, csv);
            return;
        }

        const csv = buildCsv(
            ["date", "bounce_rate", "checkout_conversion_rate", "sessions", "visitors"],
            chartData.map((row) => [
                row.date,
                row.bounceRate,
                row.checkoutConversionRate,
                row.sessions,
                row.visitors,
            ])
        );
        downloadCsvFile(`report-behavior-timeseries-${buildFileSuffix(filters)}.csv`, csv);
    }, [activeReportId, chartData, filters, landing.data, locations.data, salesByProduct.data]);

    if (!activeReportId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Report not found</CardTitle>
                    <CardDescription>This report is not available in the curated list.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard/general/analytics">Back to analytics</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">{REPORT_META[activeReportId].title}</h1>
                    <p className="text-sm text-muted-foreground">{REPORT_META[activeReportId].description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportCurrentReport}>Export to Excel</Button>
                    <Button asChild variant="outline">
                        <Link href={backHref}>Back</Link>
                    </Button>
                </div>
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
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    comparison: e.target.value as AnalyticsComparison,
                                }))
                            }
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
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            startDate: e.target.value || undefined,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-muted-foreground">End date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={filters.endDate ?? ""}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            endDate: e.target.value || undefined,
                                        }))
                                    }
                                />
                            </div>
                        </>
                    ) : null}
                </CardContent>
            </Card>

            {activeReportId === "sales_by_product" ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Product performance</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-2 py-2">Product</th>
                                    <th className="px-2 py-2 text-right">Gross sales</th>
                                    <th className="px-2 py-2 text-right">Taxes</th>
                                    <th className="px-2 py-2 text-right">Net sales</th>
                                    <th className="px-2 py-2 text-right">Total sales</th>
                                    <th className="px-2 py-2 text-right">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(salesByProduct.data?.rows ?? []).map((row) => (
                                    <tr key={row.dimension} className="border-b">
                                        <td className="px-2 py-2 font-medium">{row.dimension}</td>
                                        <td className="px-2 py-2 text-right">{money(row.metrics.gross_sales)}</td>
                                        <td className="px-2 py-2 text-right">{money(row.metrics.taxes)}</td>
                                        <td className="px-2 py-2 text-right">{money(row.metrics.net_sales)}</td>
                                        <td className="px-2 py-2 text-right">{money(row.metrics.total_sales)}</td>
                                        <td className="px-2 py-2 text-right">{Number(row.metrics.orders ?? 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : null}

            {activeReportId === "sessions_by_landing_page" ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Landing sessions details</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-2 py-2">Landing path</th>
                                    <th className="px-2 py-2">Type</th>
                                    <th className="px-2 py-2">Brand</th>
                                    <th className="px-2 py-2">Product title</th>
                                    <th className="px-2 py-2">Category</th>
                                    <th className="px-2 py-2">Subcategory</th>
                                    <th className="px-2 py-2 text-right">Sessions</th>
                                    <th className="px-2 py-2 text-right">Visitors</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(landing.data ?? []).map((row) => (
                                    <tr key={`${row.landingPath}-${row.landingType}`} className="border-b">
                                        <td className="px-2 py-2 font-medium">{row.landingPath}</td>
                                        <td className="px-2 py-2">{row.landingType}</td>
                                        <td className="px-2 py-2">{row.landingType === "product" ? (row.productBrandName ?? "-") : "-"}</td>
                                        <td className="px-2 py-2">{row.landingType === "product" ? (row.productTitle ?? "-") : "-"}</td>
                                        <td className="px-2 py-2">{row.landingType === "product" ? (row.productCategoryName ?? "-") : "-"}</td>
                                        <td className="px-2 py-2">{row.landingType === "product" ? (row.productSubcategoryName ?? "-") : "-"}</td>
                                        <td className="px-2 py-2 text-right">{row.sessions.toLocaleString()}</td>
                                        <td className="px-2 py-2 text-right">{row.visitors.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : null}

            {activeReportId === "sessions_by_location" ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Location sessions details</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-2 py-2">Location</th>
                                    <th className="px-2 py-2 text-right">Sessions</th>
                                    <th className="px-2 py-2 text-right">Visitors</th>
                                    <th className="px-2 py-2 text-right">Session share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(locations.data ?? []).map((row) => {
                                    const total = (locations.data ?? []).reduce((sum, item) => sum + item.sessions, 0);
                                    const share = total > 0 ? (row.sessions / total) * 100 : 0;
                                    return (
                                        <tr key={row.location} className="border-b">
                                            <td className="px-2 py-2 font-medium">{row.location}</td>
                                            <td className="px-2 py-2 text-right">{row.sessions.toLocaleString()}</td>
                                            <td className="px-2 py-2 text-right">{row.visitors.toLocaleString()}</td>
                                            <td className="px-2 py-2 text-right">{percent(share)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : null}

            {activeReportId === "bounce_rate_over_time" || activeReportId === "checkout_conversion_over_time" ? (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {activeReportId === "bounce_rate_over_time"
                                ? "Bounce rate trend"
                                : "Checkout conversion trend"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[360px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
                                <Tooltip formatter={(value: number) => percent(Number(value))} />
                                <Legend />
                                {activeReportId === "bounce_rate_over_time" ? (
                                    <Line
                                        type="monotone"
                                        dataKey="bounceRate"
                                        stroke="#f97316"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Bounce rate"
                                    />
                                ) : (
                                    <Line
                                        type="monotone"
                                        dataKey="checkoutConversionRate"
                                        stroke="#0ea5e9"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Checkout conversion"
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}

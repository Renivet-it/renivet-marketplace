import { DashShell } from "@/components/globals/layouts";
import {
    getOperationalDateInputValue,
    getOperationalDateTimeLabel,
    getOperationalDefaultDates,
    getOperationalReportList,
    getOperationalReportTitle,
    getOperationalStores,
    OPERATIONAL_PARTNER_TYPES,
    OPERATIONAL_REPORT_TYPES,
    parseOperationalDate,
    parseOperationalLimit,
    parseOperationalPage,
    parseOperationalPartnerType,
    parseOperationalReportType,
    type OperationalReportType,
} from "@/lib/reports/operational";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Operational Reports",
    description: "Inventory, catalog, sales, and stock movement reports",
};

interface PageProps {
    searchParams: Promise<{
        report?: string;
        storeId?: string;
        partnerType?: string;
        startDate?: string;
        endDate?: string;
        page?: string;
        limit?: string;
    }>;
}

const reportSidebar = [
    {
        section: "Operational Reports",
        items: [
            {
                report: "stock_movement" as OperationalReportType,
                label: "Stock Movement Report",
            },
        ],
    },
    {
        section: "Transactional Reports",
        items: [
            { report: "catalog" as OperationalReportType, label: "Catalog" },
            { report: "inventory" as OperationalReportType, label: "Inventory" },
            { report: "smart_jit" as OperationalReportType, label: "SmartJIT" },
            { report: "sales_new" as OperationalReportType, label: "SalesNew" },
            { report: "faq" as OperationalReportType, label: "FAQ" },
        ],
    },
];

export default async function Page({ searchParams }: PageProps) {
    const query = await searchParams;
    const defaults = getOperationalDefaultDates();

    const report = parseOperationalReportType(query.report);
    const partnerType = parseOperationalPartnerType(query.partnerType);
    const startDate = parseOperationalDate(query.startDate, defaults.startDate);
    const endDate = parseOperationalDate(query.endDate, defaults.endDate);
    const page = parseOperationalPage(query.page);
    const limit = parseOperationalLimit(query.limit);
    const storeId = query.storeId || undefined;

    const [stores, reportData] = await Promise.all([
        getOperationalStores(),
        getOperationalReportList({
            report,
            storeId,
            partnerType,
            startDate,
            endDate,
            page,
            limit,
        }),
    ]);

    const totalPages = Math.max(Math.ceil(reportData.total / limit), 1);

    const buildHref = (overrides: Partial<Record<string, string | undefined>>) => {
        const params = new URLSearchParams();

        const state = {
            report,
            storeId,
            partnerType,
            startDate: getOperationalDateInputValue(startDate),
            endDate: getOperationalDateInputValue(endDate),
            page: String(page),
            limit: String(limit),
            ...overrides,
        };

        for (const [key, value] of Object.entries(state)) {
            if (value) params.set(key, value);
        }

        return `/dashboard/general/operational-reports?${params.toString()}`;
    };

    return (
        <DashShell className="max-w-none gap-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Operational Reports</h1>
                <p className="text-sm text-muted-foreground">
                    Understand inventory, listing, return, and order reports
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <aside className="rounded-xl border bg-card p-4">
                    <div className="space-y-4">
                        {reportSidebar.map((group) => (
                            <div key={group.section} className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {group.section}
                                </p>
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const isActive = report === item.report;
                                        return (
                                            <Link
                                                key={item.report}
                                                href={buildHref({
                                                    report: item.report,
                                                    page: "1",
                                                })}
                                                className={`block rounded-md px-3 py-2 text-sm transition ${
                                                    isActive
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-foreground/80 hover:bg-muted"
                                                }`}
                                            >
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <section className="space-y-4">
                    <form
                        method="get"
                        className="rounded-xl border bg-card p-4 md:p-5"
                    >
                        <input type="hidden" name="page" value="1" />
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Store
                                </label>
                                <select
                                    name="storeId"
                                    defaultValue={storeId ?? ""}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">All Stores</option>
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Partner Type
                                </label>
                                <select
                                    name="partnerType"
                                    defaultValue={partnerType}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    {OPERATIONAL_PARTNER_TYPES.map((option) => (
                                        <option key={option} value={option}>
                                            {option === "all"
                                                ? "All"
                                                : option.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Report
                                </label>
                                <select
                                    name="report"
                                    defaultValue={report}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    {OPERATIONAL_REPORT_TYPES.map((option) => (
                                        <option key={option} value={option}>
                                            {getOperationalReportTitle(option)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    defaultValue={getOperationalDateInputValue(startDate)}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    defaultValue={getOperationalDateInputValue(endDate)}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-muted-foreground">
                                Showing {reportData.total} generated report(s)
                            </div>

                            <button
                                type="submit"
                                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                            >
                                Generate Report
                            </button>
                        </div>
                    </form>

                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Store</th>
                                        <th className="px-4 py-3">Report Name</th>
                                        <th className="px-4 py-3">Partner Type</th>
                                        <th className="px-4 py-3">Date Range</th>
                                        <th className="px-4 py-3">Query Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Download</th>
                                        <th className="px-4 py-3">Expected Finish Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.rows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-4 py-8 text-center text-sm text-muted-foreground"
                                            >
                                                No reports found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.rows.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-t border-border/60"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {row.storeName}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.reportName}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.partnerTypeLabel}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.dateRangeLabel}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getOperationalDateTimeLabel(
                                                        row.queryDate
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        COMPLETED
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <a
                                                        href={row.downloadUrl}
                                                        className="font-semibold text-primary hover:underline"
                                                    >
                                                        DOWNLOAD
                                                    </a>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {row.expectedFinishTime}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
                            <div className="text-muted-foreground">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                {page > 1 ? (
                                    <Link
                                        href={buildHref({ page: String(page - 1) })}
                                        className="rounded-md border px-3 py-1.5"
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="rounded-md border px-3 py-1.5 text-muted-foreground">
                                        Previous
                                    </span>
                                )}

                                {page < totalPages ? (
                                    <Link
                                        href={buildHref({ page: String(page + 1) })}
                                        className="rounded-md border px-3 py-1.5"
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="rounded-md border px-3 py-1.5 text-muted-foreground">
                                        Next
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </DashShell>
    );
}

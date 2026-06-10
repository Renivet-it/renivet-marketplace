import { BitFieldSitePermission } from "@/config/permissions";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
    Activity,
    AlertTriangle,
    Bell,
    CalendarCheck,
    CheckCircle2,
    ClipboardCheck,
    Download,
    FileText,
    Gauge,
    History,
    ShieldCheck,
    TimerReset,
    UsersRound,
} from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const pagePath = "/dashboard/general/monitoring-sla";
const alertSeverities = ["critical", "warning", "info"] as const;
const dashboardTabs = [
    { value: "daily-ops", label: "Daily Ops" },
    { value: "daily-health-summary", label: "Daily Health Summary" },
    { value: "weekly", label: "Weekly Business" },
    { value: "monthly", label: "Monthly Strategic" },
    { value: "brand", label: "Brand Health" },
    { value: "marketing", label: "Marketing Performance" },
    { value: "alerts", label: "Alerts" },
] as const;

type AlertSeverity = (typeof alertSeverities)[number];
type DashboardTab = (typeof dashboardTabs)[number]["value"];

const alertSeverityTabs: Array<{
    value: AlertSeverity | "all";
    label: string;
    className: string;
    activeClassName: string;
}> = [
    {
        value: "all",
        label: "All",
        className: "border-slate-200 bg-white text-slate-700",
        activeClassName: "border-slate-950 bg-slate-950 text-white",
    },
    {
        value: "critical",
        label: "Critical",
        className: "border-red-200 bg-red-50 text-red-800",
        activeClassName: "border-red-700 bg-red-700 text-white",
    },
    {
        value: "warning",
        label: "Warning",
        className: "border-amber-200 bg-amber-50 text-amber-800",
        activeClassName: "border-amber-600 bg-amber-500 text-white",
    },
    {
        value: "info",
        label: "Info",
        className: "border-sky-200 bg-sky-50 text-sky-800",
        activeClassName: "border-sky-700 bg-sky-700 text-white",
    },
];

function finishAction(
    notice: string,
    extraParams: Record<string, string> = {}
): never {
    const params = new URLSearchParams({ notice, ...extraParams });
    revalidatePath(pagePath);
    redirect(`${pagePath}?${params.toString()}`);
}

async function getActor() {
    const { userId } = await auth();
    return userId ?? "system";
}

async function assertMonitoringAccess() {
    const { userId } = await auth();
    if (!userId) notFound();

    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const allowed = hasPermission(
        permissions,
        [
            BitFieldSitePermission.VIEW_MONITORING,
            BitFieldSitePermission.MANAGE_MONITORING,
            BitFieldSitePermission.ADMINISTRATOR,
        ],
        "any"
    );

    if (!allowed) notFound();
    return userId;
}

async function acknowledgeAlert(formData: FormData) {
    "use server";
    const activeAlertSeverity = String(
        formData.get("activeAlertSeverity") ?? ""
    );
    await monitoringSlaQueries.updateAlertStatus("acknowledged", {
        alertId: String(formData.get("alertId")),
        actorId: await getActor(),
        reasonCode: "admin_acknowledged",
        notes: String(
            formData.get("notes") ?? "Acknowledged from monitoring dashboard"
        ),
    });
    finishAction(
        "alert-acknowledged",
        activeAlertSeverity
            ? { activeAlertSeverity, dashboard: "alerts" }
            : { dashboard: "alerts" }
    );
}

async function resolveAlert(formData: FormData) {
    "use server";
    const activeAlertSeverity = String(
        formData.get("activeAlertSeverity") ?? ""
    );
    await monitoringSlaQueries.updateAlertStatus("resolved", {
        alertId: String(formData.get("alertId")),
        actorId: await getActor(),
        reasonCode: "admin_resolved",
        notes: String(
            formData.get("notes") ?? "Resolved from monitoring dashboard"
        ),
    });
    finishAction(
        "alert-resolved",
        activeAlertSeverity
            ? { activeAlertSeverity, dashboard: "alerts" }
            : { dashboard: "alerts" }
    );
}

async function runSlaCheck() {
    "use server";
    await monitoringSlaQueries.runSlaCheck(await getActor());
    finishAction("sla-run");
}

async function generateWeeklyPack() {
    "use server";
    await monitoringSlaQueries.generateWeeklyPack(await getActor());
    finishAction("weekly-pack");
}

async function generateAccessReview() {
    "use server";
    await monitoringSlaQueries.generateAccessReview(await getActor());
    finishAction("access-review");
}

async function generateComplianceExport(formData: FormData) {
    "use server";
    const now = new Date();
    const exportMonth =
        String(formData.get("exportMonth") || "") ||
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const exportType = String(formData.get("exportType") || "alerts");
    await monitoringSlaQueries.generateComplianceExport(
        exportMonth,
        exportType,
        await getActor()
    );
    finishAction("compliance-export", { exportMonth, exportType });
}

function metricLabel(value: number | string) {
    return typeof value === "number" ? value.toLocaleString("en-IN") : value;
}

function rupeeLabelFromPaise(value: number | string) {
    const amount = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(amount)) return "₹0";
    return `₹${(amount / 100).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    })}`;
}

type MetricCardConfig = {
    label: string;
    sublabel: string;
    icon: typeof Activity;
    href: string;
    formatter?: (value: number | string) => string;
};

const metricConfig: Record<string, MetricCardConfig> = {
    ordersPlaced24h: {
        label: "Orders 24H",
        sublabel: "Placed since midnight",
        icon: Activity,
        href: "/dashboard/general/order-ops",
    },
    brandAckAtRisk18h: {
        label: "Ack Risk 18H",
        sublabel: "Brand ack at risk",
        icon: TimerReset,
        href: "/dashboard/general/order-ops",
    },
    ordersUnacknowledged24h: {
        label: "Unmoved Orders",
        sublabel: "Own status unchanged >24h, excluding pickup",
        icon: TimerReset,
        href: "/dashboard/general/order-ops",
    },
    codFraudReviewQueue: {
        label: "COD (Cash On Delivery) Review",
        sublabel: "Fraud screen >4h",
        icon: ShieldCheck,
        href: "/dashboard/general/order-ops",
    },
    ordersShipped24h: {
        label: "Shipped 24H",
        sublabel: "Orders moved to shipped",
        icon: Gauge,
        href: "/dashboard/general/orders",
    },
    stuckOrders48h: {
        label: "Stuck Orders",
        sublabel: "Pickup >48h or delivery >96h",
        icon: AlertTriangle,
        href: "/dashboard/general/order-ops",
    },
    rtoInTransit: {
        label: "RTO (Return To Origin)",
        sublabel: "In transit",
        icon: Gauge,
        href: "/dashboard/general/order-ops",
    },
    rtoDispositionPending7d: {
        label: "RTO (Return To Origin) 7D",
        sublabel: "Disposition pending",
        icon: AlertTriangle,
        href: "/dashboard/general/order-ops",
    },
    pendingCodAmount: {
        label: "Pending COD (Cash On Delivery)",
        sublabel: "Finance reconciliation",
        icon: FileText,
        href: "/dashboard/general/order-ops",
        formatter: rupeeLabelFromPaise,
    },
    deliveredToday: {
        label: "Delivered Today",
        sublabel: "Completed shipments",
        icon: CheckCircle2,
        href: "/dashboard/general/order-ops",
    },
    failedDeliveryToday: {
        label: "Failed Delivery Today",
        sublabel: "Carrier action needed",
        icon: AlertTriangle,
        href: "/dashboard/general/order-ops",
    },
    rtoRateSpike: {
        label: "RTO (Return To Origin) Rate",
        sublabel: "Spike indicator",
        icon: Gauge,
        href: "/dashboard/general/order-ops",
    },
    openTickets: {
        label: "Open Tickets",
        sublabel: "Support queues",
        icon: Bell,
        href: "/dashboard/general/support/user",
    },
    ticketsAged24h: {
        label: "Aged Tickets",
        sublabel: "No response >24h",
        icon: TimerReset,
        href: "/dashboard/general/support/user",
    },
    refundsPendingProcessing: {
        label: "Pending Refunds",
        sublabel: "Finance follow-up",
        icon: FileText,
        href: "/dashboard/general/support/user",
    },
    refundsPendingQc: {
        label: "Refund QC (Quality Check)",
        sublabel: "Pending quality check",
        icon: ClipboardCheck,
        href: "/dashboard/general/return-replace",
    },
    failedPayments: {
        label: "Failed Payments",
        sublabel: "Needs payment review",
        icon: AlertTriangle,
        href: "/dashboard/general/orders",
    },
    brandNonResponseCases: {
        label: "Brand Cases",
        sublabel: "Non-response/onboarding",
        icon: UsersRound,
        href: "/dashboard/general/brands",
    },
    platformUptime24h: {
        label: "Uptime 24H (24 Hours)",
        sublabel: "Alert-derived platform signal",
        icon: Gauge,
        href: "/dashboard/general/monitoring-sla?dashboard=alerts",
    },
    ordersWtd: {
        label: "Orders WTD (Week To Date)",
        sublabel: "Business week activity",
        icon: Activity,
        href: "/dashboard/general/orders",
    },
    gmvWtd: {
        label: "GMV (Gross Merchandise Value) WTD",
        sublabel: "Paid/order value this week",
        icon: Gauge,
        href: "/dashboard/general/monitoring-sla?dashboard=weekly",
        formatter: rupeeLabelFromPaise,
    },
    aovWtd: {
        label: "AOV (Average Order Value) WTD",
        sublabel: "Average order value",
        icon: Gauge,
        href: "/dashboard/general/monitoring-sla?dashboard=weekly",
        formatter: rupeeLabelFromPaise,
    },
    newCustomersWtd: {
        label: "Customers WTD",
        sublabel: "Unique ordering customers",
        icon: UsersRound,
        href: "/dashboard/general/monitoring-sla?dashboard=weekly",
    },
    activeBrands: {
        label: "Active Brands",
        sublabel: "Live brand accounts",
        icon: UsersRound,
        href: "/dashboard/general/brands",
    },
    inactiveOrPendingBrands: {
        label: "Brand Follow-up",
        sublabel: "Inactive or unverified",
        icon: AlertTriangle,
        href: "/dashboard/general/brands",
    },
    pendingRefundAmount: {
        label: "Pending Refund Amt",
        sublabel: "Refund value awaiting action",
        icon: FileText,
        href: "/dashboard/general/support/user",
        formatter: rupeeLabelFromPaise,
    },
    openAlerts: {
        label: "Open Alerts",
        sublabel: "Active system alerts",
        icon: Bell,
        href: "/dashboard/general/monitoring-sla?dashboard=alerts",
    },
    criticalAlerts: {
        label: "Critical Alerts",
        sublabel: "Needs immediate review",
        icon: AlertTriangle,
        href: "/dashboard/general/monitoring-sla?dashboard=alerts",
    },
};

function getStatusConfig(status: "green" | "amber" | "red") {
    if (status === "red") {
        return {
            label: "Red",
            className: "border-red-200 bg-red-50 text-red-950",
            pill: "bg-red-600 text-white",
            accent: "bg-red-500",
        };
    }

    if (status === "amber") {
        return {
            label: "Amber",
            className: "border-amber-200 bg-amber-50 text-amber-950",
            pill: "bg-amber-500 text-white",
            accent: "bg-amber-500",
        };
    }

    return {
        label: "Green",
        className: "border-emerald-200 bg-emerald-50 text-emerald-950",
        pill: "bg-emerald-600 text-white",
        accent: "bg-emerald-600",
    };
}

function getNoticeConfig(notice?: string) {
    switch (notice) {
        case "sla-run":
            return "SLA (Service Level Agreement) check completed. Alerts, delivery attempts, and evidence were refreshed.";
        case "snapshot":
            return "Daily health snapshot saved.";
        case "weekly-pack":
            return "Weekly reporting pack generated.";
        case "access-review":
            return "Access review generated.";
        case "compliance-export":
            return "Compliance export generated. Check the Exports evidence card below.";
        case "alert-acknowledged":
            return "Alert acknowledged and audit evidence recorded.";
        case "alert-resolved":
            return "Alert resolved and audit evidence recorded.";
        default:
            return null;
    }
}

function EvidenceList({ rows }: { rows: string[] }) {
    if (!rows.length) {
        return <p className="text-sm text-muted-foreground">Not generated</p>;
    }

    return (
        <div className="space-y-2">
            {rows.slice(0, 3).map((row) => (
                <p key={row} className="truncate text-sm text-muted-foreground">
                    {row}
                </p>
            ))}
        </div>
    );
}

function signedPercent(value: number) {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(1)}%`;
}

function percentFromRatio(value: number) {
    return `${(value * 100).toFixed(1)}%`;
}

function minutesLabel(value: number | null | undefined) {
    const minutes = Number(value ?? 0);
    if (!Number.isFinite(minutes) || minutes <= 0) return "No data yet";
    if (minutes < 60) return `${Math.round(minutes)}m`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function MetricTile({
    label,
    value,
    detail,
    tone = "neutral",
}: {
    label: string;
    value: string | number;
    detail?: string;
    tone?: "neutral" | "good" | "watch" | "bad";
}) {
    const toneClass = {
        neutral: "border-slate-200 bg-white",
        good: "border-emerald-200 bg-emerald-50",
        watch: "border-amber-200 bg-amber-50",
        bad: "border-red-200 bg-red-50",
    }[tone];

    return (
        <div className={`rounded-lg border p-4 ${toneClass}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
                {metricLabel(value)}
            </p>
            {detail ? (
                <p className="mt-2 text-sm leading-5 text-slate-600">
                    {detail}
                </p>
            ) : null}
        </div>
    );
}

export default async function MonitoringSlaPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await assertMonitoringAccess();
    const params = await searchParams;
    const alertPageRaw = Array.isArray(params.alertPage)
        ? params.alertPage[0]
        : params.alertPage;
    const activeAlertSeverityRaw = Array.isArray(params.activeAlertSeverity)
        ? params.activeAlertSeverity[0]
        : params.activeAlertSeverity;
    const noticeRaw = Array.isArray(params.notice)
        ? params.notice[0]
        : params.notice;
    const dashboardRaw = Array.isArray(params.dashboard)
        ? params.dashboard[0]
        : params.dashboard;
    const generatedExportMonthRaw = Array.isArray(params.exportMonth)
        ? params.exportMonth[0]
        : params.exportMonth;
    const generatedExportTypeRaw = Array.isArray(params.exportType)
        ? params.exportType[0]
        : params.exportType;
    const notice = getNoticeConfig(noticeRaw);
    const activeDashboard = dashboardTabs.some(
        (tab) => tab.value === dashboardRaw
    )
        ? (dashboardRaw as DashboardTab)
        : "daily-health-summary";
    const alertPage = Math.max(1, Number(alertPageRaw ?? "1") || 1);
    const alertPageSize = 10;
    const activeAlertSeverity = alertSeverities.includes(
        activeAlertSeverityRaw as AlertSeverity
    )
        ? (activeAlertSeverityRaw as AlertSeverity)
        : undefined;

    const health = await monitoringSlaQueries.getDailyHealth();

    let alertsPage = { rows: [], pageCount: 0, page: 1 } as any;
    let alertSummary = [] as any[];
    let evidence = { runs: [], snapshots: [], packs: [], exports: [], reviews: [] } as any;
    let weeklyBusiness = null as any;
    let brandHealth = null as any;
    let marketingPerformance = null as any;
    let monthlyStrategic = null as any;

    if (activeDashboard === "alerts") {
        const [p, s, e] = await Promise.all([
            monitoringSlaQueries.getActiveAlertsPage(
                alertPage,
                alertPageSize,
                activeAlertSeverity
            ),
            monitoringSlaQueries.getAlertSummary(),
            monitoringSlaQueries.getRecentEvidence(),
        ]);
        alertsPage = p;
        alertSummary = s;
        evidence = e;
    } else if (activeDashboard === "weekly") {
        weeklyBusiness = await monitoringSlaQueries.getWeeklyBusiness();
    } else if (activeDashboard === "brand") {
        brandHealth = await monitoringSlaQueries.getBrandHealth();
    } else if (activeDashboard === "marketing") {
        marketingPerformance = await monitoringSlaQueries.getMarketingPerformance();
    } else if (activeDashboard === "monthly") {
        monthlyStrategic = await monitoringSlaQueries.getMonthlyStrategic();
    }

    const alerts = alertsPage.rows;
    const pageCount = alertsPage.pageCount;
    const currentAlertPage = Math.min(alertsPage.page, pageCount);
    const alertSeverityCounts = alertSummary.reduce<
        Record<AlertSeverity | "all", number>
    >(
        (counts, row) => {
            if (row.status === "resolved") return counts;
            counts.all += Number(row.count);
            counts[row.severity] += Number(row.count);
            return counts;
        },
        { all: 0, critical: 0, warning: 0, info: 0 }
    );
    const activeAlertSeverityLabel = activeAlertSeverity
        ? `${activeAlertSeverity} `
        : "";
    const makeAlertPageHref = (page: number) => {
        const nextParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (!value || key === "alertPage" || key === "notice") continue;
            nextParams.set(key, Array.isArray(value) ? value[0] : value);
        }
        nextParams.set("alertPage", String(page));
        return `/dashboard/general/monitoring-sla?${nextParams.toString()}`;
    };
    const makeAlertSeverityHref = (severity: AlertSeverity | "all") => {
        const nextParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (
                !value ||
                key === "alertPage" ||
                key === "notice" ||
                key === "activeAlertSeverity"
            ) {
                continue;
            }
            nextParams.set(key, Array.isArray(value) ? value[0] : value);
        }
        if (severity !== "all") {
            nextParams.set("activeAlertSeverity", severity);
        }
        return `/dashboard/general/monitoring-sla?${nextParams.toString()}#active-alerts`;
    };
    const makeDashboardHref = (dashboard: DashboardTab) => {
        const nextParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (!value || key === "notice" || key === "dashboard") continue;
            nextParams.set(key, Array.isArray(value) ? value[0] : value);
        }
        nextParams.set("dashboard", dashboard);
        return `${pagePath}?${nextParams.toString()}`;
    };

    const healthStatus = getStatusConfig(health.status);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const generatedExportHref =
        noticeRaw === "compliance-export"
            ? `/api/admin/monitoring-sla/compliance-export?${new URLSearchParams(
                  {
                      exportMonth: generatedExportMonthRaw || currentMonth,
                      exportType: generatedExportTypeRaw || "alerts",
                      format: "xlsx",
                  }
              ).toString()}`
            : null;
    const founderReportXlsxHref = `/api/admin/monitoring-sla/founder-report?${new URLSearchParams(
        {
            month: currentMonth,
            format: "xlsx",
        }
    ).toString()}`;
    const founderReportCsvHref = `/api/admin/monitoring-sla/founder-report?${new URLSearchParams(
        {
            month: currentMonth,
            format: "csv",
        }
    ).toString()}`;
    const dailyLastRefresh = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(new Date());
    const showFounderReportDownloads = [
        "sla-run",
        "snapshot",
        "weekly-pack",
        "access-review",
    ].includes(noticeRaw ?? "");
    const metricEntries = Object.entries(health.metrics) as Array<
        [keyof typeof metricConfig, number | string]
    >;
    const evidenceCards = [
        {
            title: "SLA (Service Level Agreement) Runs",
            icon: TimerReset,
            rows: evidence.runs.map((item) => `${item.runKey}: ${item.status}`),
        },
        {
            title: "Daily Snapshots",
            icon: CalendarCheck,
            rows: evidence.snapshots.map(
                (item) => `${item.snapshotDate}: ${item.status}`
            ),
        },
        {
            title: "Weekly Packs",
            icon: ClipboardCheck,
            rows: evidence.packs.map(
                (item) => `${item.weekStart} to ${item.weekEnd}`
            ),
        },
        {
            title: "Exports",
            icon: Download,
            rows: evidence.exports.map(
                (item) => `${item.exportMonth}: ${item.exportType}`
            ),
        },
        {
            title: "Access Reviews",
            icon: ShieldCheck,
            rows: evidence.reviews.map(
                (item) => `${item.reviewPeriod}: ${item.status}`
            ),
        },
    ];

    return (
        <main className="min-h-screen bg-slate-50/70 p-4 sm:p-6">
            <div className="mx-auto max-w-[1720px] space-y-5">
                <header className="rounded-md border bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
                                <Activity className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Monitoring, Alerts & SLA (Service Level
                                        Agreement)
                                    </p>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${healthStatus.pill}`}
                                    >
                                        {healthStatus.label}
                                    </span>
                                </div>
                                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                                    Operations Command Center
                                </h1>
                                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                                    {health.metrics.criticalAlerts} critical
                                    alerts, {health.metrics.openAlerts} open
                                    alerts, {health.metrics.openTickets} open
                                    tickets,{" "}
                                    {health.metrics.refundsPendingProcessing}{" "}
                                    pending refunds
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                            <form action={runSlaCheck}>
                                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto">
                                    <TimerReset className="size-4" />
                                    Run SLA (Service Level Agreement)
                                </button>
                            </form>
                            <form action={generateWeeklyPack}>
                                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto">
                                    <ClipboardCheck className="size-4" />
                                    Weekly Pack
                                </button>
                            </form>
                            <form action={generateAccessReview}>
                                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto">
                                    <ShieldCheck className="size-4" />
                                    Access Review
                                </button>
                            </form>
                        </div>
                    </div>
                </header>

                {notice && (
                    <section
                        aria-live="polite"
                        className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm"
                    >
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
                            <CheckCircle2 className="size-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Done</p>
                            <p className="mt-0.5 text-sm text-emerald-900">
                                {notice}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {generatedExportHref && (
                                    <a
                                        href={generatedExportHref}
                                        download
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
                                    >
                                        <Download className="size-4" />
                                        Download Excel
                                    </a>
                                )}
                                {showFounderReportDownloads && (
                                    <>
                                        <a
                                            href={founderReportXlsxHref}
                                            download={`${currentMonth}-weekly-reporting-pack.xlsx`}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
                                        >
                                            <Download className="size-4" />
                                            Download Excel Report
                                        </a>
                                        <a
                                            href={founderReportCsvHref}
                                            download={`${currentMonth}-weekly-reporting-pack.csv`}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-700 bg-white px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                                        >
                                            <Download className="size-4" />
                                            Download CSV Report
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <nav className="flex flex-wrap gap-2 rounded-md border bg-white p-2 shadow-sm">
                    {dashboardTabs.map((tab) => {
                        const active = activeDashboard === tab.value;
                        return (
                            <Link
                                key={tab.value}
                                href={makeDashboardHref(tab.value)}
                                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                                    active
                                        ? "bg-slate-950 text-white"
                                        : "text-slate-700 hover:bg-slate-100"
                                }`}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>

                {activeDashboard === "daily-ops" && (
                    <>
                        <section
                            className={`overflow-hidden rounded-md border shadow-sm ${healthStatus.className}`}
                        >
                            <div className={`h-1.5 ${healthStatus.accent}`} />
                            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,0.8fr)_1fr] lg:items-center">
                                <div>
                                    <p className="text-sm font-semibold">
                                        Daily Ops Dashboard
                                    </p>
                                    <p className="mt-1 text-4xl font-semibold tracking-normal">
                                        {healthStatus.label}
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div>
                                        <p className="text-current/60 text-xs font-semibold uppercase">
                                            Alert Load
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {health.metrics.openAlerts} open /{" "}
                                            {health.metrics.criticalAlerts}{" "}
                                            critical
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-current/60 text-xs font-semibold uppercase">
                                            Queue Load
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {health.metrics.openTickets} tickets
                                            /{" "}
                                            {
                                                health.metrics
                                                    .refundsPendingProcessing
                                            }{" "}
                                            refunds
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-current/60 text-xs font-semibold uppercase">
                                            Business Activity
                                        </p>
                                        <p className="mt-1 text-lg font-semibold">
                                            {health.metrics.ordersPlaced24h}{" "}
                                            today / {health.metrics.ordersWtd}{" "}
                                            WTD (Week To Date)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                            {metricEntries.map(([key, value]) => {
                                const config = metricConfig[key];
                                const Icon = config.icon;

                                return (
                                    <Link
                                        key={key}
                                        href={config.href}
                                        className="group rounded-md border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
                                        aria-label={`Open relevant section for ${config.label}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-950">
                                                    {config.label}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {config.sublabel}
                                                </p>
                                            </div>
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                                                <Icon className="size-4" />
                                            </div>
                                        </div>
                                        <p className="mt-4 text-3xl font-semibold tracking-normal text-slate-950">
                                            {config.formatter
                                                ? config.formatter(value)
                                                : metricLabel(value)}
                                        </p>
                                    </Link>
                                );
                            })}
                        </section>
                    </>
                )}

                {activeDashboard === "daily-health-summary" && (
                    <section className="rounded-md border bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">
                                    Renivet Daily Health
                                </p>
                                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                                    Single-screen operations pulse
                                </h2>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${healthStatus.pill}`}
                                >
                                    {healthStatus.label}
                                </span>
                                <form action={runSlaCheck}>
                                    <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800">
                                        <TimerReset className="size-4" />
                                        Refresh
                                    </button>
                                </form>
                                <Link
                                    href="/dashboard/general/monitoring-sla?dashboard=alerts"
                                    className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                >
                                    Configure
                                </Link>
                            </div>
                        </div>
                        <div className="grid gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3">
                            {[
                                {
                                    title: "Orders",
                                    icon: Activity,
                                    rows: [
                                        [
                                            "New 24h",
                                            health.metrics.ordersPlaced24h,
                                        ],
                                        [
                                            "Shipped 24h",
                                            health.metrics.ordersShipped24h,
                                        ],
                                        [
                                            "Stuck",
                                            health.metrics.stuckOrders48h,
                                        ],
                                        [
                                            "Unmoved >24h",
                                            health.metrics
                                                .ordersUnacknowledged24h,
                                        ],
                                    ],
                                },
                                {
                                    title: "Tickets",
                                    icon: Bell,
                                    rows: [
                                        ["Open", health.metrics.openTickets],
                                        [
                                            "Over SLA",
                                            health.metrics.ticketsAged24h,
                                        ],
                                        [
                                            "Critical alerts",
                                            health.metrics.criticalAlerts,
                                        ],
                                    ],
                                },
                                {
                                    title: "Refunds",
                                    icon: FileText,
                                    rows: [
                                        [
                                            "Pending",
                                            health.metrics
                                                .refundsPendingProcessing,
                                        ],
                                        [
                                            "QC pending",
                                            health.metrics.refundsPendingQc,
                                        ],
                                        [
                                            "Pending amount",
                                            rupeeLabelFromPaise(
                                                health.metrics
                                                    .pendingRefundAmount
                                            ),
                                        ],
                                    ],
                                },
                                {
                                    title: "Brands",
                                    icon: UsersRound,
                                    rows: [
                                        ["Active", health.metrics.activeBrands],
                                        [
                                            "Non-response",
                                            health.metrics
                                                .brandNonResponseCases,
                                        ],
                                        [
                                            "Follow-up",
                                            health.metrics
                                                .inactiveOrPendingBrands,
                                        ],
                                    ],
                                },
                                {
                                    title: "Platform",
                                    icon: Gauge,
                                    rows: [
                                        [
                                            "Uptime 24h",
                                            health.metrics.platformUptime24h,
                                        ],
                                        [
                                            "Open alerts",
                                            health.metrics.openAlerts,
                                        ],
                                        [
                                            "COD review",
                                            health.metrics.codFraudReviewQueue,
                                        ],
                                    ],
                                },
                                {
                                    title: "Business WTD",
                                    icon: ClipboardCheck,
                                    rows: [
                                        ["GMV", rupeeLabelFromPaise(health.metrics.gmvWtd)],
                                        ["Orders", health.metrics.ordersWtd],
                                        ["AOV", rupeeLabelFromPaise(health.metrics.aovWtd)],
                                        [
                                            "Customers",
                                            health.metrics.newCustomersWtd,
                                        ],
                                    ],
                                },
                            ].map((group) => {
                                const Icon = group.icon;
                                return (
                                    <div
                                        key={group.title}
                                        className="rounded-md border bg-slate-50 p-4"
                                    >
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <h3 className="font-semibold text-slate-950">
                                                {group.title}
                                            </h3>
                                            <div className="flex size-9 items-center justify-center rounded-md bg-white text-slate-700">
                                                <Icon className="size-4" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {group.rows.map(
                                                ([label, value]) => (
                                                    <div
                                                        key={`${group.title}-${label}`}
                                                        className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm"
                                                    >
                                                        <span className="text-muted-foreground">
                                                            {label}
                                                        </span>
                                                        <span className="font-semibold text-slate-950">
                                                            {metricLabel(value)}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
                            Last refresh: {dailyLastRefresh}
                        </div>
                    </section>
                )}

                {activeDashboard === "weekly" && (
                    <section className="space-y-4">
                        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                            <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 text-white">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                            Dashboard 2
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold">
                                            Weekly Business
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-300">
                                            {weeklyBusiness.weekStart} to{" "}
                                            {weeklyBusiness.weekEnd}
                                        </p>
                                    </div>
                                    <div className="grid gap-2 text-sm text-slate-200 sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                                Owner
                                            </p>
                                            <p className="font-semibold text-white">
                                                AJ presents to founders
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                                Source
                                            </p>
                                            <p className="font-semibold text-white">
                                                Admin analytics + Finance
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                                Review
                                            </p>
                                            <p className="font-semibold text-white">
                                                Friday 5pm, 30 minutes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                                <MetricTile
                                    label="GMV this week"
                                    value={rupeeLabelFromPaise(
                                        weeklyBusiness.gmv
                                    )}
                                    detail={`${signedPercent(
                                        weeklyBusiness.gmvWoW
                                    )} vs last week · ${signedPercent(
                                        weeklyBusiness.gmvVsPriorFourWeekAvg
                                    )} vs prior 4-week avg`}
                                    tone={
                                        weeklyBusiness.gmvWoW >= 0
                                            ? "good"
                                            : "watch"
                                    }
                                />
                                <MetricTile
                                    label="Orders"
                                    value={weeklyBusiness.orderCount}
                                    detail={`${signedPercent(
                                        weeklyBusiness.orderVolumeWoW
                                    )} vs last week · ${
                                        weeklyBusiness.customerCount -
                                        weeklyBusiness.repeatCustomers
                                    } new / ${
                                        weeklyBusiness.repeatCustomers
                                    } repeat customers`}
                                    tone={
                                        weeklyBusiness.orderVolumeWoW >= 0
                                            ? "good"
                                            : "watch"
                                    }
                                />
                                <MetricTile
                                    label="AOV trend"
                                    value={rupeeLabelFromPaise(
                                        weeklyBusiness.aov
                                    )}
                                    detail={`${signedPercent(
                                        weeklyBusiness.aovWoW
                                    )} vs last week · prior ${rupeeLabelFromPaise(
                                        weeklyBusiness.previousAov
                                    )}`}
                                    tone={
                                        weeklyBusiness.aovWoW >= 0
                                            ? "good"
                                            : "watch"
                                    }
                                />
                                <MetricTile
                                    label="Active brands"
                                    value={weeklyBusiness.activeBrands}
                                    detail={`${weeklyBusiness.sellingBrandsThisWeek} selling this week · ${weeklyBusiness.sellingBrandsPreviousWeek} selling last week`}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Conversion funnel
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Visit to cart to checkout to
                                                paid order.
                                            </p>
                                        </div>
                                        <Gauge className="size-5 text-slate-500" />
                                    </div>
                                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                                        {[
                                            [
                                                "Visit",
                                                weeklyBusiness.conversionFunnel
                                                    .sessions,
                                                "Sessions",
                                            ],
                                            [
                                                "Cart",
                                                weeklyBusiness.conversionFunnel
                                                    .carts,
                                                `${percentFromRatio(
                                                    weeklyBusiness
                                                        .conversionFunnel
                                                        .cartRate
                                                )} from visits`,
                                            ],
                                            [
                                                "Checkout",
                                                weeklyBusiness.conversionFunnel
                                                    .checkouts,
                                                `${percentFromRatio(
                                                    weeklyBusiness
                                                        .conversionFunnel
                                                        .checkoutRate
                                                )} from carts`,
                                            ],
                                            [
                                                "Paid",
                                                weeklyBusiness.conversionFunnel
                                                    .paid,
                                                `${percentFromRatio(
                                                    weeklyBusiness
                                                        .conversionFunnel
                                                        .paidRate
                                                )} from checkout`,
                                            ],
                                        ].map(([label, value, detail]) => (
                                            <div
                                                key={label}
                                                className="rounded-lg border bg-slate-50 p-4"
                                            >
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    {label}
                                                </p>
                                                <p className="mt-2 text-2xl font-semibold text-slate-950">
                                                    {metricLabel(value)}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {detail}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-lg border bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Customer support metrics
                                            </h3>
                                            <Bell className="size-5 text-slate-500" />
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            {[
                                                [
                                                    "Tickets opened",
                                                    weeklyBusiness
                                                        .supportMetrics
                                                        .ticketsOpened,
                                                ],
                                                [
                                                    "Tickets resolved",
                                                    weeklyBusiness
                                                        .supportMetrics
                                                        .ticketsResolved,
                                                ],
                                                [
                                                    "Open tickets",
                                                    weeklyBusiness
                                                        .supportOpenTickets,
                                                ],
                                                [
                                                    "Avg first response",
                                                    minutesLabel(
                                                        weeklyBusiness
                                                            .supportMetrics
                                                            .avgFirstResponseMinutes
                                                    ),
                                                ],
                                                [
                                                    "Avg resolution",
                                                    minutesLabel(
                                                        weeklyBusiness
                                                            .supportMetrics
                                                            .avgResolutionMinutes
                                                    ),
                                                ],
                                                [
                                                    "CSAT",
                                                    String(
                                                        weeklyBusiness
                                                            .supportMetrics
                                                            .csatAverage ??
                                                            "No data yet"
                                                    ),
                                                ],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="rounded-md bg-slate-50 px-3 py-2"
                                                >
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {label}
                                                    </p>
                                                    <p className="mt-1 text-lg font-semibold text-slate-950">
                                                        {metricLabel(value)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-lg border bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Refunds and RTO
                                            </h3>
                                            <FileText className="size-5 text-slate-500" />
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <MetricTile
                                                label="Refund rate"
                                                value={percentFromRatio(
                                                    weeklyBusiness.refundRate
                                                )}
                                                detail={`${weeklyBusiness.refundCount} refunds · ${rupeeLabelFromPaise(
                                                    weeklyBusiness.refundAmount
                                                )}`}
                                                tone={
                                                    weeklyBusiness.refundRate > 0.1
                                                        ? "watch"
                                                        : "neutral"
                                                }
                                            />
                                            <MetricTile
                                                label="RTO rate"
                                                value={percentFromRatio(
                                                    weeklyBusiness.rtoRate
                                                )}
                                                detail={`${weeklyBusiness.rtoShipments} RTO · ${weeklyBusiness.deliveredShipments} delivered`}
                                                tone={
                                                    weeklyBusiness.rtoRate > 0.1
                                                        ? "watch"
                                                        : "neutral"
                                                }
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Refund rate by reason code
                                            </p>
                                            <div className="mt-2 space-y-2">
                                                {weeklyBusiness.refundReasons
                                                    .length === 0 ? (
                                                    <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
                                                        No refunds this week.
                                                    </p>
                                                ) : (
                                                    weeklyBusiness.refundReasons.map(
                                                        (reason) => (
                                                            <div
                                                                key={
                                                                    reason.reasonCode
                                                                }
                                                                className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                            >
                                                                <span className="truncate text-slate-700">
                                                                    {
                                                                        reason.reasonCode
                                                                    }
                                                                </span>
                                                                <span className="font-semibold text-slate-950">
                                                                    {
                                                                        reason.count
                                                                    }{" "}
                                                                    ·{" "}
                                                                    {rupeeLabelFromPaise(
                                                                        reason.amount
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-lg border bg-white p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-slate-950">
                                            CAC by channel
                                        </h3>
                                        <div className="mt-4 space-y-2">
                                            {weeklyBusiness.cacByChannel.map(
                                                (row) => (
                                                    <div
                                                        key={row.channel}
                                                        className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                    >
                                                        <span className="text-slate-700">
                                                            {row.channel}
                                                        </span>
                                                        <span className="font-semibold text-slate-950">
                                                            {row.value}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border bg-white p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-slate-950">
                                            ROAS by channel
                                        </h3>
                                        <div className="mt-4 space-y-2">
                                            {weeklyBusiness.roasByChannel.map(
                                                (row) => (
                                                    <div
                                                        key={row.channel}
                                                        className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                    >
                                                        <span className="text-slate-700">
                                                            {row.channel}
                                                        </span>
                                                        <span className="font-semibold text-slate-950">
                                                            {row.value}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <aside className="space-y-4">
                                {[
                                    ["Top 5 brands by GMV", weeklyBusiness.topBrands],
                                    [
                                        "Bottom 5 brands by GMV",
                                        weeklyBusiness.bottomBrands,
                                    ],
                                ].map(([title, rows]) => (
                                    <div
                                        key={title as string}
                                        className="rounded-lg border bg-white p-5 shadow-sm"
                                    >
                                        <h3 className="text-base font-semibold text-slate-950">
                                            {title as string}
                                        </h3>
                                        <div className="mt-4 space-y-2">
                                            {(
                                                rows as Array<{
                                                    name: string;
                                                    gmv: number;
                                                }>
                                            ).length === 0 ? (
                                                <p className="rounded-md bg-slate-50 px-3 py-6 text-center text-sm text-muted-foreground">
                                                    No weekly sales yet.
                                                </p>
                                            ) : (
                                                (
                                                    rows as Array<{
                                                        name: string;
                                                        gmv: number;
                                                    }>
                                                ).map((row, index) => (
                                                    <div
                                                        key={`${title}-${row.name}`}
                                                        className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                    >
                                                        <span className="min-w-0 truncate text-slate-700">
                                                            {index + 1}.{" "}
                                                            {row.name}
                                                        </span>
                                                        <span className="font-semibold text-slate-950">
                                                            {rupeeLabelFromPaise(
                                                                row.gmv
                                                            )}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="rounded-lg border bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base font-semibold text-slate-950">
                                            SLA breach count by function
                                        </h3>
                                        <AlertTriangle className="size-5 text-slate-500" />
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {weeklyBusiness.slaBreachesByFunction
                                            .length === 0 ? (
                                            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                                                No critical SLA breaches this
                                                week.
                                            </p>
                                        ) : (
                                            weeklyBusiness.slaBreachesByFunction.map(
                                                (row) => (
                                                    <div
                                                        key={row.functionName}
                                                        className="flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-sm"
                                                    >
                                                        <span className="capitalize text-red-900">
                                                            {row.functionName.replaceAll(
                                                                "_",
                                                                " "
                                                            )}
                                                        </span>
                                                        <span className="font-semibold text-red-950">
                                                            {row.count}
                                                        </span>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Data sources used
                                    </h3>
                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                        <p>
                                            GMV, orders, AOV, customers: orders
                                        </p>
                                        <p>
                                            Brand ranking: order_items,
                                            products, brands
                                        </p>
                                        <p>
                                            Funnel: analytics_daily_behavior
                                        </p>
                                        <p>
                                            Support: support_tickets and
                                            user_support_tickets
                                        </p>
                                        <p>
                                            Refunds: refunds
                                        </p>
                                        <p>
                                            RTO: order_shipments
                                        </p>
                                        <p>
                                            SLA breaches: monitoring_alerts
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </section>
                )}

                <section
                    className={
                        activeDashboard === "brand" ||
                        activeDashboard === "marketing" ||
                        activeDashboard === "monthly"
                            ? "grid gap-4 xl:grid-cols-3"
                            : "hidden"
                    }
                >
                    <div
                        id="brand-health"
                        className={`scroll-mt-24 rounded-md border bg-white p-4 shadow-sm ${
                            activeDashboard === "brand" ? "" : "hidden"
                        }`}
                    >
                        {activeDashboard === "brand" && brandHealth && (
                            <>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">
                                    Brand Health
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Brand owner Monday review dashboard
                                </p>
                            </div>
                            <UsersRound className="size-5 text-muted-foreground" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                ["Active brands", brandHealth.activeBrands],
                                ["Paused brands", brandHealth.pausedBrands],
                                [
                                    "Pending verification",
                                    brandHealth.pendingVerification,
                                ],
                                ["Active products", brandHealth.activeProducts],
                                [
                                    "Brands no orders 30d",
                                    brandHealth.brandsWithNoOrders30dCount,
                                ],
                                [
                                    "Certs expiring 30d",
                                    brandHealth.certExpiring30d,
                                ],
                                [
                                    "Contracts expiring 30d",
                                    brandHealth.contractExpiring30d,
                                ],
                                [
                                    "Low inventory SKUs",
                                    brandHealth.lowInventoryVariants,
                                ],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-md border bg-slate-50 px-3 py-2"
                                >
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {label}
                                    </p>
                                    <p className="mt-1 text-xl font-semibold text-slate-950">
                                        {metricLabel(value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                            </>
                        )}
                    </div>

                    <div
                        id="marketing-performance"
                        className={`scroll-mt-24 space-y-4 xl:col-span-3 ${
                            activeDashboard === "marketing" ? "" : "hidden"
                        }`}
                    >
                        {activeDashboard === "marketing" && marketingPerformance && (
                            <>
                        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                            <div className="bg-[radial-gradient(circle_at_top_left,#fee2e2,transparent_36%),linear-gradient(135deg,#7f1d1d,#111827)] p-6 text-white">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-100">
                                            Dashboard 5
                                        </p>
                                        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                            Marketing Performance
                                        </h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-50">
                                            Weekly PS + freelancer review for
                                            spend, CAC, ROAS, source traffic,
                                            creatives, content output, and
                                            campaign performance versus goals.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 rounded-xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur sm:grid-cols-2 lg:min-w-[460px]">
                                        {[
                                            ["Owner", marketingPerformance.owner],
                                            ["Source", marketingPerformance.source],
                                            [
                                                "Review",
                                                marketingPerformance.reviewCadence,
                                            ],
                                            [
                                                "Window",
                                                `${marketingPerformance.weekStart} to ${marketingPerformance.weekEnd}`,
                                            ],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p className="text-xs uppercase tracking-wide text-rose-100">
                                                    {label}
                                                </p>
                                                <p className="mt-1 font-semibold text-white">
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                                <MetricTile
                                    label="Spend this week"
                                    value={rupeeLabelFromPaise(
                                        marketingPerformance.totalSpend
                                    )}
                                    detail={marketingPerformance.integrations.metaAds}
                                />
                                <MetricTile
                                    label="Blended CAC"
                                    value={
                                        marketingPerformance.blendedCac === null
                                            ? "Needs spend + customers"
                                            : rupeeLabelFromPaise(
                                                  marketingPerformance.blendedCac
                                              )
                                    }
                                    detail={`${marketingPerformance.customersWtd} customers this week`}
                                />
                                <MetricTile
                                    label="Blended ROAS"
                                    value={
                                        marketingPerformance.blendedRoas === null
                                            ? "Needs spend"
                                            : `${marketingPerformance.blendedRoas.toFixed(2)}x`
                                    }
                                    detail={`${rupeeLabelFromPaise(
                                        marketingPerformance.gmvWtd
                                    )} weekly GMV`}
                                />
                                <MetricTile
                                    label="Campaign goal"
                                    value={`${marketingPerformance.goals.roas.toFixed(
                                        1
                                    )}x ROAS`}
                                    detail={`CAC goal ${rupeeLabelFromPaise(
                                        marketingPerformance.goals.cac
                                    )}`}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
                            <div className="space-y-4">
                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Spend, CAC, and ROAS by channel
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Meta, Google, organic, and
                                                partnerships in the required
                                                order.
                                            </p>
                                        </div>
                                        <Gauge className="size-5 text-slate-500" />
                                    </div>
                                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                        {marketingPerformance.channelPerformance.map(
                                            (row) => (
                                                <div
                                                    key={row.channel}
                                                    className="rounded-lg border bg-slate-50 p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-slate-950">
                                                                {row.channel}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {row.source}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                                                            {row.roas === null
                                                                ? "No ROAS"
                                                                : `${row.roas.toFixed(
                                                                      2
                                                                  )}x`}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Spend
                                                            </p>
                                                            <p className="font-semibold text-slate-950">
                                                                {rupeeLabelFromPaise(
                                                                    row.spend
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                CAC
                                                            </p>
                                                            <p className="font-semibold text-slate-950">
                                                                {row.cac === null
                                                                    ? "N/A"
                                                                    : rupeeLabelFromPaise(
                                                                          row.cac
                                                                      )}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Conv.
                                                            </p>
                                                            <p className="font-semibold text-slate-950">
                                                                {
                                                                    row.conversions
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-xl border bg-white p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-slate-950">
                                            Traffic by source
                                        </h3>
                                        <div className="mt-4 space-y-2">
                                            {marketingPerformance.trafficBySource
                                                .length === 0 ? (
                                                <p className="rounded-md bg-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                                                    No source traffic data yet.
                                                </p>
                                            ) : (
                                                marketingPerformance.trafficBySource.map(
                                                    (row) => (
                                                        <div
                                                            key={row.source}
                                                            className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                        >
                                                            <span className="capitalize text-slate-700">
                                                                {row.source.replaceAll(
                                                                    "_",
                                                                    " "
                                                                )}
                                                            </span>
                                                            <span className="font-semibold text-slate-950">
                                                                {row.sessions}{" "}
                                                                sessions
                                                            </span>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-white p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-slate-950">
                                            Conversion rate by source
                                        </h3>
                                        <div className="mt-4 space-y-2">
                                            {marketingPerformance.conversionBySource
                                                .length === 0 ? (
                                                <p className="rounded-md bg-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                                                    No source conversion data
                                                    yet.
                                                </p>
                                            ) : (
                                                marketingPerformance.conversionBySource.map(
                                                    (row) => (
                                                        <div
                                                            key={row.source}
                                                            className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                        >
                                                            <span className="capitalize text-slate-700">
                                                                {row.source.replaceAll(
                                                                    "_",
                                                                    " "
                                                                )}
                                                            </span>
                                                            <span className="font-semibold text-slate-950">
                                                                {percentFromRatio(
                                                                    row.conversionRate
                                                                )}
                                                            </span>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Campaign-level performance vs goal
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        {marketingPerformance.campaignPerformance
                                            .length === 0 ? (
                                            <p className="rounded-md bg-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                                                Connect Meta Ads to show
                                                campaign-level performance.
                                            </p>
                                        ) : (
                                            marketingPerformance.campaignPerformance.map(
                                                (row) => (
                                                    <div
                                                        key={row.id}
                                                        className="rounded-lg border bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="font-semibold text-slate-950">
                                                                {row.name}
                                                            </p>
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                                    row.goalStatus ===
                                                                    "On goal"
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : "bg-amber-100 text-amber-800"
                                                                }`}
                                                            >
                                                                {row.goalStatus}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-sm text-muted-foreground">
                                                            Spend{" "}
                                                            {rupeeLabelFromPaise(
                                                                row.spend
                                                            )}{" "}
                                                            | ROAS{" "}
                                                            {row.roas === null
                                                                ? "N/A"
                                                                : `${row.roas.toFixed(
                                                                      2
                                                                  )}x`}{" "}
                                                            | CAC{" "}
                                                            {row.cac === null
                                                                ? "N/A"
                                                                : rupeeLabelFromPaise(
                                                                      row.cac
                                                                  )}
                                                        </p>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            <aside className="space-y-4">
                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Top performing creatives
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        {marketingPerformance.topCreatives
                                            .length === 0 ? (
                                            <p className="rounded-md bg-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                                                Connect Meta Ads to show top
                                                creatives from the last 7 days.
                                            </p>
                                        ) : (
                                            marketingPerformance.topCreatives.map(
                                                (row) => (
                                                    <div
                                                        key={row.id}
                                                        className="rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                    >
                                                        <p className="font-semibold text-slate-950">
                                                            {row.name}
                                                        </p>
                                                        <p className="mt-1 text-muted-foreground">
                                                            {row.campaign} |
                                                            ROAS{" "}
                                                            {row.roas.toFixed(
                                                                2
                                                            )}
                                                            x | CTR{" "}
                                                            {percentFromRatio(
                                                                row.ctr
                                                            )}
                                                        </p>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Underperforming creatives
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        {marketingPerformance
                                            .underperformingCreatives.length ===
                                        0 ? (
                                            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                                                No creative is currently flagged
                                                for replacement.
                                            </p>
                                        ) : (
                                            marketingPerformance.underperformingCreatives.map(
                                                (row) => (
                                                    <div
                                                        key={row.id}
                                                        className="rounded-md bg-amber-50 px-3 py-2 text-sm"
                                                    >
                                                        <p className="font-semibold text-amber-950">
                                                            {row.name}
                                                        </p>
                                                        <p className="mt-1 text-amber-800">
                                                            Spend{" "}
                                                            {rupeeLabelFromPaise(
                                                                row.spend
                                                            )}{" "}
                                                            | ROAS{" "}
                                                            {row.roas.toFixed(
                                                                2
                                                            )}
                                                            x below{" "}
                                                            {marketingPerformance.goals.roas.toFixed(
                                                                1
                                                            )}
                                                            x goal
                                                        </p>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Content output vs target
                                    </h3>
                                    <div className="mt-4 space-y-2">
                                        {marketingPerformance.contentOutput.map(
                                            (row) => (
                                                <div
                                                    key={row.type}
                                                    className="rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="font-semibold text-slate-950">
                                                            {row.type}
                                                        </span>
                                                        <span className="font-semibold text-slate-950">
                                                            {row.count}/
                                                            {row.target}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {row.source}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Integration keys
                                    </h3>
                                    <div className="mt-4 space-y-2 text-sm">
                                        {[
                                            ["Meta Ads", marketingPerformance.integrations.metaAds],
                                            ["Instagram", marketingPerformance.integrations.instagram],
                                            ["Google Ads", marketingPerformance.integrations.googleAds],
                                        ].map(([label, value]) => (
                                            <div
                                                key={label}
                                                className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
                                            >
                                                <span className="font-medium text-slate-700">
                                                    {label}
                                                </span>
                                                <span className="text-right text-slate-950">
                                                    {value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>
                            </>
                        )}
                    </div>

                    <div
                        id="monthly-strategic"
                        className={`scroll-mt-24 space-y-4 xl:col-span-3 ${
                            activeDashboard === "monthly" ? "" : "hidden"
                        }`}
                    >
                        {activeDashboard === "monthly" && monthlyStrategic && (
                            <>
                        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                            <div className="bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_35%),linear-gradient(135deg,#064e3b,#0f172a)] p-6 text-white">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">
                                            Dashboard 3
                                        </p>
                                        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                            Monthly Strategic
                                        </h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                                            Founder review for retention, brand
                                            churn, unit economics, category mix,
                                            runway, compliance, and
                                            sustainability claims.
                                        </p>
                                    </div>
                                    <div className="grid gap-2 rounded-xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur sm:grid-cols-2 lg:min-w-[460px]">
                                        {[
                                            ["Owner", monthlyStrategic.owner],
                                            ["Source", monthlyStrategic.source],
                                            [
                                                "Review",
                                                monthlyStrategic.reviewCadence,
                                            ],
                                            [
                                                "Time",
                                                monthlyStrategic.timeToReview,
                                            ],
                                        ].map(([label, value]) => (
                                            <div key={label}>
                                                <p className="text-xs uppercase tracking-wide text-emerald-100">
                                                    {label}
                                                </p>
                                                <p className="mt-1 font-semibold text-white">
                                                    {value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
                                <MetricTile
                                    label="GMV this month"
                                    value={rupeeLabelFromPaise(
                                        monthlyStrategic.currentMonth.gmv
                                    )}
                                    detail={`${signedPercent(
                                        monthlyStrategic.gmvMoM
                                    )} vs ${monthlyStrategic.previousMonthLabel}`}
                                    tone={
                                        monthlyStrategic.gmvMoM >= 0
                                            ? "good"
                                            : "watch"
                                    }
                                />
                                <MetricTile
                                    label="Order volume"
                                    value={
                                        monthlyStrategic.currentMonth.orderCount
                                    }
                                    detail={`${signedPercent(
                                        monthlyStrategic.orderMoM
                                    )} month over month`}
                                    tone={
                                        monthlyStrategic.orderMoM >= 0
                                            ? "good"
                                            : "watch"
                                    }
                                />
                                <MetricTile
                                    label="Brand churn rate"
                                    value={percentFromRatio(
                                        monthlyStrategic.brandChurnRate
                                    )}
                                    detail={`${monthlyStrategic.churnedBrands} churned from ${monthlyStrategic.priorActiveBrands} prior active brands`}
                                    tone={
                                        monthlyStrategic.brandChurnRate > 0.15
                                            ? "bad"
                                            : monthlyStrategic.brandChurnRate > 0
                                              ? "watch"
                                              : "good"
                                    }
                                />
                                <MetricTile
                                    label="Contribution / order"
                                    value={rupeeLabelFromPaise(
                                        monthlyStrategic.contributionMarginPerOrder
                                    )}
                                    detail={`${percentFromRatio(
                                        monthlyStrategic.contributionMarginRate
                                    )} contribution margin`}
                                    tone={
                                        monthlyStrategic.contributionMargin < 0
                                            ? "bad"
                                            : "neutral"
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                            <div className="space-y-4">
                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Cohort retention
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                M0 to M1 to M2 to M3 for the
                                                last 6 cohorts.
                                            </p>
                                        </div>
                                        <UsersRound className="size-5 text-slate-500" />
                                    </div>
                                    <div className="mt-4 overflow-hidden rounded-lg border">
                                        <div className="grid grid-cols-5 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                                            <span>Cohort</span>
                                            <span className="text-right">M0</span>
                                            <span className="text-right">M1</span>
                                            <span className="text-right">M2</span>
                                            <span className="text-right">M3</span>
                                        </div>
                                        {monthlyStrategic.cohortRetention.length ===
                                        0 ? (
                                            <p className="bg-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                                                No cohort data yet.
                                            </p>
                                        ) : (
                                            monthlyStrategic.cohortRetention.map(
                                                (row) => (
                                                    <div
                                                        key={row.cohort}
                                                        className="grid grid-cols-5 border-t p-3 text-sm"
                                                    >
                                                        <span className="font-semibold text-slate-900">
                                                            {row.cohort}
                                                        </span>
                                                        <span className="text-right text-slate-700">
                                                            {row.m0Users}
                                                        </span>
                                                        <span className="text-right font-semibold text-slate-950">
                                                            {percentFromRatio(
                                                                row.m1Rate
                                                            )}
                                                        </span>
                                                        <span className="text-right font-semibold text-slate-950">
                                                            {percentFromRatio(
                                                                row.m2Rate
                                                            )}
                                                        </span>
                                                        <span className="text-right font-semibold text-slate-950">
                                                            {percentFromRatio(
                                                                row.m3Rate
                                                            )}
                                                        </span>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-xl border bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Contribution margin per order
                                            </h3>
                                            <Gauge className="size-5 text-slate-500" />
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <MetricTile
                                                label="Order revenue"
                                                value={rupeeLabelFromPaise(
                                                    monthlyStrategic
                                                        .contributionBreakdown
                                                        .revenue
                                                )}
                                                detail={`${monthlyStrategic.contributionBreakdown.orderCount} paid orders`}
                                            />
                                            <MetricTile
                                                label="Contribution margin"
                                                value={rupeeLabelFromPaise(
                                                    monthlyStrategic.contributionMargin
                                                )}
                                                detail={percentFromRatio(
                                                    monthlyStrategic.contributionMarginRate
                                                )}
                                                tone={
                                                    monthlyStrategic.contributionMargin < 0
                                                        ? "bad"
                                                        : "neutral"
                                                }
                                            />
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {[
                                                [
                                                    "Product cost",
                                                    monthlyStrategic
                                                        .contributionBreakdown
                                                        .productCost,
                                                ],
                                                [
                                                    "Shipping / delivery",
                                                    monthlyStrategic
                                                        .contributionBreakdown
                                                        .shipping,
                                                ],
                                                [
                                                    "Platform fee",
                                                    monthlyStrategic
                                                        .contributionBreakdown
                                                        .platformFee,
                                                ],
                                                [
                                                    "Gateway",
                                                    monthlyStrategic
                                                        .contributionBreakdown
                                                        .gateway,
                                                ],
                                                [
                                                    "Packaging",
                                                    monthlyStrategic
                                                        .contributionBreakdown
                                                        .packaging,
                                                ],
                                            ].map(([label, value]) => (
                                                <div
                                                    key={label}
                                                    className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                >
                                                    <span className="text-slate-700">
                                                        {label}
                                                    </span>
                                                    <span className="font-semibold text-slate-950">
                                                        {rupeeLabelFromPaise(
                                                            value
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                            {
                                                monthlyStrategic
                                                    .contributionBreakdown.note
                                            }
                                        </p>
                                    </div>

                                    <div className="rounded-xl border bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Gross margin by category
                                            </h3>
                                            <FileText className="size-5 text-slate-500" />
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {monthlyStrategic
                                                .grossMarginByCategory
                                                .length === 0 ? (
                                                <p className="rounded-md bg-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                                                    No category sales this
                                                    month.
                                                </p>
                                            ) : (
                                                monthlyStrategic.grossMarginByCategory.map(
                                                    (row) => (
                                                        <div
                                                            key={row.category}
                                                            className="rounded-md bg-slate-50 p-3"
                                                        >
                                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                                <span className="truncate font-semibold text-slate-900">
                                                                    {
                                                                        row.category
                                                                    }
                                                                </span>
                                                                <span className="font-semibold text-slate-950">
                                                                    {percentFromRatio(
                                                                        row.grossMargin
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-xs text-muted-foreground">
                                                                Revenue{" "}
                                                                {rupeeLabelFromPaise(
                                                                    row.revenue
                                                                )}{" "}
                                                                | Cost{" "}
                                                                {rupeeLabelFromPaise(
                                                                    row.productCost
                                                                )}
                                                            </p>
                                                        </div>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-950">
                                                Category mix evolution
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Current category revenue share
                                                versus previous month.
                                            </p>
                                        </div>
                                        <Activity className="size-5 text-slate-500" />
                                    </div>
                                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                        {monthlyStrategic.categoryMixEvolution
                                            .length === 0 ? (
                                            <p className="rounded-md bg-slate-50 px-3 py-8 text-center text-sm text-muted-foreground lg:col-span-2">
                                                No category mix data yet.
                                            </p>
                                        ) : (
                                            monthlyStrategic.categoryMixEvolution.map(
                                                (row) => (
                                                    <div
                                                        key={row.category}
                                                        className="rounded-lg border bg-slate-50 p-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-semibold text-slate-950">
                                                                    {
                                                                        row.category
                                                                    }
                                                                </p>
                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                    Share{" "}
                                                                    {percentFromRatio(
                                                                        row.currentShare
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                                    row.revenueChange >=
                                                                    0
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : "bg-amber-100 text-amber-800"
                                                                }`}
                                                            >
                                                                {signedPercent(
                                                                    row.revenueChange
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                                            <span className="text-slate-600">
                                                                Current{" "}
                                                                {rupeeLabelFromPaise(
                                                                    row.currentRevenue
                                                                )}
                                                            </span>
                                                            <span className="text-slate-600">
                                                                Prior{" "}
                                                                {rupeeLabelFromPaise(
                                                                    row.previousRevenue
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            <aside className="space-y-4">
                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Headcount efficiency
                                    </h3>
                                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                                        {rupeeLabelFromPaise(
                                            monthlyStrategic.headcountEfficiency
                                                .value
                                        )}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        GMV per FTE-equivalent
                                    </p>
                                    <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm leading-5 text-amber-900">
                                        {
                                            monthlyStrategic.headcountEfficiency
                                                .note
                                        }
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Runway
                                    </h3>
                                    <p className="mt-3 rounded-md bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800">
                                        {monthlyStrategic.runway}
                                    </p>
                                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                        Formula: cash on hand / monthly burn.
                                    </p>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base font-semibold text-slate-950">
                                            Compliance status snapshot
                                        </h3>
                                        <ShieldCheck className="size-5 text-slate-500" />
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {[
                                            [
                                                "Filings / exports this month",
                                                monthlyStrategic
                                                    .complianceStatusSnapshot
                                                    .complianceExports,
                                            ],
                                            [
                                                "Access reviews",
                                                monthlyStrategic
                                                    .complianceStatusSnapshot
                                                    .accessReviews,
                                            ],
                                            [
                                                "Evidence events",
                                                monthlyStrategic
                                                    .complianceStatusSnapshot
                                                    .evidenceEvents,
                                            ],
                                            [
                                                "Open critical alerts",
                                                monthlyStrategic
                                                    .complianceStatusSnapshot
                                                    .openCriticalAlerts,
                                            ],
                                        ].map(([label, value]) => (
                                            <div
                                                key={label}
                                                className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                                            >
                                                <span className="text-slate-700">
                                                    {label}
                                                </span>
                                                <span className="font-semibold text-slate-950">
                                                    {metricLabel(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base font-semibold text-slate-950">
                                            Sustainability claims audit
                                        </h3>
                                        <ClipboardCheck className="size-5 text-slate-500" />
                                    </div>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                        <MetricTile
                                            label="Valid cert coverage"
                                            value={percentFromRatio(
                                                monthlyStrategic
                                                    .sustainabilityClaimsAudit
                                                    .certCoverage
                                            )}
                                            detail={`${monthlyStrategic.sustainabilityClaimsAudit.productsWithCert} of ${monthlyStrategic.sustainabilityClaimsAudit.liveProducts} live products`}
                                            tone={
                                                monthlyStrategic
                                                    .sustainabilityClaimsAudit
                                                    .certCoverage >= 0.9
                                                    ? "good"
                                                    : "watch"
                                            }
                                        />
                                        <MetricTile
                                            label="Approved product coverage"
                                            value={percentFromRatio(
                                                monthlyStrategic
                                                    .sustainabilityClaimsAudit
                                                    .approvalCoverage
                                            )}
                                            detail={`${monthlyStrategic.sustainabilityClaimsAudit.approvedProducts} approved live products`}
                                            tone={
                                                monthlyStrategic
                                                    .sustainabilityClaimsAudit
                                                    .approvalCoverage >= 0.9
                                                    ? "good"
                                                    : "watch"
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border bg-white p-5 shadow-sm">
                                    <h3 className="text-base font-semibold text-slate-950">
                                        Data used here
                                    </h3>
                                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                                        {[
                                            "Orders and order items: GMV, volume, cohorts, churn, category mix, and margins.",
                                            "Products, variants, categories, and brands: cost, category, sustainability certs, and brand churn.",
                                            "Refunds: monthly refund rate.",
                                            "Audit logs, compliance export runs, and monitoring alerts: compliance snapshot.",
                                            "Finance cash and burn inputs are not stored yet, so runway stays as required input.",
                                        ].map((item) => (
                                            <p
                                                key={item}
                                                className="rounded-md bg-slate-50 px-3 py-2"
                                            >
                                                {item}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        </div>
                            </>
                        )}
                    </div>
                </section>

                {activeDashboard === "alerts" && (
                    <>
                        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                            <div
                                id="active-alerts"
                                className="scroll-mt-24 rounded-md border bg-white shadow-sm"
                            >
                                <div className="flex items-center justify-between border-b px-4 py-3">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-950">
                                            Active Alerts
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {alertsPage.total}{" "}
                                            {activeAlertSeverityLabel}unresolved
                                            alert
                                            {alertsPage.total === 1
                                                ? ""
                                                : "s"}{" "}
                                            · page {currentAlertPage} of{" "}
                                            {pageCount}
                                        </p>
                                    </div>
                                    <Bell className="size-5 text-muted-foreground" />
                                </div>
                                <div className="flex gap-2 overflow-x-auto border-b px-4 py-3">
                                    {alertSeverityTabs.map((tab) => {
                                        const isActive =
                                            (tab.value === "all" &&
                                                !activeAlertSeverity) ||
                                            tab.value === activeAlertSeverity;

                                        return (
                                            <Link
                                                key={tab.value}
                                                href={makeAlertSeverityHref(
                                                    tab.value
                                                )}
                                                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${
                                                    isActive
                                                        ? tab.activeClassName
                                                        : tab.className
                                                }`}
                                            >
                                                <span>{tab.label}</span>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                                        isActive
                                                            ? "bg-white/20 text-current"
                                                            : "bg-white/80 text-current"
                                                    }`}
                                                >
                                                    {
                                                        alertSeverityCounts[
                                                            tab.value
                                                        ]
                                                    }
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                <div className="divide-y">
                                    {alerts.length === 0 ? (
                                        <div className="flex min-h-44 flex-col items-center justify-center gap-3 p-6 text-center">
                                            <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                                <CheckCircle2 className="size-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    No active alerts
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    SLA (Service Level
                                                    Agreement) checks can still
                                                    create alerts when queues
                                                    breach thresholds.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        alerts.map((alert) => (
                                            <div
                                                key={alert.id}
                                                className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                                                            {alert.severity}
                                                        </span>
                                                        <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                            {alert.status}
                                                        </span>
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            {alert.entityType}:{" "}
                                                            {alert.entityId}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-2 font-semibold text-slate-950">
                                                        {alert.title}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {alert.message}
                                                    </p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <form
                                                        action={
                                                            acknowledgeAlert
                                                        }
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name="alertId"
                                                            value={alert.id}
                                                        />
                                                        {activeAlertSeverity ? (
                                                            <input
                                                                type="hidden"
                                                                name="activeAlertSeverity"
                                                                value={
                                                                    activeAlertSeverity
                                                                }
                                                            />
                                                        ) : null}
                                                        <button className="h-9 rounded-md border bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                                                            Acknowledge
                                                        </button>
                                                    </form>
                                                    <form action={resolveAlert}>
                                                        <input
                                                            type="hidden"
                                                            name="alertId"
                                                            value={alert.id}
                                                        />
                                                        {activeAlertSeverity ? (
                                                            <input
                                                                type="hidden"
                                                                name="activeAlertSeverity"
                                                                value={
                                                                    activeAlertSeverity
                                                                }
                                                            />
                                                        ) : null}
                                                        <button className="h-9 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800">
                                                            Resolve
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {alertsPage.total > alertPageSize && (
                                    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Showing{" "}
                                            {Math.min(
                                                alertsPage.total,
                                                (currentAlertPage - 1) *
                                                    alertPageSize +
                                                    1
                                            )}
                                            {"-"}
                                            {Math.min(
                                                alertsPage.total,
                                                currentAlertPage * alertPageSize
                                            )}{" "}
                                            of {alertsPage.total}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {currentAlertPage > 1 ? (
                                                <Link
                                                    href={makeAlertPageHref(
                                                        currentAlertPage - 1
                                                    )}
                                                    className="inline-flex h-9 items-center rounded-md border bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                                >
                                                    Previous
                                                </Link>
                                            ) : (
                                                <span className="inline-flex h-9 items-center rounded-md border bg-slate-50 px-3 text-sm font-semibold text-slate-400">
                                                    Previous
                                                </span>
                                            )}
                                            {currentAlertPage < pageCount ? (
                                                <Link
                                                    href={makeAlertPageHref(
                                                        currentAlertPage + 1
                                                    )}
                                                    className="inline-flex h-9 items-center rounded-md border bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                                >
                                                    Next
                                                </Link>
                                            ) : (
                                                <span className="inline-flex h-9 items-center rounded-md border bg-slate-50 px-3 text-sm font-semibold text-slate-400">
                                                    Next
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <aside className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
                                <div className="rounded-md border bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Alert Mix
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                Status by severity
                                            </p>
                                        </div>
                                        <History className="size-5 text-muted-foreground" />
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {alertSummary.length === 0 ? (
                                            <div className="rounded-md bg-slate-50 px-3 py-6 text-center text-sm text-muted-foreground">
                                                No alert history
                                            </div>
                                        ) : (
                                            alertSummary.map((row) => (
                                                <div
                                                    key={`${row.status}-${row.severity}`}
                                                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                                >
                                                    <span className="capitalize text-slate-700">
                                                        {row.status} /{" "}
                                                        {row.severity}
                                                    </span>
                                                    <span className="font-semibold text-slate-950">
                                                        {Number(row.count)}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <form
                                    action={generateComplianceExport}
                                    className="rounded-md border bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Compliance Export
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                Generate monthly audit evidence
                                            </p>
                                        </div>
                                        <Download className="size-5 text-muted-foreground" />
                                    </div>
                                    <div className="mt-4 grid gap-3">
                                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                            Month
                                            <input
                                                className="h-11 rounded-md border bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-400"
                                                name="exportMonth"
                                                type="month"
                                                defaultValue={currentMonth}
                                            />
                                        </label>
                                        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                                            Export Type
                                            <select
                                                className="h-11 rounded-md border bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-400"
                                                name="exportType"
                                            >
                                                <option value="refunds">
                                                    Refunds
                                                </option>
                                                <option value="brand-actions">
                                                    Brand Actions
                                                </option>
                                                <option value="access-changes">
                                                    Access Changes
                                                </option>
                                                <option value="manual-overrides">
                                                    Manual Overrides
                                                </option>
                                                <option value="sustainability-claims">
                                                    Sustainability Claims
                                                </option>
                                                <option value="data-deletion-requests">
                                                    Data Deletion Requests
                                                </option>
                                                <option value="customer-escalations">
                                                    Customer Escalations
                                                </option>
                                                <option value="alerts">
                                                    Alerts and Overrides
                                                </option>
                                            </select>
                                        </label>
                                        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                                            <Download className="size-4" />
                                            Generate Export
                                        </button>
                                    </div>
                                </form>

                                <div className="rounded-md border bg-white p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-950">
                                                Founder Report
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                Download generated monitoring
                                                records
                                            </p>
                                        </div>
                                        <Download className="size-5 text-muted-foreground" />
                                    </div>
                                    <div className="mt-4 grid gap-2">
                                        <a
                                            href={founderReportXlsxHref}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                                        >
                                            <Download className="size-4" />
                                            Download Excel Report
                                        </a>
                                        <a
                                            href={founderReportCsvHref}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                                        >
                                            <Download className="size-4" />
                                            Download CSV Report
                                        </a>
                                    </div>
                                </div>
                            </aside>
                        </section>

                        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            {evidenceCards.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <div
                                        key={card.title}
                                        className="min-h-32 rounded-md border bg-white p-4 shadow-sm"
                                    >
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h2 className="text-sm font-semibold text-slate-950">
                                                {card.title}
                                            </h2>
                                            <Icon className="size-4 text-muted-foreground" />
                                        </div>
                                        <EvidenceList rows={card.rows} />
                                    </div>
                                );
                            })}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

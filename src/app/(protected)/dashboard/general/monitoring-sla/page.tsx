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
    await monitoringSlaQueries.updateAlertStatus("acknowledged", {
        alertId: String(formData.get("alertId")),
        actorId: await getActor(),
        reasonCode: "admin_acknowledged",
        notes: String(
            formData.get("notes") ?? "Acknowledged from monitoring dashboard"
        ),
    });
    finishAction("alert-acknowledged");
}

async function resolveAlert(formData: FormData) {
    "use server";
    await monitoringSlaQueries.updateAlertStatus("resolved", {
        alertId: String(formData.get("alertId")),
        actorId: await getActor(),
        reasonCode: "admin_resolved",
        notes: String(
            formData.get("notes") ?? "Resolved from monitoring dashboard"
        ),
    });
    finishAction("alert-resolved");
}

async function runSlaCheck() {
    "use server";
    await monitoringSlaQueries.runSlaCheck(await getActor());
    finishAction("sla-run");
}

async function saveDailySnapshot() {
    "use server";
    await monitoringSlaQueries.saveDailySnapshot(await getActor());
    finishAction("snapshot");
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

const metricConfig = {
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
        label: "Unack Orders",
        sublabel: "Brand acknowledgement >24h",
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
        sublabel: "No movement >48h",
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
        href: "#active-alerts",
    },
    openTickets: {
        label: "Open Tickets",
        sublabel: "Support queues",
        icon: TimerReset,
        href: "/dashboard/general/support/user",
    },
    ticketsAged24h: {
        label: "Aged Tickets",
        sublabel: "No response >24h",
        icon: Bell,
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
        href: "#brand-health",
    },
    platformUptime24h: {
        label: "Uptime 24H (24 Hours)",
        sublabel: "Alert-derived platform signal",
        icon: Gauge,
        href: "#active-alerts",
    },
    ordersWtd: {
        label: "Orders WTD (Week To Date)",
        sublabel: "Business week activity",
        icon: Activity,
        href: "/dashboard/general/orders",
    },
    gmvWtd: {
        label: "GMV (Gross Merchandise Value) WTD (Week To Date)",
        sublabel: "Paid/order value this week",
        icon: Gauge,
        href: "#marketing-performance",
    },
    aovWtd: {
        label: "AOV (Average Order Value) WTD (Week To Date)",
        sublabel: "Average order value",
        icon: Gauge,
        href: "#marketing-performance",
    },
    newCustomersWtd: {
        label: "Customers WTD (Week To Date)",
        sublabel: "Unique ordering customers",
        icon: UsersRound,
        href: "#marketing-performance",
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
    },
    openAlerts: {
        label: "Open Alerts",
        sublabel: "Active system alerts",
        icon: Bell,
        href: "#active-alerts",
    },
    criticalAlerts: {
        label: "Critical Alerts",
        sublabel: "Needs immediate review",
        icon: AlertTriangle,
        href: "#active-alerts",
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
    const noticeRaw = Array.isArray(params.notice)
        ? params.notice[0]
        : params.notice;
    const generatedExportMonthRaw = Array.isArray(params.exportMonth)
        ? params.exportMonth[0]
        : params.exportMonth;
    const generatedExportTypeRaw = Array.isArray(params.exportType)
        ? params.exportType[0]
        : params.exportType;
    const notice = getNoticeConfig(noticeRaw);
    const alertPage = Math.max(1, Number(alertPageRaw ?? "1") || 1);
    const alertPageSize = 10;

    const [
        health,
        alertsPage,
        alertSummary,
        evidence,
        brandHealth,
        marketingPerformance,
        monthlyStrategic,
    ] = await Promise.all([
        monitoringSlaQueries.getDailyHealth(),
        monitoringSlaQueries.getActiveAlertsPage(alertPage, alertPageSize),
        monitoringSlaQueries.getAlertSummary(),
        monitoringSlaQueries.getRecentEvidence(),
        monitoringSlaQueries.getBrandHealth(),
        monitoringSlaQueries.getMarketingPerformance(),
        monitoringSlaQueries.getMonthlyStrategic(),
    ]);
    const alerts = alertsPage.rows;
    const pageCount = alertsPage.pageCount;
    const currentAlertPage = Math.min(alertsPage.page, pageCount);
    const makeAlertPageHref = (page: number) => {
        const nextParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (!value || key === "alertPage" || key === "notice") continue;
            nextParams.set(key, Array.isArray(value) ? value[0] : value);
        }
        nextParams.set("alertPage", String(page));
        return `/dashboard/general/monitoring-sla?${nextParams.toString()}`;
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
                            <form action={saveDailySnapshot}>
                                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto">
                                    <CalendarCheck className="size-4" />
                                    Snapshot
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
                                    <Link
                                        href={generatedExportHref}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
                                    >
                                        <Download className="size-4" />
                                        Download Excel
                                    </Link>
                                )}
                                {showFounderReportDownloads && (
                                    <>
                                        <Link
                                            href={founderReportXlsxHref}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
                                        >
                                            <Download className="size-4" />
                                            Download Excel Report
                                        </Link>
                                        <Link
                                            href={founderReportCsvHref}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-700 bg-white px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                                        >
                                            <Download className="size-4" />
                                            Download CSV Report
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <section
                    className={`overflow-hidden rounded-md border shadow-sm ${healthStatus.className}`}
                >
                    <div className={`h-1.5 ${healthStatus.accent}`} />
                    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,0.8fr)_1fr] lg:items-center">
                        <div>
                            <p className="text-sm font-semibold">
                                Daily Health
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
                                    {health.metrics.criticalAlerts} critical
                                </p>
                            </div>
                            <div>
                                <p className="text-current/60 text-xs font-semibold uppercase">
                                    Queue Load
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {health.metrics.openTickets} tickets /{" "}
                                    {health.metrics.refundsPendingProcessing}{" "}
                                    refunds
                                </p>
                            </div>
                            <div>
                                <p className="text-current/60 text-xs font-semibold uppercase">
                                    Business Activity
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {health.metrics.ordersPlaced24h} today /{" "}
                                    {health.metrics.ordersWtd} WTD (Week To
                                    Date)
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
                                    {metricLabel(value)}
                                </p>
                            </Link>
                        );
                    })}
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <div
                        id="brand-health"
                        className="scroll-mt-24 rounded-md border bg-white p-4 shadow-sm"
                    >
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
                                    brandHealth.brandsWithNoOrders30d,
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
                    </div>

                    <div
                        id="marketing-performance"
                        className="scroll-mt-24 rounded-md border bg-white p-4 shadow-sm"
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">
                                    Marketing Performance
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    PS weekly marketing review
                                </p>
                            </div>
                            <Gauge className="size-5 text-muted-foreground" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                [
                                    "GMV (Gross Merchandise Value) WTD (Week To Date)",
                                    marketingPerformance.gmvWtd,
                                ],
                                [
                                    "Orders WTD (Week To Date)",
                                    marketingPerformance.ordersWtd,
                                ],
                                [
                                    "Customers WTD (Week To Date)",
                                    marketingPerformance.customersWtd,
                                ],
                                [
                                    "GMV (Gross Merchandise Value) MTD (Month To Date)",
                                    marketingPerformance.gmvMtd,
                                ],
                                [
                                    "Orders MTD (Month To Date)",
                                    marketingPerformance.ordersMtd,
                                ],
                                [
                                    "Customers MTD (Month To Date)",
                                    marketingPerformance.customersMtd,
                                ],
                                [
                                    "Ad spend",
                                    marketingPerformance.adSpendIntegration,
                                ],
                                [
                                    "ROAS (Return On Ad Spend)",
                                    marketingPerformance.roasIntegration,
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
                    </div>

                    <div
                        id="monthly-strategic"
                        className="scroll-mt-24 rounded-md border bg-white p-4 shadow-sm"
                    >
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">
                                    Monthly Strategic
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Founder review dashboard
                                </p>
                            </div>
                            <ClipboardCheck className="size-5 text-muted-foreground" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                [
                                    "GMV (Gross Merchandise Value) MTD (Month To Date)",
                                    monthlyStrategic.currentMonth.gmv ?? 0,
                                ],
                                [
                                    "Orders MTD (Month To Date)",
                                    monthlyStrategic.currentMonth.orderCount ??
                                        0,
                                ],
                                [
                                    "Customers MTD (Month To Date)",
                                    monthlyStrategic.currentMonth
                                        .customerCount ?? 0,
                                ],
                                [
                                    "Prior GMV (Gross Merchandise Value)",
                                    monthlyStrategic.previousMonth.gmv ?? 0,
                                ],
                                [
                                    "Refund rate",
                                    `${(
                                        monthlyStrategic.refundRate * 100
                                    ).toFixed(1)}%`,
                                ],
                                [
                                    "Compliance exports",
                                    monthlyStrategic.complianceExportsThisMonth,
                                ],
                                [
                                    "Critical alerts",
                                    monthlyStrategic.openCriticalAlerts,
                                ],
                                [
                                    "Cohort retention",
                                    monthlyStrategic.cohortRetentionIntegration,
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
                    </div>
                </section>

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
                                    {alertsPage.total} unresolved alert
                                    {alertsPage.total === 1 ? "" : "s"} · page{" "}
                                    {currentAlertPage} of {pageCount}
                                </p>
                            </div>
                            <Bell className="size-5 text-muted-foreground" />
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
                                            SLA (Service Level Agreement) checks
                                            can still create alerts when queues
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
                                            <form action={acknowledgeAlert}>
                                                <input
                                                    type="hidden"
                                                    name="alertId"
                                                    value={alert.id}
                                                />
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
                                        (currentAlertPage - 1) * alertPageSize +
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
                                                {row.status} / {row.severity}
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
                                        <option value="refunds">Refunds</option>
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
                                        Download generated monitoring records
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
            </div>
        </main>
    );
}

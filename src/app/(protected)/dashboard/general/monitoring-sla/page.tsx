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
import { notFound } from "next/navigation";

const pagePath = "/dashboard/general/monitoring-sla";

async function getActor() {
    const { userId } = await auth();
    return userId ?? "system";
}

async function assertMonitoringAccess() {
    const { userId } = await auth();
    if (!userId) notFound();

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
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
    revalidatePath(pagePath);
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
    revalidatePath(pagePath);
}

async function runSlaCheck() {
    "use server";
    await monitoringSlaQueries.runSlaCheck(await getActor());
    revalidatePath(pagePath);
}

async function saveDailySnapshot() {
    "use server";
    await monitoringSlaQueries.saveDailySnapshot(await getActor());
    revalidatePath(pagePath);
}

async function generateWeeklyPack() {
    "use server";
    await monitoringSlaQueries.generateWeeklyPack(await getActor());
    revalidatePath(pagePath);
}

async function generateAccessReview() {
    "use server";
    await monitoringSlaQueries.generateAccessReview(await getActor());
    revalidatePath(pagePath);
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
    revalidatePath(pagePath);
}

function metricLabel(value: number | string) {
    return typeof value === "number" ? value.toLocaleString("en-IN") : value;
}

const metricConfig = {
    ordersToday: {
        label: "Orders Today",
        sublabel: "Placed since midnight",
        icon: Activity,
    },
    orders7d: {
        label: "Orders 7D",
        sublabel: "Rolling order volume",
        icon: Gauge,
    },
    openAlerts: {
        label: "Open Alerts",
        sublabel: "Active system alerts",
        icon: Bell,
    },
    criticalAlerts: {
        label: "Critical Alerts",
        sublabel: "Needs immediate review",
        icon: AlertTriangle,
    },
    openTickets: {
        label: "Open Tickets",
        sublabel: "Support queues",
        icon: TimerReset,
    },
    pendingRefunds: {
        label: "Pending Refunds",
        sublabel: "Finance follow-up",
        icon: FileText,
    },
    pendingBrandRequests: {
        label: "Brand Requests",
        sublabel: "Pending onboarding",
        icon: UsersRound,
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

export default async function MonitoringSlaPage() {
    await assertMonitoringAccess();

    const [health, alerts, alertSummary, evidence] = await Promise.all([
        monitoringSlaQueries.getDailyHealth(),
        monitoringSlaQueries.getActiveAlerts(),
        monitoringSlaQueries.getAlertSummary(),
        monitoringSlaQueries.getRecentEvidence(),
    ]);

    const healthStatus = getStatusConfig(health.status);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const metricEntries = Object.entries(health.metrics) as Array<
        [keyof typeof metricConfig, number | string]
    >;
    const evidenceCards = [
        {
            title: "SLA Runs",
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
                                        Monitoring, Alerts & SLA
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
                                    {health.metrics.criticalAlerts} critical alerts,
                                    {" "}
                                    {health.metrics.openAlerts} open alerts,{" "}
                                    {health.metrics.openTickets} open tickets,{" "}
                                    {health.metrics.pendingRefunds} pending refunds
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                            <form action={runSlaCheck}>
                                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto">
                                    <TimerReset className="size-4" />
                                    Run SLA
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

                <section
                    className={`overflow-hidden rounded-md border shadow-sm ${healthStatus.className}`}
                >
                    <div className={`h-1.5 ${healthStatus.accent}`} />
                    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,0.8fr)_1fr] lg:items-center">
                        <div>
                            <p className="text-sm font-semibold">Daily Health</p>
                            <p className="mt-1 text-4xl font-semibold tracking-normal">
                                {healthStatus.label}
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-semibold uppercase text-current/60">
                                    Alert Load
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {health.metrics.openAlerts} open /{" "}
                                    {health.metrics.criticalAlerts} critical
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-current/60">
                                    Queue Load
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {health.metrics.openTickets} tickets /{" "}
                                    {health.metrics.pendingRefunds} refunds
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-current/60">
                                    Business Activity
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                    {health.metrics.ordersToday} today /{" "}
                                    {health.metrics.orders7d} in 7D
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
                            <div
                                key={key}
                                className="rounded-md border bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">
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
                            </div>
                        );
                    })}
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                    <div className="rounded-md border bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950">
                                    Active Alerts
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {alerts.length} unresolved alert
                                    {alerts.length === 1 ? "" : "s"}
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
                                            SLA checks can still create alerts when queues breach thresholds.
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
                                                    {alert.entityType}: {alert.entityId}
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

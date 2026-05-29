import { BitFieldSitePermission } from "@/config/permissions";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
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
        notes: String(formData.get("notes") ?? "Acknowledged from monitoring dashboard"),
    });
    revalidatePath(pagePath);
}

async function resolveAlert(formData: FormData) {
    "use server";
    await monitoringSlaQueries.updateAlertStatus("resolved", {
        alertId: String(formData.get("alertId")),
        actorId: await getActor(),
        reasonCode: "admin_resolved",
        notes: String(formData.get("notes") ?? "Resolved from monitoring dashboard"),
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
    await monitoringSlaQueries.generateComplianceExport(exportMonth, exportType, await getActor());
    revalidatePath(pagePath);
}

function metricLabel(value: number | string) {
    return typeof value === "number" ? value.toLocaleString("en-IN") : value;
}

export default async function MonitoringSlaPage() {
    await assertMonitoringAccess();

    const [health, alerts, alertSummary, evidence] = await Promise.all([
        monitoringSlaQueries.getDailyHealth(),
        monitoringSlaQueries.getActiveAlerts(),
        monitoringSlaQueries.getAlertSummary(),
        monitoringSlaQueries.getRecentEvidence(),
    ]);

    const statusClass =
        health.status === "red"
            ? "border-red-300 bg-red-50 text-red-900"
            : health.status === "amber"
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-emerald-300 bg-emerald-50 text-emerald-900";

    const currentMonth = new Date().toISOString().slice(0, 7);

    return (
        <main className="space-y-6 p-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        Monitoring, Alerts & SLA
                    </p>
                    <h1 className="text-2xl font-semibold text-foreground">
                        Operations Health Center
                    </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                    <form action={runSlaCheck}>
                        <button className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
                            Run SLA
                        </button>
                    </form>
                    <form action={saveDailySnapshot}>
                        <button className="rounded-md border px-3 py-2 text-sm font-medium">
                            Snapshot
                        </button>
                    </form>
                    <form action={generateWeeklyPack}>
                        <button className="rounded-md border px-3 py-2 text-sm font-medium">
                            Weekly Pack
                        </button>
                    </form>
                    <form action={generateAccessReview}>
                        <button className="rounded-md border px-3 py-2 text-sm font-medium">
                            Access Review
                        </button>
                    </form>
                </div>
            </header>

            <section className={`rounded-md border p-4 ${statusClass}`}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium">Daily Health</p>
                        <p className="text-3xl font-semibold capitalize">{health.status}</p>
                    </div>
                    <p className="text-sm">
                        {health.metrics.criticalAlerts} critical alerts, {health.metrics.openTickets} open tickets
                    </p>
                </div>
            </section>

            <section className="grid gap-3 md:grid-cols-4">
                {Object.entries(health.metrics).map(([key, value]) => (
                    <div key={key} className="rounded-md border bg-background p-4">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{key}</p>
                        <p className="mt-2 text-2xl font-semibold">{metricLabel(value)}</p>
                    </div>
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-md border bg-background">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Active Alerts</h2>
                    </div>
                    <div className="divide-y">
                        {alerts.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">No active alerts.</p>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded bg-muted px-2 py-1 text-xs font-medium uppercase">
                                                {alert.severity}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{alert.status}</span>
                                        </div>
                                        <h3 className="mt-2 font-medium">{alert.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <form action={acknowledgeAlert}>
                                            <input type="hidden" name="alertId" value={alert.id} />
                                            <button className="rounded-md border px-3 py-2 text-sm font-medium">
                                                Acknowledge
                                            </button>
                                        </form>
                                        <form action={resolveAlert}>
                                            <input type="hidden" name="alertId" value={alert.id} />
                                            <button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white">
                                                Resolve
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-md border bg-background p-4">
                        <h2 className="font-semibold">Alert Mix</h2>
                        <div className="mt-3 space-y-2">
                            {alertSummary.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No alert history yet.</p>
                            ) : (
                                alertSummary.map((row) => (
                                    <div
                                        key={`${row.status}-${row.severity}`}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span>{row.status} / {row.severity}</span>
                                        <span className="font-medium">{Number(row.count)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <form action={generateComplianceExport} className="rounded-md border bg-background p-4">
                        <h2 className="font-semibold">Compliance Export</h2>
                        <div className="mt-3 grid gap-3">
                            <input
                                className="rounded-md border px-3 py-2 text-sm"
                                name="exportMonth"
                                type="month"
                                defaultValue={currentMonth}
                            />
                            <select className="rounded-md border px-3 py-2 text-sm" name="exportType">
                                <option value="refunds">Refunds</option>
                                <option value="brand-actions">Brand actions</option>
                                <option value="access-changes">Access changes</option>
                                <option value="alerts">Alerts and overrides</option>
                            </select>
                            <button className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
                                Generate
                            </button>
                        </div>
                    </form>
                </aside>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                    ["SLA Runs", evidence.runs.map((item) => `${item.runKey}: ${item.status}`)],
                    ["Daily Snapshots", evidence.snapshots.map((item) => `${item.snapshotDate}: ${item.status}`)],
                    ["Weekly Packs", evidence.packs.map((item) => `${item.weekStart} to ${item.weekEnd}`)],
                    ["Exports", evidence.exports.map((item) => `${item.exportMonth}: ${item.exportType}`)],
                    ["Access Reviews", evidence.reviews.map((item) => `${item.reviewPeriod}: ${item.status}`)],
                ].map(([title, rows]) => (
                    <div key={String(title)} className="rounded-md border bg-background p-4">
                        <h2 className="font-semibold">{title}</h2>
                        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {(rows as string[]).length ? (
                                (rows as string[]).map((row) => <p key={row}>{row}</p>)
                            ) : (
                                <p>No evidence yet.</p>
                            )}
                        </div>
                    </div>
                ))}
            </section>
        </main>
    );
}

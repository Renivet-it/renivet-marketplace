import { CorporateTabs } from "@/components/corporate-platform/corporate-tabs";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { formatINR } from "@/lib/utils";

export default async function Page() {
    const summary = await corporatePlatformService.getAdminDashboardSummary();
    const metrics = [
        { label: "Demand waiting", value: String(summary.rfqsPending) },
        { label: "Quotes in flight", value: String(summary.quotesPending) },
        { label: "Active orders", value: String(summary.activeOrders) },
        { label: "SLA risk", value: String(summary.slaBreaches) },
        { label: "Refund requests", value: String(summary.refundRequests) },
        {
            label: "Outstanding",
            value: formatINR(summary.outstandingBalancePaise),
        },
    ];

    return (
        <DashShell>
            <div className="space-y-4">
                <CorporateTabs />
                <header className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-950">
                        Executive View
                    </h1>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Demand, operations and collection health
                    </p>
                </header>

                <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                            <p className="text-[11px] font-medium text-slate-500">
                                {metric.label}
                            </p>
                            <p className="mt-1 text-xl font-semibold leading-none text-slate-950">
                                {metric.value}
                            </p>
                        </div>
                    ))}
                </section>

                <div className="grid gap-3 xl:grid-cols-3">
                    <HealthPanel title="Demand">
                        <ExecutiveLine
                            label="Requests awaiting review"
                            value={String(summary.rfqsPending)}
                        />
                        <ExecutiveLine
                            label="Quotes awaiting decision"
                            value={String(summary.quotesPending)}
                        />
                    </HealthPanel>
                    <HealthPanel title="Operations">
                        <ExecutiveLine
                            label="Active orders"
                            value={String(summary.activeOrders)}
                        />
                        <ExecutiveLine
                            label="Quality control pending"
                            value={String(summary.qcPending)}
                        />
                        <ExecutiveLine
                            label="Dispatch pending"
                            value={String(summary.dispatchPending)}
                        />
                    </HealthPanel>
                    <HealthPanel title="Finance">
                        <ExecutiveLine
                            label="Payments pending"
                            value={String(summary.paymentsPending)}
                        />
                        <ExecutiveLine
                            label="Refund requests"
                            value={String(summary.refundRequests)}
                        />
                        <ExecutiveLine
                            label="Open escalations"
                            value={String(summary.slaBreaches)}
                        />
                    </HealthPanel>
                </div>
            </div>
        </DashShell>
    );
}

function HealthPanel({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            <div className="mt-3 space-y-2">{children}</div>
        </section>
    );
}

function ExecutiveLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-medium text-slate-600">{label}</div>
            <div className="text-sm font-semibold text-slate-900">{value}</div>
        </div>
    );
}

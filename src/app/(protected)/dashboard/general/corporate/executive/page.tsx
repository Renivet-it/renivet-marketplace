import { AdminMetricGrid, AdminPageIntro, AdminPanel } from "@/components/corporate-platform/admin-design";
import { CorporateTabs } from "@/components/corporate-platform/corporate-tabs";
import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { formatINR } from "@/lib/utils";

export default async function Page() {
    const summary = await corporatePlatformService.getAdminDashboardSummary();
    const metrics = [
        { label: "Demand Waiting", value: String(summary.rfqsPending), tone: "blue" as const },
        { label: "Quotes In Flight", value: String(summary.quotesPending), tone: "blue" as const },
        { label: "Operational Load", value: String(summary.activeOrders), tone: "slate" as const },
        { label: "SLA Risk", value: String(summary.slaBreaches), tone: "gold" as const },
        { label: "Refund Pressure", value: String(summary.refundRequests), tone: "slate" as const },
        { label: "Outstanding Collections", value: formatINR(summary.outstandingBalancePaise), tone: "gold" as const },
    ];

    return (
        <DashShell>
            <div className="space-y-6">
                <CorporateTabs />
                <AdminPageIntro
                    eyebrow="Executive View"
                    title="Leadership visibility across demand, operations, and collections"
                    description="This view groups corporate business health into demand, conversion, operations, finance, and SLA risk so leadership can scan pressure points without reading queue-level detail."
                />
                <AdminMetricGrid items={metrics} />
                <div className="grid gap-6 xl:grid-cols-3">
                    <AdminPanel title="Demand" description="Pipeline pressure before orders are activated.">
                        <ExecutiveLine label="Requests awaiting review" value={String(summary.rfqsPending)} />
                        <ExecutiveLine label="Quotes awaiting decision" value={String(summary.quotesPending)} />
                    </AdminPanel>
                    <AdminPanel title="Operations Health" description="Execution workload across production and dispatch.">
                        <ExecutiveLine label="Active orders" value={String(summary.activeOrders)} />
                        <ExecutiveLine label="Quality control pending" value={String(summary.qcPending)} />
                        <ExecutiveLine label="Dispatch pending" value={String(summary.dispatchPending)} />
                    </AdminPanel>
                    <AdminPanel title="Finance Health" description="Collection pressure and service risk.">
                        <ExecutiveLine label="Payments pending" value={String(summary.paymentsPending)} />
                        <ExecutiveLine label="Refund requests" value={String(summary.refundRequests)} />
                        <ExecutiveLine label="Open escalations" value={String(summary.slaBreaches)} />
                    </AdminPanel>
                </div>
            </div>
        </DashShell>
    );
}

function ExecutiveLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm font-medium text-slate-600">{label}</div>
            <div className="text-lg font-semibold text-slate-900">{value}</div>
        </div>
    );
}


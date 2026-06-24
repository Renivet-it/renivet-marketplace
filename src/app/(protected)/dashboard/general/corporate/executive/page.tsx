import { DashShell } from "@/components/globals/layouts/shells";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { formatINR } from "@/lib/utils";

export default async function Page() {
    const summary = await corporatePlatformService.getAdminDashboardSummary();

    return (
        <DashShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Corporate Executive View</h1>
                    <p className="text-sm text-slate-500">
                        Leadership snapshot across demand, operations, and collections.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card label="RFQs Pending" value={String(summary.rfqsPending)} />
                    <Card label="Quotes Pending" value={String(summary.quotesPending)} />
                    <Card label="Active Orders" value={String(summary.activeOrders)} />
                    <Card label="SLA Breaches" value={String(summary.slaBreaches)} />
                    <Card label="Refund Requests" value={String(summary.refundRequests)} />
                    <Card
                        label="Outstanding Balance"
                        value={formatINR(summary.outstandingBalancePaise)}
                    />
                </div>
            </div>
        </DashShell>
    );
}

function Card({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
        </div>
    );
}


import { DashShell } from "@/components/globals/layouts/shells";
import { SeedCatalogButton } from "@/components/corporate-platform/seed-catalog-button";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import { formatINR } from "@/lib/utils";

export default async function Page() {
    const summary = await corporatePlatformService.getAdminDashboardSummary();

    const cards = [
        { label: "RFQs Pending", value: String(summary.rfqsPending) },
        { label: "Quotes Pending", value: String(summary.quotesPending) },
        { label: "Active Orders", value: String(summary.activeOrders) },
        { label: "QC Pending", value: String(summary.qcPending) },
        { label: "Dispatch Pending", value: String(summary.dispatchPending) },
        { label: "Payments Pending", value: String(summary.paymentsPending) },
        { label: "Refund Requests", value: String(summary.refundRequests) },
        { label: "SLA Breaches", value: String(summary.slaBreaches) },
        {
            label: "Outstanding Balance",
            value: formatINR(summary.outstandingBalancePaise),
        },
    ];

    return (
        <DashShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Corporate Command Center
                    </h1>
                    <p className="text-sm text-slate-500">
                        Cross-functional view for corporate RFQs, quotes, orders, finance,
                        and SLA health.
                    </p>
                </div>
                <SeedCatalogButton />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className="rounded-2xl border bg-white p-5 shadow-sm"
                        >
                            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {card.label}
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">
                                {card.value}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                    <a href="/dashboard/general/corporate/rfqs" className="rounded-full border bg-white px-4 py-2 font-semibold text-slate-900">
                        Open RFQ Queue
                    </a>
                    <a href="/dashboard/general/corporate/finance" className="rounded-full border bg-white px-4 py-2 font-semibold text-slate-900">
                        Open Finance Queue
                    </a>
                    <a href="/dashboard/general/corporate/tasks" className="rounded-full border bg-white px-4 py-2 font-semibold text-slate-900">
                        Open Task Queue
                    </a>
                </div>
            </div>
        </DashShell>
    );
}

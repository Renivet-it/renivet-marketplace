import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function CodReconciliationPage() {
    await assertFinanceModulePageAccess("cod_reconciliation");
    const [items, runs] = await Promise.all([
        financeComplianceQueries.listCodReconciliation(),
        financeComplianceQueries.listCodRuns(),
    ]);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M2</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">COD Reconciliation</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Snapshot of remittance reconciliation rows and run history for discrepancy review.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Rows</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">{items.length}</p>
                    </div>
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Runs</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">{runs.length}</p>
                    </div>
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Open mismatches</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                            {items.filter((item) => item.status !== "matched").length}
                        </p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-md border bg-white shadow-sm">
                    <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                        <span>Order</span>
                        <span>Status</span>
                        <span>Expected</span>
                        <span>Remitted</span>
                        <span>Ageing</span>
                    </div>
                    <div className="divide-y">
                        {items.length === 0 ? (
                            <p className="p-6 text-sm text-slate-500">No reconciliation snapshots yet.</p>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-3 px-4 py-3 text-sm"
                                >
                                    <span className="font-medium text-slate-900">{item.orderId}</span>
                                    <span>{item.status}</span>
                                    <span>₹{(item.expectedAmountPaise / 100).toFixed(2)}</span>
                                    <span>₹{(item.remittedAmountPaise / 100).toFixed(2)}</span>
                                    <span>{item.ageingDays}d</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

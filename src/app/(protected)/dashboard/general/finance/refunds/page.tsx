import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function FinanceRefundsPage() {
    await assertFinanceModulePageAccess("refunds");
    const rows = await financeComplianceQueries.listRefunds();

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        M1
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Refund Infrastructure</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Finance-owned refund cases with approval state, reason policy bucket,
                        reverse pickup flag, and payout-recovery linkage.
                    </p>
                </header>

                <section className="overflow-hidden rounded-md border bg-white shadow-sm">
                    <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                        <span>Refund</span>
                        <span>Status</span>
                        <span>Approval</span>
                        <span>Bucket</span>
                        <span>Amount</span>
                    </div>
                    <div className="divide-y">
                        {rows.length === 0 ? (
                            <p className="p-6 text-sm text-slate-500">No refund cases recorded yet.</p>
                        ) : (
                            rows.map((row) => (
                                <div
                                    key={row.id}
                                    className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.9fr] gap-3 px-4 py-3 text-sm"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{row.orderId}</p>
                                        <p className="text-xs text-slate-500">{row.id}</p>
                                    </div>
                                    <span>{row.status}</span>
                                    <span>{row.approvalStatus}</span>
                                    <span>{row.policyBucket ?? "-"}</span>
                                    <span>₹{(row.amount / 100).toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

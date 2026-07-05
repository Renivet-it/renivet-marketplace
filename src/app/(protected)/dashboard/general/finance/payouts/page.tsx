import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function PayoutsPage() {
    await assertFinanceModulePageAccess("payouts");
    const cycles = await financeComplianceQueries.listPayoutCycles();

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M3 + M5</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Brand Payout Engine</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Cycle-level payout control surface with future support for overrides, TDS deduction,
                        and statement exports.
                    </p>
                </header>

                <section className="overflow-hidden rounded-md border bg-white shadow-sm">
                    <div className="grid grid-cols-[1fr_0.9fr_0.9fr_0.9fr] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                        <span>Cycle</span>
                        <span>Window</span>
                        <span>Payout date</span>
                        <span>Status</span>
                    </div>
                    <div className="divide-y">
                        {cycles.length === 0 ? (
                            <p className="p-6 text-sm text-slate-500">No payout cycles created yet.</p>
                        ) : (
                            cycles.map((cycle) => (
                                <div
                                    key={cycle.id}
                                    className="grid grid-cols-[1fr_0.9fr_0.9fr_0.9fr] gap-3 px-4 py-3 text-sm"
                                >
                                    <span className="font-medium text-slate-900">{cycle.cycleKey}</span>
                                    <span>{cycle.cycleStart} to {cycle.cycleEnd}</span>
                                    <span>{cycle.payoutDate}</span>
                                    <span>{cycle.status}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function MonthlyPlPage() {
    await assertFinanceModulePageAccess("monthly_pl");
    const monthKey = new Date().toISOString().slice(0, 7);
    const [entries, summary] = await Promise.all([
        financeComplianceQueries.listPlEntries(monthKey),
        financeComplianceQueries.getPlSummary(monthKey),
    ]);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M9</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Monthly P&amp;L Dashboard</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Current month manual finance entries and baseline expense rollup for close review.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Month</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">{monthKey}</p>
                    </div>
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Entries</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">{entries.length}</p>
                    </div>
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Manual expense</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                            ₹{((summary?.manualExpensePaise ?? 0) / 100).toFixed(2)}
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

import { MonthlyPlDashboard } from "@/components/dashboard/general/finance/monthly-pl-dashboard";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function MonthlyPlPage() {
    await assertFinanceModulePageAccess("monthly_pl");
    const monthKey = new Date().toISOString().slice(0, 7);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M9</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Monthly P&amp;L Dashboard</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Founder-close workspace with source refresh, audited manual inputs, and locked monthly
                        snapshots.
                    </p>
                </header>
                <MonthlyPlDashboard initialMonthKey={monthKey} />
            </div>
        </main>
    );
}

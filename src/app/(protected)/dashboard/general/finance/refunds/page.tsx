import { FinanceRefundsWorkspace } from "@/components/dashboard/general/finance/refunds-workspace";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function FinanceRefundsPage() {
    await assertFinanceModulePageAccess("refunds");
    const [rows, reasons] = await Promise.all([
        financeComplianceQueries.listRefunds(),
        financeComplianceQueries.listRefundReasons(),
    ]);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        M1
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                        Refund Infrastructure
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Finance-owned refund operations with approval gates, reason mapping,
                        reverse pickup orchestration, QC checkpoints, and payout impact visibility.
                    </p>
                </header>

                <FinanceRefundsWorkspace initialRows={rows} initialReasons={reasons} />
            </div>
        </main>
    );
}

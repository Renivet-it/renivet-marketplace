import { CodReconciliationWorkspace } from "@/components/dashboard/general/finance/cod-reconciliation-workspace";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function CodReconciliationPage() {
    await assertFinanceModulePageAccess("cod_reconciliation");
    const [items, runs, feeSchedules] = await Promise.all([
        financeComplianceQueries.listCodReconciliation(),
        financeComplianceQueries.listCodRuns(),
        financeComplianceQueries.listCarrierFeeSchedules(),
    ]);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        M2
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                        COD Reconciliation
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Daily COD remittance tracking with fee schedule sync, discrepancy review,
                        overdue escalation, and write-off controls.
                    </p>
                </header>

                <CodReconciliationWorkspace
                    initialItems={items}
                    initialRuns={runs}
                    initialFeeSchedules={feeSchedules}
                />
            </div>
        </main>
    );
}

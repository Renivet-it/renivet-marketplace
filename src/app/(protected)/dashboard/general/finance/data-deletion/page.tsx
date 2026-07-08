import { DataDeletionWorkspace } from "@/components/dashboard/general/privacy/data-deletion-workspace";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function FinanceDataDeletionPage() {
    await assertFinanceModulePageAccess("data_deletion");
    const rows = await financeComplianceQueries.listDeletionRequests();

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M6</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">DPDP Data Deletion Requests</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Review queue for deletion requests while preserving finance and legal retention obligations.
                    </p>
                </header>

                {rows.length === 0 ? (
                    <section className="rounded-md border bg-white p-6 text-sm text-slate-500 shadow-sm">
                        No deletion requests logged yet.
                    </section>
                ) : null}

                <DataDeletionWorkspace />
            </div>
        </main>
    );
}

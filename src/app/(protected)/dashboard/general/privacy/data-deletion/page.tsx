import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function DataDeletionPage() {
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

                <section className="overflow-hidden rounded-md border bg-white shadow-sm">
                    <div className="grid grid-cols-[1fr_0.8fr_0.8fr_1.2fr] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                        <span>Request</span>
                        <span>Status</span>
                        <span>Requested by</span>
                        <span>Reason</span>
                    </div>
                    <div className="divide-y">
                        {rows.length === 0 ? (
                            <p className="p-6 text-sm text-slate-500">No deletion requests logged yet.</p>
                        ) : (
                            rows.map((row) => (
                                <div
                                    key={row.id}
                                    className="grid grid-cols-[1fr_0.8fr_0.8fr_1.2fr] gap-3 px-4 py-3 text-sm"
                                >
                                    <span className="font-medium text-slate-900">{row.id}</span>
                                    <span>{row.status}</span>
                                    <span>{row.requestedByEmail ?? row.userId}</span>
                                    <span>{row.reason ?? "-"}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

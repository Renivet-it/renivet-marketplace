import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function ModuleAccessPage() {
    await assertFinanceModulePageAccess("audit_log_finance");
    const rows = await financeComplianceQueries.listModuleAccess();

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Access Control</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Finance Module Access</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Additive finance access grants layered over existing role permissions for sensitive modules.
                    </p>
                </header>

                <section className="overflow-hidden rounded-md border bg-white shadow-sm">
                    <div className="grid grid-cols-[1fr_0.8fr_0.6fr_0.6fr] gap-3 border-b bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-600">
                        <span>User</span>
                        <span>Module</span>
                        <span>View</span>
                        <span>Manage</span>
                    </div>
                    <div className="divide-y">
                        {rows.length === 0 ? (
                            <p className="p-6 text-sm text-slate-500">No finance module grants yet.</p>
                        ) : (
                            rows.map((row) => (
                                <div
                                    key={row.id}
                                    className="grid grid-cols-[1fr_0.8fr_0.6fr_0.6fr] gap-3 px-4 py-3 text-sm"
                                >
                                    <span className="font-medium text-slate-900">{row.userId}</span>
                                    <span>{row.moduleKey}</span>
                                    <span>{row.canView ? "Yes" : "No"}</span>
                                    <span>{row.canManage ? "Yes" : "No"}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

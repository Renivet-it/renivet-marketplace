import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function GstReportPage() {
    await assertFinanceModulePageAccess("gst_reports");
    const [hsnRows, reportRuns] = await Promise.all([
        financeComplianceQueries.listHsnMaster(),
        financeComplianceQueries.listGstReportRuns(),
    ]);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M4</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">GST Compliance Automation</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        HSN master coverage and generated GST/TCS report runs for the finance close workflow.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Active HSN rows</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                            {hsnRows.filter((row) => row.isActive).length}
                        </p>
                    </div>
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase text-slate-500">Report runs</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">{reportRuns.length}</p>
                    </div>
                </section>

                <section className="rounded-md border bg-white p-4 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Recent report runs</h2>
                    <div className="mt-4 divide-y">
                        {reportRuns.length === 0 ? (
                            <p className="py-4 text-sm text-slate-500">No GST report runs generated yet.</p>
                        ) : (
                            reportRuns.map((run) => (
                                <div key={run.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                                    <div>
                                        <p className="font-medium text-slate-900">{run.monthKey}</p>
                                        <p className="text-slate-500">{run.status}</p>
                                    </div>
                                    <span>{run.recordCount} rows</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

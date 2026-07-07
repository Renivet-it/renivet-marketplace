import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";
import { previewGstExport } from "@/lib/finance/gst";
import { GstReportWorkspace } from "@/components/dashboard/general/finance/gst-report-workspace";

function getPreviousMonthKey() {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

export default async function GstReportPage() {
    await assertFinanceModulePageAccess("gst_reports");
    const monthKey = getPreviousMonthKey();
    const [hsnRows, reportRuns] = await Promise.all([
        financeComplianceQueries.listHsnMaster(),
        financeComplianceQueries.listGstReportRuns(),
    ]);
    const preview = await previewGstExport(monthKey);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M4</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">GST Compliance Automation</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        RegisterKaro-ready GST plus TCS export with HSN validation, B2B checks,
                        credit-note handling, and monthly run history.
                    </p>
                </header>
                <GstReportWorkspace
                    initialMonthKey={monthKey}
                    initialHsnRows={hsnRows}
                    initialReportRuns={reportRuns}
                    initialPreview={preview}
                />
            </div>
        </main>
    );
}

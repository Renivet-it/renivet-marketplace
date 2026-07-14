import { HsnMasterWorkspace } from "@/components/dashboard/general/finance/hsn-master-workspace";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function HsnMasterPage() {
    await assertFinanceModulePageAccess("hsn_master");
    const hsnRows = await financeComplianceQueries.listHsnMaster();

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,_rgba(248,250,252,0.96),_rgba(241,245,249,0.9))] p-4 sm:p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <HsnMasterWorkspace
                    initialHsnRows={hsnRows}
                    intro={
                        <>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                                Finance Master Data
                            </p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.2rem]">
                                HSN Master
                            </h1>
                            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                                Maintain HSN codes and GST rates separately from the GST filing workspace so
                                finance can update tax masters independently and billing can reuse the same source.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm">
                                    Shared source for finance and billing
                                </div>
                                <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm">
                                    Faster GST issue resolution
                                </div>
                                <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm">
                                    CSV-ready tax master maintenance
                                </div>
                            </div>
                        </>
                    }
                />
            </div>
        </main>
    );
}

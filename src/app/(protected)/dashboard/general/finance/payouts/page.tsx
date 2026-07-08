import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";
import { PayoutsWorkspace } from "@/components/dashboard/general/finance/payouts-workspace";

export default async function PayoutsPage() {
    await assertFinanceModulePageAccess("payouts");
    const cycles = await financeComplianceQueries.listPayoutCycles();
    const initialCycle = cycles[0];
    const initialDetail = initialCycle
        ? {
              cycle: await financeComplianceQueries.getPayoutCycle(initialCycle.id),
              lineItems: await financeComplianceQueries.listPayoutLineItems(initialCycle.id),
              overrides: await financeComplianceQueries.listPayoutOverrides(initialCycle.id),
          }
        : null;

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">M3 + M5</p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">Brand Payout Engine</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Calculation, override approval, brand-by-brand execution, manual NEFT completion,
                        and statement export in one finance workflow.
                    </p>
                </header>
                <PayoutsWorkspace initialCycles={cycles} initialDetail={initialDetail} />
            </div>
        </main>
    );
}

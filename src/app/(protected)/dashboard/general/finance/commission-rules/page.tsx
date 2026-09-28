import { CommissionRulesWorkspace } from "@/components/dashboard/general/finance/commission-rules-workspace";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function CommissionRulesPage() {
    const { moduleAccess } = await assertFinanceModulePageAccess("payouts");

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-[1600px]">
                <CommissionRulesWorkspace canManage={moduleAccess.canManage} />
            </div>
        </main>
    );
}

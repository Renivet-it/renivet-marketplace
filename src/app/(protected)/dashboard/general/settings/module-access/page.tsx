import { ModuleAccessWorkspace } from "@/components/dashboard/general/settings/module-access-workspace";
import { isAjSuperAdmin } from "@/lib/finance/access";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function ModuleAccessPage() {
    const access = await assertFinanceModulePageAccess("audit_log_finance");
    const canManage = access.moduleAccess.canManage || isAjSuperAdmin(access.userId);

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">
                <ModuleAccessWorkspace canManage={canManage} isAj={isAjSuperAdmin(access.userId)} />
            </div>
        </main>
    );
}

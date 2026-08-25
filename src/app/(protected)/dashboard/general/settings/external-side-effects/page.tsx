import { ExternalSideEffectsWorkspace } from "@/components/dashboard/general/settings/external-side-effects-workspace";
import { assertFinanceModulePageAccess } from "@/lib/finance/page-access";

export default async function ExternalSideEffectsPage() {
    const access = await assertFinanceModulePageAccess("compliance_admin");

    return (
        <ExternalSideEffectsWorkspace
            canManage={access.moduleAccess.canManage}
        />
    );
}

import { BitFieldSitePermission } from "@/config/permissions";
import { financeModules } from "@/lib/db/schema";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { hasPermission } from "@/lib/utils";

export async function getFinanceModuleAccess(params: {
    userId: string;
    sitePermissions: number;
    moduleKey: (typeof financeModules)[number];
}) {
    const isAdmin = hasPermission(params.sitePermissions, [
        BitFieldSitePermission.ADMINISTRATOR,
        BitFieldSitePermission.MANAGE_MONITORING,
    ], "any");

    if (isAdmin) {
        return { canView: true, canManage: true, isInherited: true };
    }

    const entries = await financeComplianceQueries.getModuleAccessForUser(params.userId);
    const entry = entries.find((item) => item.moduleKey === params.moduleKey);
    return {
        canView: entry?.canView ?? false,
        canManage: entry?.canManage ?? false,
        isInherited: false,
    };
}

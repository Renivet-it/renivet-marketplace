import { BitFieldSitePermission } from "@/config/permissions";
import { financeModules } from "@/lib/db/schema";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { forbidden, notFound } from "next/navigation";
import { getFinanceModuleAccess, hasFinanceAdminAccess } from "./access";

export async function assertFinanceDashboardAccess() {
    const { userId } = await auth();
    if (!userId) notFound();

    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    const isFinanceAdmin = hasFinanceAdminAccess({
        sitePermissions: permissions,
        roles: user?.roles,
    });
    const moduleAccessRows = await financeComplianceQueries.getModuleAccessForUser(
        userId
    );
    const hasModuleAccess = moduleAccessRows.some(
        (item) => item.canView || item.canManage
    );
    const allowed = hasPermission(
        permissions,
        [
            BitFieldSitePermission.ADMINISTRATOR,
            BitFieldSitePermission.VIEW_MONITORING,
            BitFieldSitePermission.MANAGE_MONITORING,
            BitFieldSitePermission.VIEW_SETTINGS,
            BitFieldSitePermission.MANAGE_SETTINGS,
        ],
        "any"
    );

    if (!allowed && !isFinanceAdmin && !hasModuleAccess) notFound();

    return {
        userId,
        permissions,
        user,
        isFinanceAdmin,
        hasModuleAccess,
    };
}

export async function assertFinanceModulePageAccess(
    moduleKey: (typeof financeModules)[number],
    mode: "view" | "manage" = "view"
) {
    const access = await assertFinanceDashboardAccess();
    const moduleAccess = await getFinanceModuleAccess({
        userId: access.userId,
        sitePermissions: access.permissions,
        roles: access.user?.roles,
        moduleKey,
    });

    if (
        (mode === "manage" && !moduleAccess.canManage) ||
        (mode === "view" && !moduleAccess.canView && !moduleAccess.canManage)
    ) {
        if (moduleKey === "monthly_pl") {
            forbidden();
        }
        notFound();
    }

    return {
        ...access,
        moduleAccess,
    };
}

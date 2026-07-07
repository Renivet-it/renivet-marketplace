import { BitFieldSitePermission } from "@/config/permissions";
import { financeModules } from "@/lib/db/schema";
import { financeComplianceQueries } from "@/lib/db/queries/finance-compliance";
import { hasPermission } from "@/lib/utils";

type FinanceAccessRole = {
    name?: string | null;
    slug?: string | null;
    isSiteRole?: boolean | null;
};

export function hasFinanceAdminAccess(params: {
    sitePermissions: number;
    roles?: FinanceAccessRole[];
}) {
    const hasAdminBitfield = hasPermission(
        params.sitePermissions,
        [
            BitFieldSitePermission.ADMINISTRATOR,
            BitFieldSitePermission.MANAGE_MONITORING,
        ],
        "any"
    );

    if (hasAdminBitfield) return true;

    return (
        params.roles?.some((role) => {
            if (role.isSiteRole === false) return false;
            const slug = (role.slug ?? "").trim().toLowerCase();
            const name = (role.name ?? "").trim().toLowerCase();
            return slug === "admin" || name === "admin";
        }) ?? false
    );
}

export async function getFinanceModuleAccess(params: {
    userId: string;
    sitePermissions: number;
    roles?: FinanceAccessRole[];
    moduleKey: (typeof financeModules)[number];
}) {
    const entries = await financeComplianceQueries.getModuleAccessForUser(params.userId);
    const entry = entries.find((item) => item.moduleKey === params.moduleKey);

    if (params.moduleKey === "monthly_pl") {
        return {
            canView: entry?.canView ?? false,
            canManage: entry?.canManage ?? false,
            isInherited: false,
        };
    }

    const isAdmin = hasFinanceAdminAccess({
        sitePermissions: params.sitePermissions,
        roles: params.roles,
    });

    if (isAdmin) {
        return { canView: true, canManage: true, isInherited: true };
    }
    return {
        canView: entry?.canView ?? false,
        canManage: entry?.canManage ?? false,
        isInherited: false,
    };
}

export function isAjSuperAdmin(userId?: string | null) {
    return Boolean(userId) && userId === process.env.AJ_USER_ID;
}

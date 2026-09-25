import { BitFieldSitePermission } from "@/config/permissions";
import { hasFinanceAdminAccess } from "@/lib/finance/access";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export async function assertSlugMigrationAdminAccess() {
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
    if (
        !hasPermission(permissions, [BitFieldSitePermission.ADMINISTRATOR]) &&
        !isFinanceAdmin
    )
        notFound();
    return { userId };
}

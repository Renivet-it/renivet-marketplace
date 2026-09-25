import { BitFieldSitePermission } from "@/config/permissions";
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
    if (!hasPermission(permissions, [BitFieldSitePermission.ADMINISTRATOR]))
        notFound();
    return { userId };
}

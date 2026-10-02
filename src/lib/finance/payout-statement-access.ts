import { getFinanceModuleAccess } from "@/lib/finance/access";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";

export type PayoutStatementAccess =
    | { ok: true; userId: string }
    | { ok: false; status: 401 | 403; error: "Unauthorized" | "Forbidden" };

// Brand payout statements are finance-only (AQ-59, REN-228 SPEC step 2). There is
// no brand-facing consumer of the statement URL; brand self-service download
// needs a brand-ownership check and is out of scope here.
export async function authorizePayoutStatementDownload(): Promise<PayoutStatementAccess> {
    const { userId } = await auth();
    if (!userId) return { ok: false, status: 401, error: "Unauthorized" };

    const user = await userCache.get(userId);
    const sitePermissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const access = await getFinanceModuleAccess({
        userId,
        sitePermissions,
        roles: user?.roles,
        moduleKey: "payouts",
    });
    if (!access.canView && !access.canManage) {
        return { ok: false, status: 403, error: "Forbidden" };
    }

    return { ok: true, userId };
}

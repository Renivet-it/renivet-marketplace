import { BitFieldSitePermission } from "@/config/permissions";
import { userCache } from "@/lib/redis/methods";
import {
    AppError,
    CResponse,
    getUserPermissions,
    handleError,
    hasPermission,
} from "@/lib/utils";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const uId = searchParams.get("uId");
        const path = searchParams.get("path");

        if (!searchParams) throw new AppError("Invalid request", "BAD_REQUEST");
        if (!uId || !path)
            throw new AppError("Invalid parameters", "BAD_REQUEST");

        const existingUser = await userCache.get(uId);
        if (!existingUser) throw new AppError("User not found", "NOT_FOUND");

        const { sitePermissions } = getUserPermissions(existingUser.roles);

        let isAuthorized = true;

        if (path.startsWith("/dashboard")) {
            isAuthorized = hasPermission(sitePermissions, [
                BitFieldSitePermission.VIEW_PROTECTED_PAGES,
            ]);
        }

        return CResponse({
            message: isAuthorized ? "OK" : "FORBIDDEN",
        });
    } catch (err) {
        return handleError(err);
    }
}

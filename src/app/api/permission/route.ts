import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import {
    AppError,
    CResponse,
    getUserPermissions,
    handleError,
    hasPermission,
} from "@/lib/utils";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const uId = searchParams.get("uId");
        const path = searchParams.get("path");

        if (!searchParams) throw new AppError("Invalid request", "BAD_REQUEST");
        if (!uId || !path)
            throw new AppError("Invalid parameters", "BAD_REQUEST");

        let existingUser = await userCache.get(uId);
        if (!existingUser) {
            const dbUser = await db.query.users.findFirst({
                where: eq(users.id, uId),
                with: {
                    profile: true,
                    roles: {
                        with: {
                            role: true,
                        },
                    },
                },
            });
            if (!dbUser) throw new AppError("User not found", "NOT_FOUND");

            existingUser = {
                ...dbUser,
                profile: dbUser.profile ?? {
                    address: null,
                    phone: null,
                    isProfileCompleted: false,
                },
                roles: dbUser.roles.map((r) => r.role),
            };

            await userCache.add(existingUser);
        }

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

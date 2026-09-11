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
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
    buildPermissionResponse,
    resolvePermissionUserId,
} from "./permission-policy";

export async function GET(req: NextRequest) {
    try {
        const { userId: authenticatedUserId } = await auth();
        const userId = resolvePermissionUserId({
            authenticatedUserId,
            requestedUserId: req.nextUrl.searchParams.get("uId"),
        });
        if (!userId) throw new AppError("Unauthorized", "UNAUTHORIZED");

        const searchParams = req.nextUrl.searchParams;
        const path = searchParams.get("path");

        if (!searchParams) throw new AppError("Invalid request", "BAD_REQUEST");
        if (!path) throw new AppError("Invalid parameters", "BAD_REQUEST");

        let existingUser = await userCache.get(userId);

        // A Clerk session can become active a moment before the user.created
        // webhook writes the local profile. Create the minimal local profile
        // here as a safe fallback so a newly signed-in customer is not bounced.
        if (!existingUser) {
            const clerkUser = await (await clerkClient()).users.getUser(userId);
            const email =
                clerkUser.primaryEmailAddress ?? clerkUser.emailAddresses[0];
            const phone =
                clerkUser.primaryPhoneNumber ?? clerkUser.phoneNumbers[0];
            const emailAddress =
                email?.emailAddress ??
                (phone?.phoneNumber
                    ? `${phone.phoneNumber.replace(/[^0-9]/g, "")}@phone.renivet.com`
                    : `${clerkUser.id}@renivet.com`);

            await db
                .insert(users)
                .values({
                    id: userId,
                    firstName:
                        clerkUser.firstName || (phone ? "User" : "Customer"),
                    lastName: clerkUser.lastName || "",
                    email: emailAddress,
                    phone: phone?.phoneNumber ?? null,
                    avatarUrl: clerkUser.imageUrl ?? null,
                    isEmailVerified: email?.verification?.status === "verified",
                    isPhoneVerified: phone?.verification?.status === "verified",
                    createdAt: new Date(clerkUser.createdAt),
                    updatedAt: new Date(clerkUser.updatedAt),
                })
                .onConflictDoNothing();
            existingUser = await userCache.get(userId);
        }
        if (!existingUser) throw new AppError("User not found", "NOT_FOUND");

        const { sitePermissions, brandPermissions } = getUserPermissions(
            existingUser.roles
        );

        let isAuthorized = true;

        if (path.startsWith("/dashboard")) {
            isAuthorized =
                hasPermission(sitePermissions, [
                    BitFieldSitePermission.VIEW_PROTECTED_PAGES,
                ]) || !!existingUser.brand;
        }

        return CResponse({
            message: isAuthorized ? "OK" : "FORBIDDEN",
            data: buildPermissionResponse(isAuthorized, {
                sitePermissions,
                brandPermissions,
                brandId: existingUser.brand?.id ?? null,
            }),
        });
    } catch (err) {
        console.error(err);
        return handleError(err);
    }
}

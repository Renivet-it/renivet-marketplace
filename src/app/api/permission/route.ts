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
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const uId = searchParams.get("uId");
        const path = searchParams.get("path");

        if (!searchParams) throw new AppError("Invalid request", "BAD_REQUEST");
        if (!uId || !path)
            throw new AppError("Invalid parameters", "BAD_REQUEST");

        const { userId } = await auth();
        if (!userId || userId !== uId)
            throw new AppError("Unauthorized", "UNAUTHORIZED");

        let existingUser = await userCache.get(uId);

        if (!existingUser) {
            const clerkUser = await currentUser();

            if (!clerkUser || clerkUser.id !== uId)
                throw new AppError("User not found", "NOT_FOUND");

            const primaryEmail = clerkUser.emailAddresses.find(
                (email) => email.id === clerkUser.primaryEmailAddressId
            );
            const primaryPhone = clerkUser.phoneNumbers.find(
                (phone) => phone.id === clerkUser.primaryPhoneNumberId
            );

            await db
                .insert(users)
                .values({
                    id: clerkUser.id,
                    firstName: clerkUser.firstName ?? "Renivet",
                    lastName: clerkUser.lastName ?? "Customer",
                    email: primaryEmail?.emailAddress ?? null,
                    phone: primaryPhone?.phoneNumber ?? null,
                    avatarUrl: clerkUser.imageUrl,
                    isEmailVerified:
                        primaryEmail?.verification?.status === "verified",
                    isPhoneVerified:
                        primaryPhone?.verification?.status === "verified",
                    createdAt: new Date(clerkUser.createdAt),
                    updatedAt: new Date(clerkUser.updatedAt),
                })
                .onConflictDoNothing();

            existingUser = await userCache.get(uId);
        }

        if (!existingUser) throw new AppError("User not found", "NOT_FOUND");

        const { sitePermissions } = getUserPermissions(existingUser.roles);

        let isAuthorized = true;

        if (path.startsWith("/dashboard")) {
            isAuthorized =
                hasPermission(sitePermissions, [
                    BitFieldSitePermission.VIEW_PROTECTED_PAGES,
                ]) || !!existingUser.brand;
        }

        return CResponse({
            message: isAuthorized ? "OK" : "FORBIDDEN",
            data: existingUser,
        });
    } catch (err) {
        console.error(err);
        return handleError(err);
    }
}

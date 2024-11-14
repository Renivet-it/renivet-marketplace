import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { brandsWaitlist } from "@/lib/db/schema";
import { jwt } from "@/lib/jose";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();
export const utApi = new UTApi();

export const uploadRouter = {
    blogThumbnailUploader: f({ image: { maxFileSize: "4MB" } })
        .middleware(async () => {
            const auth = await clerkAuth();
            if (!auth.userId)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "You're not authorized",
                });

            const existingUser = await userCache.get(auth.userId);
            if (!existingUser)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "You're not authorized",
                });

            const { sitePermissions } = getUserPermissions(existingUser.roles);
            const isAuthorized = hasPermission(sitePermissions, [
                BitFieldSitePermission.MANAGE_BLOGS,
            ]);

            if (!isAuthorized)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "You're not authorized",
                });

            return { userId: auth.userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploaderId: metadata.userId,
                name: file.name,
                size: file.size,
                key: file.key,
                url: file.url,
            };
        }),
    contentUploader: f({ image: { maxFileSize: "4MB" } })
        .middleware(async () => {
            const auth = await clerkAuth();
            if (!auth.userId)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "You're not authorized",
                });

            const existingUser = await userCache.get(auth.userId);
            if (!existingUser)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "You're not authorized",
                });

            const { sitePermissions } = getUserPermissions(existingUser.roles);
            const isAuthorized = hasPermission(sitePermissions, [
                BitFieldSitePermission.MANAGE_CONTENT,
            ]);

            if (!isAuthorized)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "You're not authorized",
                });

            return { userId: auth.userId };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploaderId: metadata.userId,
                name: file.name,
                size: file.size,
                key: file.key,
                url: file.url,
            };
        }),
    brandDemoUploader: f({ "video/mp4": { maxFileSize: "32MB" } })
        .input(
            z.object({
                token: z
                    .string({
                        invalid_type_error: "Invalid token",
                        required_error: "Token is required",
                    })
                    .min(1, "Token is required"),
            })
        )
        .middleware(async ({ input }) => {
            const { token } = input;

            const { data, error } = await jwt.verify(token);
            if (error)
                throw new UploadThingError({
                    code: "BAD_REQUEST",
                    message: error.message,
                });

            const existingBrandsWaitlistEntry =
                await db.query.brandsWaitlist.findFirst({
                    where: eq(brandsWaitlist.brandEmail, data.subject),
                });
            if (!existingBrandsWaitlistEntry)
                throw new UploadThingError({
                    code: "NOT_FOUND",
                    message: "Brands waitlist entry not found",
                });

            return { brandId: existingBrandsWaitlistEntry.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploaderId: metadata.brandId,
                name: file.name,
                size: file.size,
                key: file.key,
                url: file.url,
            };
        }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

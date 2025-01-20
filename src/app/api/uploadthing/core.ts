import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandConfidentials,
    brandRequests,
    brandsWaitlist,
} from "@/lib/db/schema";
import { jwt } from "@/lib/jose";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { and, eq, ne } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { z } from "zod";

const f = createUploadthing();
export const utApi = new UTApi();

export const uploadRouter = {
    blogThumbnailUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
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
    contentUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
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
    brandRequestDemoUploader: f({
        "video/mp4": { maxFileSize: "32MB", maxFileCount: 1 },
    })
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

            const existingBrandRequest = await db.query.brandRequests.findFirst(
                {
                    where: and(
                        eq(brandRequests.ownerId, auth.userId),
                        ne(brandRequests.status, "rejected")
                    ),
                }
            );
            if (existingBrandRequest)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message:
                        "You have already submitted a brand request, withdraw it if you want to submit a new one",
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
    brandRequestLogoUploader: f({
        "image/png": { maxFileSize: "4MB", maxFileCount: 1 },
        "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
    })
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

            const existingBrandRequest = await db.query.brandRequests.findFirst(
                {
                    where: and(
                        eq(brandRequests.ownerId, auth.userId),
                        ne(brandRequests.status, "rejected")
                    ),
                }
            );
            if (existingBrandRequest)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message:
                        "You have already submitted a brand request, withdraw it if you want to submit a new one",
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
    brandDemoUploader: f({
        "video/mp4": { maxFileSize: "32MB", maxFileCount: 1 },
    })
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
    brandLogoUploader: f({
        "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
        "image/png": { maxFileSize: "4MB", maxFileCount: 1 },
    })
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

            const { brandPermissions } = getUserPermissions(existingUser.roles);
            const isAuthorized = hasPermission(brandPermissions, [
                BitFieldBrandPermission.MANAGE_PRODUCTS |
                    BitFieldBrandPermission.MANAGE_BRANDING,
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
    brandCoverUploader: f({
        "image/jpeg": { maxFileSize: "4MB", maxFileCount: 1 },
        "image/png": { maxFileSize: "4MB", maxFileCount: 1 },
    })
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

            const { brandPermissions } = getUserPermissions(existingUser.roles);
            const isAuthorized = hasPermission(brandPermissions, [
                BitFieldBrandPermission.MANAGE_PRODUCTS |
                    BitFieldBrandPermission.MANAGE_BRANDING,
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
    brandRequestDocUploader: f({
        "application/pdf": { maxFileSize: "4MB", maxFileCount: 1 },
    })
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
            if (!existingUser.brand)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message: "You're not part of a brand",
                });

            const existingBrandConf =
                await db.query.brandConfidentials.findFirst({
                    where: and(
                        eq(brandConfidentials.id, existingUser.brand.id),
                        ne(brandConfidentials.verificationStatus, "rejected")
                    ),
                });
            if (existingBrandConf)
                throw new UploadThingError({
                    code: "FORBIDDEN",
                    message:
                        "Your brand has already submitted the confidential information",
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
    brandMediaUploader: f({
        image: { maxFileCount: 9999, maxFileSize: "1024GB" },
        video: { maxFileCount: 9999, maxFileSize: "1024GB" },
        audio: { maxFileCount: 9999, maxFileSize: "1024GB" },
        pdf: { maxFileCount: 9999, maxFileSize: "1024GB" },
        blob: { maxFileCount: 9999, maxFileSize: "1024GB" },
        text: { maxFileCount: 9999, maxFileSize: "1024GB" },
    })
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

            const { brandPermissions } = getUserPermissions(existingUser.roles);
            const isAuthorized = hasPermission(brandPermissions, [
                BitFieldBrandPermission.MANAGE_PRODUCTS |
                    BitFieldBrandPermission.MANAGE_BRANDING,
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
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

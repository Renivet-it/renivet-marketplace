import { BitFieldSitePermission } from "@/config/permissions";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

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
                uploadederId: metadata.userId,
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
                uploadederId: metadata.userId,
                name: file.name,
                size: file.size,
                key: file.key,
                url: file.url,
            };
        }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

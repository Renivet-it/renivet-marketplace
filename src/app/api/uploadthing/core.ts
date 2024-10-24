import { auth as clerkAuth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB" } })
        .middleware(async () => {
            const auth = clerkAuth();
            if (!auth.userId)
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

export type OurFileRouter = typeof ourFileRouter;

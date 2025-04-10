import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldBrandPermission, BitFieldSitePermission } from "@/config/permissions";
import { brandCache, mediaCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey } from "@/lib/utils";
import {
    createBrandMediaItemSchema,
    updateBrandMediaItemSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "../../../utils";
import { z } from "zod";

export const mediaRouter = createTRPCRouter({
    getMediaItems: protectedProcedure
        .input(z.object({ brandId: z.string().uuid() }))
        .query(async ({ input, ctx }) => {
            const { user } = ctx;
            const { brandId } = input;

            const isAdmin = hasPermission(
                user.sitePermissions,
                [BitFieldSitePermission.ADMINISTRATOR]
            );

            if (!isAdmin && user.brand?.id !== brandId)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You are not a member of this brand",
                });

            // if (user.brand?.id !== brandId)
            //     throw new TRPCError({
            //         code: "UNAUTHORIZED",
            //         message: "User does not have access to this brand",
            //     });

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const brandMediaItems = await mediaCache.getAll(brandId);
            return brandMediaItems;
        }),
    createMediaItems: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                values: createBrandMediaItemSchema.array(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldBrandPermission.MANAGE_BRANDING |
                    BitFieldBrandPermission.MANAGE_PRODUCTS,
                "all",
                "brand"
            )
        )
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { id: brandId, values } = input;
            const isAdmin = hasPermission(
                user.sitePermissions,
                [BitFieldSitePermission.ADMINISTRATOR]
            );

            if (!isAdmin && user.brand?.id !== brandId)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "User does not have access to this brand",
                });

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const [brandMediaItems] = await Promise.all([
                queries.brandMediaItems.bulkCreateBrandMediaItems(values),
                mediaCache.drop(brandId),
            ]);

            return brandMediaItems;
        }),
    updateMediaItem: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                values: updateBrandMediaItemSchema,
            })
        )
        .use(
            isTRPCAuth(
                BitFieldBrandPermission.MANAGE_BRANDING |
                    BitFieldBrandPermission.MANAGE_PRODUCTS,
                "all",
                "brand"
            )
        )
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { id, values } = input;

            const existingMediaItem =
                await queries.brandMediaItems.getBrandMediaItem(id);
            if (!existingMediaItem)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Media item not found",
                });

            const existingBrand = await brandCache.get(
                existingMediaItem.brandId
            );
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            if (user.brand?.id !== existingMediaItem.brandId)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "User does not have access to this brand",
                });

            const existingFileKey = getUploadThingFileKey(
                existingMediaItem.url
            );
            const newFileKey = getUploadThingFileKey(values.url);

            if (existingFileKey !== newFileKey)
                await utApi.deleteFiles([existingFileKey]);

            const [updatedMediaItem] = await Promise.all([
                queries.brandMediaItems.updateBrandMediaItem(id, values),
                mediaCache.drop(existingMediaItem.brandId),
            ]);

            return updatedMediaItem;
        }),
    deleteMediaItems: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                ids: z.array(z.string().uuid()),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldBrandPermission.MANAGE_BRANDING |
                    BitFieldBrandPermission.MANAGE_PRODUCTS,
                "all",
                "brand"
            )
        )
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { brandId, ids } = input;

            if (user.brand?.id !== brandId)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "User does not have access to this brand",
                });

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingMediaItems =
                await queries.brandMediaItems.getBrandMediaItemsByBrand(
                    brandId
                );

            const mediaItemsToDelete = existingMediaItems.data.filter((item) =>
                ids.includes(item.id)
            );

            if (mediaItemsToDelete.length !== ids.length)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Media item not found",
                });

            const fileKeys = mediaItemsToDelete.map((item) =>
                getUploadThingFileKey(item.url)
            );

            await Promise.all([
                queries.brandMediaItems.bulkDeleteBrandMediaItems(ids),
                utApi.deleteFiles(fileKeys),
                mediaCache.drop(brandId),
            ]);

            return true;
        }),
});

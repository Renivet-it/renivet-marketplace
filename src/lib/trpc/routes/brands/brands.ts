import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey } from "@/lib/utils";
import { updateBrandSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const brandsRouter = createTRPCRouter({
    getBrand: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            return existingBrand;
        }),
    updateBrand: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id, values } = input;
            const { queries } = ctx;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const keysToBeDeleted: string[] = [];

            const existingLogoUrl = existingBrand.logoUrl;
            const existingCoverUrl = existingBrand.coverUrl;

            const inputLogoUrl = values.logoUrl;
            const inputCoverUrl = values.coverUrl;

            if (existingLogoUrl && existingLogoUrl !== inputLogoUrl)
                keysToBeDeleted.push(getUploadThingFileKey(existingLogoUrl));
            if (existingCoverUrl && existingCoverUrl !== inputCoverUrl)
                keysToBeDeleted.push(getUploadThingFileKey(existingCoverUrl));

            const data = await Promise.all([
                queries.brands.updateBrand(id, values),
                brandCache.remove(id),
                keysToBeDeleted.length > 0 &&
                    utApi.deleteFiles(keysToBeDeleted),
            ]);
            return data;
        }),
});

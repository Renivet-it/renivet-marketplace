import { BitFieldSitePermission } from "@/config/permissions";
import { categoryCache, subCategoryCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import {
    createSubCategorySchema,
    updateSubCategorySchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { log } from "console";
import { z } from "zod";

export const subCategoriesRouter = createTRPCRouter({
    getSubCategories: publicProcedure.query(async () => {
        console.log("******** Inside t.general.sub-categories********* ");
        
        const subCategories = await subCategoryCache.getAll();
        return {
            data: subCategories,
            count: subCategories.length,
        };
    }),
    getSubCategory: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const subCategory = await subCategoryCache.get(id);
            if (!subCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Sub Category not found",
                });

            return subCategory;
        }),

        
        createSubCategory: protectedProcedure
        .input(createSubCategorySchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const slug = slugify(input.name);

            const newSubCategory =
                await queries.subCategories.createSubCategory({
                    ...input,
                    slug,
                });

            await Promise.all([
                subCategoryCache.add({
                    ...newSubCategory,
                    productTypes: 0,
                }),
                categoryCache.remove(newSubCategory.categoryId),
            ]);

            return newSubCategory;
        }),
    updateSubCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateSubCategorySchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, data } = input;

            const existingSubCategory = await subCategoryCache.get(id);
            if (!existingSubCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Sub Category not found",
                });

            const slug = slugify(data.name);

            const [updatedSubCategory] = await Promise.all([
                queries.subCategories.updateSubCategory(id, {
                    ...data,
                    slug,
                }),
                subCategoryCache.remove(id),
                existingSubCategory.categoryId !== data.categoryId
                    ? categoryCache.remove(data.categoryId)
                    : null,
            ]);

            return updatedSubCategory;
        }),
    deleteSubCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingSubCategory = await subCategoryCache.get(id);
            if (!existingSubCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Sub Category not found",
                });

            await Promise.all([
                queries.subCategories.deleteSubCategory(id),
                subCategoryCache.remove(id),
                categoryCache.remove(existingSubCategory.categoryId),
            ]);

            return true;
        }),
});
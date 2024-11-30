import { BitFieldSitePermission } from "@/config/permissions";
import { categoryCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const categoriesRouter = createTRPCRouter({
    getCategories: publicProcedure.query(async () => {
        const categories = await categoryCache.getAll();
        return {
            data: categories,
            count: categories.length,
        };
    }),
    getCategory: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const category = await categoryCache.get(id);
            if (!category)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            return category;
        }),
    createCategory: protectedProcedure
        .input(createCategorySchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const slug = slugify(input.name);

            const existingCategory =
                await queries.categories.getCategoryBySlug(slug);
            if (existingCategory)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Category already exists",
                });

            const newCategory = await queries.categories.createCategory({
                ...input,
                slug,
            });

            await categoryCache.add({
                ...newCategory,
                subCategories: 0,
            });

            return newCategory;
        }),
    updateCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateCategorySchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, data } = input;

            const existingCategory = categoryCache.get(id);
            if (!existingCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            const slug = slugify(data.name);

            const existingOtherCategory =
                await queries.categories.getOtherCategory(slug, id);
            if (existingOtherCategory)
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "Another category with the same name already exists",
                });

            const [updatedCategory] = await Promise.all([
                queries.categories.updateCategory(id, {
                    ...data,
                    slug,
                }),
                categoryCache.remove(id),
            ]);

            return updatedCategory;
        }),
    deleteCategory: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingCategory = await categoryCache.get(id);
            if (!existingCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            await Promise.all([
                queries.categories.deleteCategory(id),
                categoryCache.remove(id),
            ]);

            return true;
        }),
});

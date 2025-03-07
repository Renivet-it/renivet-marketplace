import { BitFieldSitePermission } from "@/config/permissions";
import {
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { slugify } from "@/lib/utils";
import {
    createProductTypeSchema,
    updateProductTypeSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const productTypesRouter = createTRPCRouter({
    getProductTypes: publicProcedure.query(async () => {
        const productTypes = await productTypeCache.getAll();
        return {
            data: productTypes,
            count: productTypes.length,
        };
    }),
    getProductType: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const productType = await productTypeCache.get(id);
            if (!productType)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product Type not found",
                });

            return productType;
        }),
    createProductType: protectedProcedure
        .input(createProductTypeSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const slug = slugify(input.name);

            const [categories, subCategories] = await Promise.all([
                categoryCache.getAll(),
                subCategoryCache.getAll(),
            ]);

            const subCategory = subCategories.find(
                (sub) => sub.id === input.subCategoryId
            );
            if (!subCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Sub Category not found",
                });

            const category = categories.find(
                (cat) => cat.id === subCategory.categoryId
            );
            if (!category)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            const newProductType = await queries.productTypes.createProductType(
                {
                    ...input,
                    slug,
                }
            );

            await Promise.all([
                productTypeCache.add(newProductType),
                subCategoryCache.remove(subCategory.id),
                categoryCache.remove(category.id),
            ]);

            return newProductType;
        }),
    updateProductType: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateProductTypeSchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, data } = input;

            const existingProductType = await productTypeCache.get(id);
            if (!existingProductType)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product Type not found",
                });

            const [categories, subCategories] = await Promise.all([
                categoryCache.getAll(),
                subCategoryCache.getAll(),
            ]);

            const subCategory = subCategories.find(
                (sub) => sub.id === data.subCategoryId
            );
            if (!subCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Sub Category not found",
                });

            const category = categories.find(
                (cat) => cat.id === subCategory.categoryId
            );
            if (!category)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            const slug = slugify(data.name);

            const updatedProductType =
                await queries.productTypes.updateProductType(id, {
                    ...data,
                    slug,
                });

            await Promise.all([
                productTypeCache.add(updatedProductType),
                subCategoryCache.remove(subCategory.id),
                categoryCache.remove(category.id),
            ]);

            return updatedProductType;
        }),
    deleteProductType: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingProductType = await productTypeCache.get(id);
            if (!existingProductType)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product Type not found",
                });

            const [categories, subCategories] = await Promise.all([
                categoryCache.getAll(),
                subCategoryCache.getAll(),
            ]);

            const subCategory = subCategories.find(
                (sub) => sub.id === existingProductType.subCategoryId
            );
            if (!subCategory)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Sub Category not found",
                });

            const category = categories.find(
                (cat) => cat.id === subCategory.categoryId
            );
            if (!category)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Category not found",
                });

            await Promise.all([
                queries.productTypes.deleteProductType(id),
                productTypeCache.remove(id),
                subCategoryCache.remove(subCategory.id),
                categoryCache.remove(category.id),
            ]);

            return true;
        }),
});

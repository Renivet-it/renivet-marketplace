import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldBrandPermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { generateProductSlug, getUploadThingFileKey } from "@/lib/utils";
import { createProductSchema, updateProductSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const productsRouter = createTRPCRouter({
    getProducts: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(10),
                page: z.number().min(1).default(1),
                search: z.string().optional(),
                brandIds: z.array(z.string()).optional(),
                minPrice: z.number().optional(),
                maxPrice: z.number().optional(),
                isAvailable: z.boolean().optional(),
                isPublished: z.boolean().optional(),
                sortBy: z.enum(["price", "createdAt"]).optional(),
                sortOrder: z.enum(["asc", "desc"]).optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.products.getProducts(input);
            return data;
        }),
    getProduct: publicProcedure
        .input(
            z.object({
                productId: z.string(),
                visibility: z.enum(["published", "draft"]).optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { productId, visibility } = input;
            const { queries } = ctx;

            const data = await queries.products.getProduct(
                productId,
                visibility
            );
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            return data;
        }),
    createProduct: protectedProcedure
        .input(createProductSchema)
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { brandId, ...product } = input;

            if (brandId !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const totalProducts = await queries.products.getProductCount(
                brandId,
                "active"
            );
            if (totalProducts >= 5)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You have reached the maximum number of products",
                });

            const slug = generateProductSlug(product.name, user.brand.name);

            const data = await queries.products.createProduct({
                ...product,
                slug,
                brandId,
            });

            return data;
        }),
    updateProduct: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                values: updateProductSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId, values } = input;
            const { queries, user } = ctx;

            const existingProduct =
                await queries.products.getProduct(productId);
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const existingImages = existingProduct.imageUrls.map((url) => ({
                key: getUploadThingFileKey(url),
                url,
            }));
            const inputImages = values.imageUrls.map((url) => ({
                key: getUploadThingFileKey(url),
                url,
            }));

            const removedImages = existingImages.filter(
                (img) => !inputImages.some((i) => i.key === img.key)
            );

            if (removedImages.length > 0)
                await utApi.deleteFiles(removedImages.map((img) => img.key));

            const slug = generateProductSlug(values.name, user.brand.name);

            const data = await queries.products.updateProduct(productId, {
                ...values,
                slug,
            });

            return data;
        }),
    deleteProduct: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { productId } = input;
            const { queries, user } = ctx;

            const existingProduct =
                await queries.products.getProduct(productId);
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.brand.id !== user.brand?.id)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not a member of this brand",
                });

            const data = await queries.products.softDeleteProduct(productId);
            return data;
        }),
});

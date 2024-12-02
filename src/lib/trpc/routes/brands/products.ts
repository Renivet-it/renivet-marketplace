import { BitFieldBrandPermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
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
            })
        )
        .query(async ({ input, ctx }) => {
            const {
                limit,
                page,
                search,
                brandIds,
                minPrice,
                maxPrice,
                isAvailable,
                isPublished,
            } = input;
            const { queries } = ctx;

            const data = await queries.products.getProducts({
                limit,
                page,
                search,
                brandIds,
                minPrice,
                maxPrice,
                isAvailable,
                isPublished,
            });

            return data;
        }),
    getProduct: publicProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { productId } = input;
            const { queries } = ctx;

            const data = await queries.products.getProduct(productId);
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

            const totalProducts =
                await queries.products.getProductCount(brandId);
            if (totalProducts >= 5)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You have reached the maximum number of products",
                });

            const data = await queries.products.createProduct({
                ...product,
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

            const data = await queries.products.updateProduct(
                productId,
                values
            );

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

            const data = await queries.products.deleteProduct(productId);
            return data;
        }),
});

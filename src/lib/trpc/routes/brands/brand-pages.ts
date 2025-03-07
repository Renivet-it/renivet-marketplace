import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import {
    createBrandPageSectionProductSchema,
    createBrandPageSectionSchema,
    updateBrandPageSectionProductSchema,
    updateBrandPageSectionSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const pageSectionProductsRouter = createTRPCRouter({
    createBrandPageSectionProduct: protectedProcedure
        .input(createBrandPageSectionProductSchema)
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { brandPageSectionId, productId } = input;
            const { queries } = ctx;

            const existingBrandPageSection =
                await queries.brandPageSections.getBrandPageSection(
                    brandPageSectionId
                );
            if (!existingBrandPageSection)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand page section not found",
                });

            const existingProduct = await queries.products.getProduct({
                productId,
                isActive: true,
                isAvailable: true,
                isDeleted: false,
                isPublished: true,
                verificationStatus: "approved",
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            const data = await Promise.all([
                queries.brandPageSectionProducts.addBrandPageSectionProduct(
                    input
                ),
                brandCache.remove(existingBrandPageSection.brandId),
            ]);
            return data;
        }),
    updateBrandPageSectionProduct: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandPageSectionProductSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id, values } = input;
            const { queries } = ctx;

            const existingBrandPageSectionProduct =
                await queries.brandPageSectionProducts.getBrandPageSectionProduct(
                    id
                );
            if (!existingBrandPageSectionProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand page section product not found",
                });

            const existingBrandPageSection =
                await queries.brandPageSections.getBrandPageSection(
                    existingBrandPageSectionProduct.brandPageSectionId
                );
            if (!existingBrandPageSection)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand page section not found",
                });

            const data = await Promise.all([
                queries.brandPageSectionProducts.updateBrandPageSectionProduct(
                    id,
                    values
                ),
                brandCache.remove(existingBrandPageSection.brandId),
            ]);
            return data;
        }),
    deleteBrandPageSectionProduct: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id } = input;
            const { queries } = ctx;

            const existingBrandPageSectionProduct =
                await queries.brandPageSectionProducts.getBrandPageSectionProduct(
                    id
                );
            if (!existingBrandPageSectionProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand page section product not found",
                });

            const existingBrandPageSection =
                await queries.brandPageSections.getBrandPageSection(
                    existingBrandPageSectionProduct.brandPageSectionId
                );
            if (!existingBrandPageSection)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand page section not found",
                });

            const data = await Promise.all([
                queries.brandPageSectionProducts.deleteBrandPageSectionProduct(
                    id
                ),
                brandCache.remove(existingBrandPageSection.brandId),
            ]);
            return data;
        }),
});

export const pageSectionsRouter = createTRPCRouter({
    products: pageSectionProductsRouter,
    createBrandPageSection: protectedProcedure
        .input(createBrandPageSectionSchema)

        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { brandId } = input;
            const { queries } = ctx;

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const data = await Promise.all([
                queries.brandPageSections.createBrandPageSection(input),
                brandCache.remove(brandId),
            ]);
            return data;
        }),
    updateBrandPageSection: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandPageSectionSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id, values } = input;
            const { queries } = ctx;

            const existingBrandPageSection =
                await queries.brandPageSections.getBrandPageSection(id);
            if (!existingBrandPageSection)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand page section not found",
                });

            const data = await Promise.all([
                queries.brandPageSections.updateBrandPageSection(id, values),
                brandCache.remove(existingBrandPageSection.brandId),
            ]);
            return data;
        }),
    deleteBrandPageSection: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id } = input;
            const { queries } = ctx;

            const existingBrandPageSection =
                await queries.brandPageSections.getBrandPageSection(id);
            if (!existingBrandPageSection)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand page section not found",
                });

            const data = await Promise.all([
                queries.brandPageSections.deleteBrandPageSection(id),
                brandCache.remove(existingBrandPageSection.brandId),
            ]);
            return data;
        }),
});

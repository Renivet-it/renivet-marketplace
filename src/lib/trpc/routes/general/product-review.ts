import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import {
    createCategorizeProductSchema,
    rejectProductSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";

export const productReviewsRouter = createTRPCRouter({
    approveProduct: protectedProcedure
        .input(createCategorizeProductSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { productId, categories } = input;

            const existingProduct =
                await queries.products.getProduct(productId);
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.status !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be approved",
                });

            const existingProductCategories = existingProduct.categories.map(
                (x) => ({
                    id: x.id,
                    tag: `${x.category.id}-${x.subcategory.id}-${x.productType.id}`,
                })
            );
            const inputCategories = categories.map(
                (x) => `${x.categoryId}-${x.subcategoryId}-${x.productTypeId}`
            );

            const addedCategories = categories.filter(
                (x) =>
                    !existingProductCategories.some(
                        (y) =>
                            y.tag ===
                            `${x.categoryId}-${x.subcategoryId}-${x.productTypeId}`
                    )
            );

            const removedCategories = existingProductCategories.filter(
                (x) => !inputCategories.some((y) => y === x.tag)
            );

            const data = await Promise.all([
                queries.products.approveProduct(productId),
                queries.products.categorizeProduct(
                    productId,
                    addedCategories,
                    removedCategories.map((x) => x.id)
                ),
            ]);
            return data;
        }),
    rejectProduct: protectedProcedure
        .input(rejectProductSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, rejectionReason } = input;

            const existingProduct = await queries.products.getProduct(id);
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            if (existingProduct.status !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be rejected",
                });

            const data = await queries.products.rejectProduct(
                id,
                rejectionReason
            );
            return data;
        }),
});

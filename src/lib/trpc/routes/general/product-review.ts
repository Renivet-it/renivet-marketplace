import { env } from "@/../env";
import { BitFieldSitePermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import { brandCache, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { ProductReviewStatusUpdate } from "@/lib/resend/emails";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { generateProductSlug } from "@/lib/utils";
import { createProductSchema, rejectProductSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const productReviewsRouter = createTRPCRouter({
    addBulkProducts: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
                products: z.array(createProductSchema),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { products: inputProducts, brandId } = input;

            const existingBrand = await brandCache.get(brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const brandIds = inputProducts.map((product) => product.brandId);
            if (new Set(brandIds).size !== 1)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "All products must belong to the same brand",
                });

            const inputWithSlug = inputProducts.map((product) => {
                const slug = generateProductSlug(
                    product.title,
                    existingBrand.name
                );
                return { ...product, slug };
            });

            const data =
                await queries.products.bulkCreateProducts(inputWithSlug);

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.BULK_CREATED,
                distinctId: existingBrand.id,
                properties: {
                    brandName: existingBrand.name,
                    brandOwnerId: existingBrand.ownerId,
                    productIds: data.map((product) => product.id),
                    productTitles: data.map((product) => product.title),
                },
            });

            return data;
        }),
    approveProduct: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { productId } = input;

            const existingProduct = await queries.products.getProduct({
                productId,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            const existingBrand = await brandCache.get(existingProduct.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const cachedOwner = await userCache.get(existingBrand.ownerId);
            if (!cachedOwner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand owner not found",
                });

            if (existingProduct.verificationStatus !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be approved",
                });

            const data = await queries.products.approveProduct(productId);

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrand.email,
                subject: `Product Approved - ${existingProduct.title}`,
                react: ProductReviewStatusUpdate({
                    user: {
                        name: existingBrand.name,
                    },
                    brand: existingBrand,
                    product: {
                        id: productId,
                        title: existingProduct.title,
                        status: "approved",
                    },
                }),
            });

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.APRROVED,
                distinctId: user.id,
                properties: {
                    productId,
                    productName: existingProduct.title,
                },
            });

            return data;
        }),
    rejectProduct: protectedProcedure
        .input(rejectProductSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { id, rejectionReason } = input;

            const existingProduct = await queries.products.getProduct({
                productId: id,
            });
            if (!existingProduct)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Product not found",
                });

            const existingBrand = await brandCache.get(existingProduct.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const cachedOwner = await userCache.get(existingBrand.ownerId);
            if (!cachedOwner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand owner not found",
                });

            if (existingProduct.verificationStatus !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be rejected",
                });

            const data = await queries.products.rejectProduct(
                id,
                rejectionReason
            );

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrand.email,
                subject: `Product Rejected - ${existingProduct.title}`,
                react: ProductReviewStatusUpdate({
                    user: {
                        name: existingBrand.name,
                    },
                    brand: existingBrand,
                    product: {
                        id,
                        title: existingProduct.title,
                        status: "rejected",
                        rejectionReason: rejectionReason ?? undefined,
                    },
                }),
            });

            posthog.capture({
                event: POSTHOG_EVENTS.PRODUCT.REJECTED,
                distinctId: user.id,
                properties: {
                    productId: id,
                    productName: existingProduct.title,
                    rejectionReason,
                },
            });

            return data;
        }),
});

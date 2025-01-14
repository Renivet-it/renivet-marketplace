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
import { rejectProductSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const productReviewsRouter = createTRPCRouter({
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

            await resend.batch.send([
                {
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
                },
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: cachedOwner.email,
                    subject: `Product Approved - ${existingProduct.title}`,
                    react: ProductReviewStatusUpdate({
                        user: {
                            name: `${existingBrand.owner.firstName} ${existingBrand.owner.lastName}`,
                        },
                        brand: existingBrand,
                        product: {
                            id: productId,
                            title: existingProduct.title,
                            status: "approved",
                        },
                    }),
                },
            ]);

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

            await resend.batch.send([
                {
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
                },
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: cachedOwner.email,
                    subject: `Product Rejected - ${existingProduct.title}`,
                    react: ProductReviewStatusUpdate({
                        user: {
                            name: `${existingBrand.owner.firstName} ${existingBrand.owner.lastName}`,
                        },
                        brand: existingBrand,
                        product: {
                            id,
                            title: existingProduct.title,
                            status: "rejected",
                            rejectionReason: rejectionReason ?? undefined,
                        },
                    }),
                },
            ]);

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

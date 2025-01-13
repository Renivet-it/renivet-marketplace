import { BitFieldSitePermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
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

            if (existingProduct.verificationStatus !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be approved",
                });

            const data = await queries.products.approveProduct(productId);

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

            if (existingProduct.verificationStatus !== "pending")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Only pending products can be rejected",
                });

            const data = await queries.products.rejectProduct(
                id,
                rejectionReason
            );

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

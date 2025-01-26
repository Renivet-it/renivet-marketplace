import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldBrandPermission } from "@/config/permissions";
import { razorpay } from "@/lib/razorpay";
import { brandCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey } from "@/lib/utils";
import {
    createBrandSubscriptionSchema,
    updateBrandSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const brandSubscriptionsRouter = createTRPCRouter({
    createBrandSubscription: protectedProcedure
        .input(createBrandSubscriptionSchema.omit({ id: true }))
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const existingBrand = await brandCache.get(input.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingSubscription = existingBrand.subscriptions.find(
                (sub) => sub.planId === input.planId && sub.isActive
            );
            if (existingSubscription)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Subscription already exists",
                });

            try {
                const rzpSubscription = await razorpay.subscriptions.create({
                    plan_id: input.planId,
                    total_count: input.totalCount,
                    customer_notify: input.customerNotify ? 1 : 0,
                    expire_by: input.expireBy
                        ? new Date(input.expireBy).getTime()
                        : undefined,
                    quantity: input.quantity,
                });

                const [data] = await Promise.all([
                    queries.brandSubscriptions.createBrandSubscription({
                        ...input,
                        id: rzpSubscription.id,
                    }),
                    brandCache.remove(input.brandId),
                ]);
                return data;
            } catch (err) {
                console.error(err);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to subscribe to the plan",
                });
            }
        }),
    changeBrandSubscription: protectedProcedure
        .input(
            z.object({
                activeSubscriptionId: z.string(),
                newSubscription: createBrandSubscriptionSchema.omit({
                    id: true,
                }),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const existingSubscription =
                await queries.brandSubscriptions.getBrandSubscriptionById(
                    input.activeSubscriptionId
                );
            if (!existingSubscription)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Active subscription not found",
                });

            if (!existingSubscription.isActive)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Subscription is not active",
                });

            try {
                await razorpay.subscriptions.cancel(existingSubscription.id);

                const rzpSubscription = await razorpay.subscriptions.create({
                    plan_id: input.newSubscription.planId,
                    total_count: input.newSubscription.totalCount,
                    customer_notify: input.newSubscription.customerNotify
                        ? 1
                        : 0,
                    expire_by: input.newSubscription.expireBy
                        ? new Date(input.newSubscription.expireBy).getTime()
                        : undefined,
                    quantity: input.newSubscription.quantity,
                });

                const [data] = await Promise.all([
                    queries.brandSubscriptions.createBrandSubscription({
                        ...input.newSubscription,
                        id: rzpSubscription.id,
                    }),
                    brandCache.remove(input.newSubscription.brandId),
                ]);

                return data;
            } catch (err) {
                console.error(err);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to change the subscription",
                });
            }
        }),
    cancelBrandSubscription: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const existingSubscription =
                await queries.brandSubscriptions.getBrandSubscriptionById(
                    input.id
                );
            if (!existingSubscription)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Subscription not found",
                });

            try {
                await razorpay.subscriptions.cancel(existingSubscription.id);

                const [data] = await Promise.all([
                    queries.brandSubscriptions.updateBrandSubscription(
                        input.id,
                        {
                            isActive: false,
                            renewedAt: null,
                        }
                    ),
                    brandCache.remove(existingSubscription.brandId),
                ]);

                return data;
            } catch (err) {
                console.error(err);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to cancel the subscription",
                });
            }
        }),
});

export const brandsRouter = createTRPCRouter({
    subscriptions: brandSubscriptionsRouter,
    getBrand: publicProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            return existingBrand;
        }),
    updateBrand: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandSchema,
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_BRANDING, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { id, values } = input;
            const { queries } = ctx;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const keysToBeDeleted: string[] = [];

            const existingLogoUrl = existingBrand.logoUrl;
            const existingCoverUrl = existingBrand.coverUrl;

            const inputLogoUrl = values.logoUrl;
            const inputCoverUrl = values.coverUrl;

            if (existingLogoUrl && existingLogoUrl !== inputLogoUrl)
                keysToBeDeleted.push(getUploadThingFileKey(existingLogoUrl));
            if (existingCoverUrl && existingCoverUrl !== inputCoverUrl)
                keysToBeDeleted.push(getUploadThingFileKey(existingCoverUrl));

            const data = await Promise.all([
                queries.brands.updateBrand(id, values),
                brandCache.remove(id),
                keysToBeDeleted.length > 0 &&
                    utApi.deleteFiles(keysToBeDeleted),
            ]);
            return data;
        }),
});

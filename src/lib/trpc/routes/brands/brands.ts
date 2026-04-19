import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldBrandPermission } from "@/config/permissions";
import { brandUnicommerceIntegrations, brands } from "@/lib/db/schema";
import { razorpay } from "@/lib/razorpay";
import { brandCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { UnicommerceClient } from "@/lib/unicommerce/client";
import { decryptSecret, encryptSecret } from "@/lib/unicommerce/crypto";
import { syncBrandUnicommerceInventory } from "@/lib/unicommerce/sync";
import { getUploadThingFileKey } from "@/lib/utils";
import {
    createBrandSubscriptionSchema,
    updateBrandSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
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

function resolveErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export const brandsRouter = createTRPCRouter({
    subscriptions: brandSubscriptionsRouter,
    getUnicommerceIntegration: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .query(async ({ input, ctx }) => {
            const existingBrand = await brandCache.get(input.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const integration =
                await ctx.db.query.brandUnicommerceIntegrations.findFirst({
                    where: eq(
                        brandUnicommerceIntegrations.brandId,
                        input.brandId
                    ),
                });

            return integration
                ? {
                      ...integration,
                      encryptedPassword: undefined,
                      encryptedAccessToken: undefined,
                      encryptedRefreshToken: undefined,
                      hasCredentials: true,
                  }
                : null;
        }),
    upsertUnicommerceIntegration: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                tenant: z.string().trim().min(1),
                facilityId: z.string().trim().min(1),
                username: z.string().trim().min(1),
                password: z.string().min(1).optional(),
                isActive: z.boolean().default(true),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const existingBrand = await brandCache.get(input.brandId);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingIntegration =
                await ctx.db.query.brandUnicommerceIntegrations.findFirst({
                    where: eq(
                        brandUnicommerceIntegrations.brandId,
                        input.brandId
                    ),
                });

            const encryptedPassword = input.password
                ? encryptSecret(input.password)
                : existingIntegration?.encryptedPassword;

            if (!encryptedPassword) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Password is required for first-time Unicommerce setup",
                });
            }

            const credentialsChanged = Boolean(
                existingIntegration &&
                    (existingIntegration.tenant !== input.tenant ||
                        existingIntegration.facilityId !== input.facilityId ||
                        existingIntegration.username !== input.username ||
                        Boolean(input.password))
            );

            const [saved] = await ctx.db
                .insert(brandUnicommerceIntegrations)
                .values({
                    brandId: input.brandId,
                    tenant: input.tenant,
                    facilityId: input.facilityId,
                    baseUrl: null,
                    username: input.username,
                    encryptedPassword,
                    encryptedAccessToken: null,
                    encryptedRefreshToken: null,
                    accessTokenExpiresAt: null,
                    isActive: input.isActive,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: brandUnicommerceIntegrations.brandId,
                    set: {
                        tenant: input.tenant,
                        facilityId: input.facilityId,
                        baseUrl: null,
                        username: input.username,
                        encryptedPassword,
                        encryptedAccessToken: credentialsChanged
                            ? null
                            : existingIntegration?.encryptedAccessToken ?? null,
                        encryptedRefreshToken: credentialsChanged
                            ? null
                            : existingIntegration?.encryptedRefreshToken ?? null,
                        accessTokenExpiresAt: credentialsChanged
                            ? null
                            : existingIntegration?.accessTokenExpiresAt ?? null,
                        isActive: input.isActive,
                        updatedAt: new Date(),
                    },
                })
                .returning();

            return {
                ...saved,
                encryptedPassword: undefined,
                encryptedAccessToken: undefined,
                encryptedRefreshToken: undefined,
                hasCredentials: true,
            };
        }),
    authenticateUnicommerceIntegration: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const integration =
                await ctx.db.query.brandUnicommerceIntegrations.findFirst({
                    where: eq(
                        brandUnicommerceIntegrations.brandId,
                        input.brandId
                    ),
                });
            if (!integration)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Unicommerce integration not configured",
                });

            const client = new UnicommerceClient({
                tenant: integration.tenant,
                facilityId: integration.facilityId,
                baseUrl: integration.baseUrl,
                username: integration.username,
                password: decryptSecret(integration.encryptedPassword),
                initialAccessToken: integration.encryptedAccessToken
                    ? decryptSecret(integration.encryptedAccessToken)
                    : null,
                initialRefreshToken: integration.encryptedRefreshToken
                    ? decryptSecret(integration.encryptedRefreshToken)
                    : null,
                accessTokenExpiresAt: integration.accessTokenExpiresAt,
                onTokenUpdate: async (token) => {
                    await ctx.db
                        .update(brandUnicommerceIntegrations)
                        .set({
                            encryptedAccessToken: encryptSecret(
                                token.accessToken
                            ),
                            encryptedRefreshToken: encryptSecret(
                                token.refreshToken
                            ),
                            accessTokenExpiresAt: token.accessTokenExpiresAt,
                            updatedAt: new Date(),
                        })
                        .where(
                            eq(
                                brandUnicommerceIntegrations.id,
                                integration.id
                            )
                        );
                },
            });

            try {
                const authResult = await client.authenticate();
                const debugTrail = client.getDebugTrail();

                return {
                    success: true,
                    ...authResult,
                    debugTrail,
                };
            } catch (error: unknown) {
                return {
                    success: false,
                    authenticated: false,
                    errorMessage: resolveErrorMessage(
                        error,
                        "Failed to authenticate Unicommerce"
                    ),
                    debugTrail: client.getDebugTrail(),
                };
            }
        }),
    runUnicommerceApiRequest: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                method: z.enum(["GET", "POST"]).default("POST"),
                path: z.string().trim().min(1),
                query: z
                    .record(
                        z.string(),
                        z.union([
                            z.string(),
                            z.number(),
                            z.boolean(),
                            z.null(),
                        ])
                    )
                    .optional(),
                body: z.unknown().optional(),
                includeFacilityHeader: z.boolean().default(true),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const integration =
                await ctx.db.query.brandUnicommerceIntegrations.findFirst({
                    where: eq(
                        brandUnicommerceIntegrations.brandId,
                        input.brandId
                    ),
                });
            if (!integration)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Unicommerce integration not configured",
                });

            const client = new UnicommerceClient({
                tenant: integration.tenant,
                facilityId: integration.facilityId,
                baseUrl: integration.baseUrl,
                username: integration.username,
                password: decryptSecret(integration.encryptedPassword),
                initialAccessToken: integration.encryptedAccessToken
                    ? decryptSecret(integration.encryptedAccessToken)
                    : null,
                initialRefreshToken: integration.encryptedRefreshToken
                    ? decryptSecret(integration.encryptedRefreshToken)
                    : null,
                accessTokenExpiresAt: integration.accessTokenExpiresAt,
                onTokenUpdate: async (token) => {
                    await ctx.db
                        .update(brandUnicommerceIntegrations)
                        .set({
                            encryptedAccessToken: encryptSecret(
                                token.accessToken
                            ),
                            encryptedRefreshToken: encryptSecret(
                                token.refreshToken
                            ),
                            accessTokenExpiresAt: token.accessTokenExpiresAt,
                            updatedAt: new Date(),
                        })
                        .where(
                            eq(
                                brandUnicommerceIntegrations.id,
                                integration.id
                            )
                        );
                },
            });

            try {
                const response = await client.requestApi({
                    method: input.method,
                    path: input.path,
                    query: input.query,
                    body: input.body,
                    includeFacilityHeader: input.includeFacilityHeader,
                });

                return {
                    success: true,
                    status: response.status,
                    data: response.data,
                    debugTrail: client.getDebugTrail(),
                };
            } catch (error: unknown) {
                return {
                    success: false,
                    status: null,
                    data: null,
                    errorMessage: resolveErrorMessage(
                        error,
                        "Unicommerce API request failed"
                    ),
                    debugTrail: client.getDebugTrail(),
                };
            }
        }),
    testUnicommerceIntegration: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                updatedSinceMinutes: z.number().int().positive().default(60),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const integration =
                await ctx.db.query.brandUnicommerceIntegrations.findFirst({
                    where: eq(
                        brandUnicommerceIntegrations.brandId,
                        input.brandId
                    ),
                });
            if (!integration)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Unicommerce integration not configured",
                });

            const client = new UnicommerceClient({
                tenant: integration.tenant,
                facilityId: integration.facilityId,
                baseUrl: integration.baseUrl,
                username: integration.username,
                password: decryptSecret(integration.encryptedPassword),
                initialAccessToken: integration.encryptedAccessToken
                    ? decryptSecret(integration.encryptedAccessToken)
                    : null,
                initialRefreshToken: integration.encryptedRefreshToken
                    ? decryptSecret(integration.encryptedRefreshToken)
                    : null,
                accessTokenExpiresAt: integration.accessTokenExpiresAt,
                onTokenUpdate: async (token) => {
                    await ctx.db
                        .update(brandUnicommerceIntegrations)
                        .set({
                            encryptedAccessToken: encryptSecret(
                                token.accessToken
                            ),
                            encryptedRefreshToken: encryptSecret(
                                token.refreshToken
                            ),
                            accessTokenExpiresAt: token.accessTokenExpiresAt,
                            updatedAt: new Date(),
                        })
                        .where(
                            eq(
                                brandUnicommerceIntegrations.id,
                                integration.id
                            )
                        );
                },
            });

            try {
                const snapshots = await client.getInventorySnapshot({
                    updatedSinceMinutes: input.updatedSinceMinutes,
                    skus: [],
                });
                const debugTrail = client.getDebugTrail();
                console.log(
                    "[Unicommerce Test Debug]",
                    JSON.stringify(debugTrail, null, 2)
                );

                return {
                    success: true,
                    fetchedSnapshots: snapshots.length,
                    debugTrail,
                };
            } catch (error: unknown) {
                const debugTrail = client.getDebugTrail();
                console.log(
                    "[Unicommerce Test Debug Error]",
                    JSON.stringify(debugTrail, null, 2)
                );
                return {
                    success: false,
                    fetchedSnapshots: 0,
                    errorMessage: resolveErrorMessage(
                        error,
                        "Test connection failed"
                    ),
                    debugTrail,
                };
            }
        }),
    triggerUnicommerceSync: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                updatedSinceMinutes: z.number().int().positive().default(60),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input }) => {
            const result = await syncBrandUnicommerceInventory(input.brandId, {
                updatedSinceMinutes: input.updatedSinceMinutes,
                skus: [],
            });

            return result;
        }),
    getBrandWithConfidential: protectedProcedure
  .input(z.object({ brandId: z.string() }))
  .query(async ({ ctx, input }) => {
    return await ctx.db.query.brands.findFirst({
      where: eq(brands.id, input.brandId),
      with: {
        confidential: true,
      },
    });
  }),

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

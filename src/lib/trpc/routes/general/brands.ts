import { env } from "@/../env";
import { utApi } from "@/app/api/uploadthing/core";
import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import { brandCache, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import {
    BrandRequestStatusUpdate,
    BrandRequestSubmitted,
    BrandVerificationStatusUpdate,
} from "@/lib/resend/emails";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import {
    convertEmptyStringToNull,
    generateBrandRoleSlug,
    getUploadThingFileKey,
    hasPermission,
    slugify,
} from "@/lib/utils";
import {
    brandConfidentialSchema,
    brandRequestSchema,
    createBrandRequestSchema,
    linkBrandToRazorpaySchema,
    updateBrandConfidentialByAdminSchema,
    updateBrandRequestStatusSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const brandRequestsRouter = createTRPCRouter({
    getRequests: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
                status: brandRequestSchema.shape.status.optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_BRANDS |
                    BitFieldSitePermission.MANAGE_BRANDS,
                "any"
            )
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, search, status } = input;

            const data = await queries.brandRequests.getBrandRequests({
                limit,
                page,
                search,
                status,
            });

            return data;
        }),
    getRequestByOwnerId: protectedProcedure
        .input(
            z.object({
                ownerId: z.string(),
            })
        )
        .use(({ ctx, input, next }) => {
            const { user } = ctx;
            const { ownerId } = input;

            if (user.id !== ownerId)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to view this request",
                });

            return next({ ctx, input });
        })
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { ownerId } = input;

            const data = await queries.brandRequests.getBrandRequestByOwnerId(
                ownerId,
                "rejected",
                "ne"
            );
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand request not found",
                });

            return data;
        }),
    createRequest: protectedProcedure
        .input(createBrandRequestSchema)
        .use(async ({ ctx, next }) => {
            const { user, db, schemas, queries } = ctx;

            const existingBrandRequest =
                await queries.brandRequests.getBrandRequestByOwnerId(
                    user.id,
                    "rejected",
                    "ne"
                );
            if (existingBrandRequest)
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "You have already submitted a brand request, withdraw it if you want to submit a new one",
                });

            const existingBrandMember = await db.query.brandMembers.findFirst({
                where: eq(schemas.brandMembers.memberId, user.id),
            });
            if (existingBrandMember)
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "You are already a member of a brand, you cannot submit a brand request",
                });

            const existingRejectedRequest =
                await queries.brandRequests.getRecentRejectedRequest(user.id);
            if (existingRejectedRequest)
                throw new TRPCError({
                    code: "CONFLICT",
                    message:
                        "You have a recent rejected brand request, you cannot submit a new one",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { user, queries } = ctx;

            const newBrandRequest =
                await queries.brandRequests.createBrandRequest({
                    ...input,
                    ownerId: user.id,
                });

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: newBrandRequest.email,
                subject: `Submission Received - Thank You, ${newBrandRequest.name}!`,
                react: BrandRequestSubmitted({
                    user: {
                        name: newBrandRequest.name,
                    },
                    brand: newBrandRequest,
                }),
            });

            posthog.capture({
                distinctId: user.id,
                event: POSTHOG_EVENTS.BRAND.REQUEST.CREATED,
                properties: {
                    brandRequestId: newBrandRequest.id,
                    brandRequestName: newBrandRequest.name,
                    brandRequestEmail: newBrandRequest.email,
                },
            });

            return newBrandRequest;
        }),
    updateRequestStatus: protectedProcedure
        .input(
            z.object({
                id: z
                    .string({
                        required_error: "ID is required",
                        invalid_type_error: "ID must be a string",
                    })
                    .uuid("ID is invalid"),
                data: updateBrandRequestStatusSchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ ctx, input }) => {
            const { queries, db, schemas } = ctx;
            const { id, data } = input;

            const existingBrandRequest =
                await queries.brandRequests.getBrandRequest(
                    input.id,
                    "pending"
                );
            if (!existingBrandRequest)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand request not found",
                });

            if (existingBrandRequest.status === data.status)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Brand request is already in this status",
                });

            const existingDemoUrl = existingBrandRequest.demoUrl;
            if (existingDemoUrl) {
                const fileKey = getUploadThingFileKey(existingDemoUrl);
                await utApi.deleteFiles([fileKey]);
            }

            if (data.status === "approved") {
                const brandSlug = slugify(existingBrandRequest.name);
                const existingBrandWithSameSlug =
                    await queries.brands.getBrandBySlug(brandSlug);
                if (existingBrandWithSameSlug)
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "Brand with this name already exists",
                    });
            }

            const logoKey = getUploadThingFileKey(existingBrandRequest.logoUrl);

            const [, newBrand] = await Promise.all([
                queries.brandRequests.updateBrandRequestStatus(id, {
                    ...data,
                    demoUrl: null,
                    rejectedAt: data.status === "rejected" ? new Date() : null,
                }),
                data.status === "approved" &&
                    queries.brands.createBrand({
                        ...existingBrandRequest,
                        bio: null,
                        coverUrl: null,
                        slug: slugify(existingBrandRequest.name),
                    }),
                data.status === "rejected" && utApi.deleteFiles([logoKey]),
            ]);

            if (data.status === "rejected") {
                posthog.capture({
                    distinctId: existingBrandRequest.ownerId,
                    event: POSTHOG_EVENTS.BRAND.REQUEST.REJECTED,
                    properties: {
                        brandRequestId: existingBrandRequest.id,
                        brandRequestName: existingBrandRequest.name,
                        brandRequestEmail: existingBrandRequest.email,
                    },
                });

                await resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: existingBrandRequest.email,
                    subject: `Request Rejected - ${existingBrandRequest.name}`,
                    react: BrandRequestStatusUpdate({
                        user: {
                            name: existingBrandRequest.name,
                        },
                        brand: {
                            status: "rejected",
                            name: existingBrandRequest.name,
                            rejectionReason: data.rejectionReason ?? undefined,
                        },
                    }),
                });
            }

            if (newBrand) {
                const brandAdminRole = await queries.roles.createRole({
                    brandPermissions:
                        BitFieldBrandPermission.ADMINISTRATOR.toString(),
                    name: "Admin",
                    slug: generateBrandRoleSlug("Admin", newBrand.id),
                    position: 1,
                    sitePermissions: "0",
                    isSiteRole: false,
                });

                posthog.capture({
                    distinctId: newBrand.ownerId,
                    event: POSTHOG_EVENTS.BRAND.REQUEST.APPROVED,
                    properties: {
                        brandRequestId: newBrand.id,
                        brandRequestName: newBrand.name,
                        brandRequestEmail: newBrand.email,
                    },
                });

                posthog.capture({
                    distinctId: newBrand.ownerId,
                    event: POSTHOG_EVENTS.BRAND.CREATED,
                    properties: {
                        brandId: newBrand.id,
                        brandName: newBrand.name,
                    },
                });

                await Promise.all([
                    queries.brandMembers.createBrandMember({
                        brandId: newBrand.id,
                        memberId: newBrand.ownerId,
                        isOwner: true,
                    }),
                    db.insert(schemas.brandRoles).values({
                        brandId: newBrand.id,
                        roleId: brandAdminRole.id,
                    }),
                    db.insert(schemas.userRoles).values({
                        roleId: brandAdminRole.id,
                        userId: newBrand.ownerId,
                    }),
                    userCache.remove(newBrand.ownerId),
                ]);

                await resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: newBrand.email,
                    subject: `🎉 Exciting News, ${newBrand.name}! You're In! 🎉`,
                    react: BrandRequestStatusUpdate({
                        user: {
                            name: newBrand.name,
                        },
                        brand: {
                            id: newBrand.id,
                            name: newBrand.name,
                            status: "approved",
                        },
                    }),
                });
            }

            return true;
        }),
    deleteRequest: protectedProcedure
        .input(
            z.object({
                id: z
                    .string({
                        required_error: "ID is required",
                        invalid_type_error: "ID must be a string",
                    })
                    .uuid("ID is invalid"),
            })
        )
        .use(async ({ ctx, input, next }) => {
            const { user, db, schemas } = ctx;

            const existingBrandRequest = await db.query.brandRequests.findFirst(
                {
                    where: and(
                        eq(schemas.brandRequests.id, input.id),
                        eq(schemas.brandRequests.ownerId, user.id)
                    ),
                }
            );
            if (!existingBrandRequest)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand request not found",
                });

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BRANDS,
            ]);

            if (
                !isAuthorized &&
                (existingBrandRequest.ownerId !== user.id ||
                    existingBrandRequest.status !== "pending")
            )
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to delete this brand request",
                });

            return next({
                ctx: {
                    ...ctx,
                    existingBrandRequest,
                },
            });
        })
        .mutation(async ({ ctx, input }) => {
            const { existingBrandRequest, queries } = ctx;

            const existingDemoUrl = existingBrandRequest.demoUrl;
            if (existingDemoUrl) {
                const fileKey = getUploadThingFileKey(existingDemoUrl);
                await utApi.deleteFiles([fileKey]);
            }

            await queries.brandRequests.deleteBrandRequest(input.id);

            posthog.capture({
                distinctId: existingBrandRequest.ownerId,
                event: POSTHOG_EVENTS.BRAND.REQUEST.DELETED,
                properties: {
                    brandRequestId: existingBrandRequest.id,
                    brandRequestName: existingBrandRequest.name,
                    brandRequestEmail: existingBrandRequest.email,
                },
            });

            return true;
        }),
});

export const brandVerificationsRouter = createTRPCRouter({
    getVerifications: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
                status: brandRequestSchema.shape.status.optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_BRANDS |
                    BitFieldSitePermission.MANAGE_BRANDS,
                "any"
            )
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, search, status } = input;

            const data = await queries.brandConfidentials.getBrandConfidentials(
                {
                    limit,
                    page,
                    search,
                    status,
                }
            );

            return data;
        }),
    editDetails: protectedProcedure
        .input(
            z.object({
                id: brandConfidentialSchema.shape.id,
                values: updateBrandConfidentialByAdminSchema,
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, values } = input;

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (!existingBrandConfidential)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand verification not found",
                });

            if (existingBrandConfidential.verificationStatus === "approved")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Brand verification is already approved",
                });

            if (existingBrandConfidential.verificationStatus === "rejected")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Brand verification is already rejected",
                });

            const updatedBrandConfidential = await Promise.all([
                queries.brandConfidentials.updateBrandConfidentialByAdmin(
                    id,
                    values
                ),
                brandCache.remove(existingBrandConfidential.brand.id),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);

            return updatedBrandConfidential;
        }),
    approveVerification: protectedProcedure
        .input(linkBrandToRazorpaySchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (!existingBrandConfidential)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand verification not found",
                });

            const existingOwner = await userCache.get(
                existingBrandConfidential.brand.ownerId
            );
            if (!existingOwner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand owner not found",
                });

            if (existingBrandConfidential.verificationStatus === "approved")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Brand verification is already approved",
                });

            if (existingBrandConfidential.verificationStatus === "rejected")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Brand verification is already rejected",
                });

            await queries.brands.linkBrandToRazorpay(input);

            const updatedBrandConfidential = await Promise.all([
                queries.brandConfidentials.updateBrandConfidentialStatus(id, {
                    status: "approved",
                }),
                brandCache.remove(existingBrandConfidential.brand.id),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrandConfidential.brand.email,
                subject: `Verification Approved - ${existingBrandConfidential.brand.name}`,
                react: BrandVerificationStatusUpdate({
                    user: {
                        name: existingBrandConfidential.brand.name,
                    },
                    brand: {
                        id: existingBrandConfidential.brand.id,
                        name: existingBrandConfidential.brand.name,
                        status: "approved",
                    },
                }),
            });

            return updatedBrandConfidential;
        }),
    rejectVerification: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                rejectedReason: z.preprocess(
                    convertEmptyStringToNull,
                    z
                        .string({
                            invalid_type_error:
                                "Rejection reason must be a string",
                        })
                        .min(
                            1,
                            "Rejection reason must be at least 1 characters long"
                        )
                        .nullable()
                ),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, rejectedReason } = input;

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (!existingBrandConfidential)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand verification not found",
                });

            const existingOwner = await userCache.get(
                existingBrandConfidential.brand.ownerId
            );
            if (!existingOwner)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand owner not found",
                });

            if (existingBrandConfidential.verificationStatus === "rejected")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Brand verification is already rejected",
                });

            const updatedBrandConfidential = await Promise.all([
                queries.brandConfidentials.updateBrandConfidentialStatus(id, {
                    status: "rejected",
                    rejectedReason: rejectedReason ?? undefined,
                }),
                brandCache.remove(existingBrandConfidential.brand.id),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrandConfidential.brand.email,
                subject: `Verification Rejected - ${existingBrandConfidential.brand.name}`,
                react: BrandVerificationStatusUpdate({
                    user: {
                        name: existingBrandConfidential.brand.name,
                    },
                    brand: {
                        id: existingBrandConfidential.brand.id,
                        name: existingBrandConfidential.brand.name,
                        status: "rejected",
                        rejectionReason: rejectedReason ?? undefined,
                    },
                }),
            });

            return updatedBrandConfidential;
        }),
});

export const brandsRouter = createTRPCRouter({
    requests: brandRequestsRouter,
    verifications: brandVerificationsRouter,
    getBrands: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, search } = input;

            const data = await queries.brands.getBrands({
                limit,
                page,
                search,
            });

            return data;
        }),
    getBrand: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { id } = input;

            const data = await brandCache.get(id);
            if (!data)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            return data;
        }),
});

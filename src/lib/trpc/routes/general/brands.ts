import { env } from "@/../env";
import { utApi } from "@/app/api/uploadthing/core";
import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import {
    auditEntityChange,
    createOperationalAlert,
} from "@/lib/monitoring-sla/audit";
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
            await auditEntityChange({
                actorId: user.id,
                actionType: "brand_request_created",
                entityType: "brand_request",
                entityId: newBrandRequest.id,
                afterValue: {
                    name: newBrandRequest.name,
                    email: newBrandRequest.email,
                    status: newBrandRequest.status,
                },
                reason: "new_brand_onboarding_submitted",
            });
            await createOperationalAlert({
                actorId: user.id,
                type: "new_brand_onboarding_submitted",
                severity: "info",
                entityType: "brand_request",
                entityId: newBrandRequest.id,
                title: "New brand onboarding submitted",
                message: `${newBrandRequest.name} submitted a brand onboarding request.`,
                ownerRole: "brand_manager",
                channels: ["admin", "email"],
                dedupeKey: `brand:onboarding:${newBrandRequest.id}`,
            });

            await resend.batch.send([
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: newBrandRequest.email,
                    subject: `Submission Received - Thank You, ${newBrandRequest.name}!`,
                    react: BrandRequestSubmitted({
                        user: {
                            name: newBrandRequest.name,
                        },
                        brand: newBrandRequest,
                    }),
                },
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: env.RENIVET_EMAIL_1,
                    subject: `Submission Received - Thank You, ${newBrandRequest.name}!`,
                    react: BrandRequestSubmitted({
                        user: {
                            name: newBrandRequest.name,
                        },
                        brand: newBrandRequest,
                    }),
                },
                {
                    from: env.RESEND_EMAIL_FROM,
                    to: env.RENIVET_EMAIL_2,
                    subject: `Submission Received - Thank You, ${newBrandRequest.name}!`,
                    react: BrandRequestSubmitted({
                        user: {
                            name: newBrandRequest.name,
                        },
                        brand: newBrandRequest,
                    }),
                },
            ]);

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
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "brand_request_status_changed",
                entityType: "brand_request",
                entityId: id,
                beforeValue: { status: existingBrandRequest.status },
                afterValue: {
                    status: data.status,
                    rejectionReason: data.rejectionReason,
                    brandId: newBrand ? newBrand.id : null,
                },
                reason:
                    data.status === "approved"
                        ? "BRD_ACTIVATED"
                        : (data.rejectionReason ?? "BRD_OFFBOARDED_BREACH"),
            });

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
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "brand_request_deleted",
                entityType: "brand_request",
                entityId: input.id,
                beforeValue: {
                    status: existingBrandRequest.status,
                    name: existingBrandRequest.name,
                    email: existingBrandRequest.email,
                },
                reason: "brand_request_withdrawn_or_removed",
            });

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
    getBrandConfidential: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid("Invalid brand ID"),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const data =
                await queries.brandConfidentials.getBrandConfidential(id);

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

            // Admin can edit or initialize regardless of verification status or existence
            const updatedBrandConfidential = await Promise.all([
                queries.brandConfidentials.upsertBrandConfidentialByAdmin(
                    id,
                    values
                ),
                brandCache.remove(id),
            ]);

            return updatedBrandConfidential;
        }),
    approveVerification: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
            })
        )
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

            const updatedBrandConfidential = await Promise.all([
                queries.brandConfidentials.updateBrandConfidentialStatus(id, {
                    status: "approved",
                }),
                brandCache.remove(existingBrandConfidential.brand.id),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "brand_kyc_verified",
                entityType: "brand_confidential",
                entityId: id,
                beforeValue: {
                    verificationStatus:
                        existingBrandConfidential.verificationStatus,
                },
                afterValue: { verificationStatus: "approved" },
                reason: "BRD_ACTIVATED",
            });

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
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "brand_kyc_rejected",
                entityType: "brand_confidential",
                entityId: id,
                beforeValue: {
                    verificationStatus:
                        existingBrandConfidential.verificationStatus,
                },
                afterValue: {
                    verificationStatus: "rejected",
                    rejectedReason,
                },
                reason: rejectedReason ?? "BRD_PAUSED_QUALITY",
            });
            await createOperationalAlert({
                actorId: ctx.user.id,
                type: "brand_kyc_rejected",
                severity: "warning",
                entityType: "brand_confidential",
                entityId: id,
                title: "Brand verification rejected",
                message: `${existingBrandConfidential.brand.name} verification was rejected.`,
                ownerRole: "brand_manager",
                channels: ["admin", "email"],
                dedupeKey: `brand:kyc-rejected:${id}`,
            });

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
    updateBrandActiveStatus: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid("Invalid brand ID"),
                isActive: z.boolean(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id, isActive } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            await queries.brands.updateBrand(id, { isActive });
            await brandCache.remove(id);
            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "brand_status_changed",
                entityType: "brand",
                entityId: id,
                beforeValue: { isActive: existingBrand.isActive },
                afterValue: { isActive },
                reason: isActive ? "BRD_ACTIVATED" : "BRD_PAUSED_REQUEST",
            });
            await createOperationalAlert({
                actorId: ctx.user.id,
                type: "brand_status_changed",
                severity: isActive ? "info" : "warning",
                entityType: "brand",
                entityId: id,
                title: isActive ? "Brand activated" : "Brand paused",
                message: `${existingBrand.name} is now ${isActive ? "active" : "inactive"}.`,
                ownerRole: "brand_manager",
                channels: ["admin", "email"],
                dedupeKey: `brand:status:${id}:${isActive}`,
            });

            return { success: true, isActive };
        }),
    delistBrandProducts: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid("Invalid brand ID"),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const updatedProducts =
                await queries.products.updateBrandProductsActivationStatus(
                    id,
                    false
                );

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "brand_products_delisted",
                entityType: "brand",
                entityId: id,
                beforeValue: { brandName: existingBrand.name },
                afterValue: { delistedProductCount: updatedProducts.length },
                reason: "ADMIN_BULK_DELIST_PRODUCTS",
            });

            return { success: true, count: updatedProducts.length };
        }),
    relistBrandProducts: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid("Invalid brand ID"),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_BRANDS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const updatedProducts =
                await queries.products.updateBrandProductsActivationStatus(
                    id,
                    true
                );

            await auditEntityChange({
                actorId: ctx.user.id,
                actionType: "brand_products_relisted",
                entityType: "brand",
                entityId: id,
                beforeValue: { brandName: existingBrand.name },
                afterValue: { relistedProductCount: updatedProducts.length },
                reason: "ADMIN_BULK_RELIST_PRODUCTS",
            });

            return { success: true, count: updatedProducts.length };
        }),
});

import { utApi } from "@/app/api/uploadthing/core";
import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
import { brandCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import {
    generateBrandRoleSlug,
    getUploadThingFileKey,
    hasPermission,
    slugify,
} from "@/lib/utils";
import {
    brandRequestSchema,
    brandRequestWithoutConfidentialsSchema,
    createBrandRequestSchema,
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
                sendConfidentialData: z.boolean().default(false),
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
            const { ownerId, sendConfidentialData } = input;

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

            if (sendConfidentialData) return data;
            return brandRequestWithoutConfidentialsSchema.parse(data);
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
                        logoUrl: null,
                        slug: slugify(existingBrandRequest.name),
                    }),
            ]);

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

                await Promise.all([
                    db.insert(schemas.brandConfidentials).values({
                        ...existingBrandRequest,
                        id: newBrand.id,
                    }),
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
                ]);
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
            return true;
        }),
});

export const brandsRouter = createTRPCRouter({
    requests: brandRequestsRouter,
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

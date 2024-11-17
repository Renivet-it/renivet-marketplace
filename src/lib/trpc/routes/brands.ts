import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldSitePermission } from "@/config/permissions";
import { getUploadThingFileKey, hasPermission } from "@/lib/utils";
import {
    brandRequestSchema,
    brandRequestWithOwnerSchema,
    createBrandRequestSchema,
    updateBrandRequestStatusSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, ne } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.VIEW_BRANDS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { limit, page, search, status } = input;

            const brandsRequests = await db.query.brandRequests.findMany({
                with: {
                    owner: true,
                },
                where: and(
                    !!search?.length
                        ? ilike(schemas.brandRequests.name, `%${search}%`)
                        : undefined,
                    !!status
                        ? eq(schemas.brandRequests.status, status)
                        : undefined
                ),
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(schemas.brandRequests.createdAt)],
                extras: {
                    requestCount: db
                        .$count(
                            schemas.brandRequests,
                            and(
                                !!search?.length
                                    ? ilike(
                                          schemas.brandRequests.name,
                                          `%${search}%`
                                      )
                                    : undefined,
                                !!status
                                    ? eq(schemas.brandRequests.status, status)
                                    : undefined
                            )
                        )
                        .as("request_count"),
                },
            });

            const parsed = brandRequestWithOwnerSchema
                .extend({
                    requestCount: z.string().transform((val) => parseInt(val)),
                })
                .array()
                .parse(brandsRequests);

            return parsed;
        }),
    createRequest: protectedProcedure
        .input(createBrandRequestSchema)
        .use(async ({ ctx, next }) => {
            const { user, db, schemas } = ctx;

            const existingBrandRequest = await db.query.brandRequests.findFirst(
                {
                    where: and(
                        eq(schemas.brandRequests.ownerId, user.id),
                        ne(schemas.brandRequests.status, "rejected")
                    ),
                }
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

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { user, db, schemas } = ctx;

            const newBrandRequest = await db
                .insert(schemas.brandRequests)
                .values({
                    ...input,
                    ownerId: user.id,
                })
                .returning()
                .then((res) => res[0]);

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
        .use(async ({ ctx, input, next }) => {
            const { user, db, schemas } = ctx;

            const existingBrandRequest = await db.query.brandRequests.findFirst(
                {
                    where: and(
                        eq(schemas.brandRequests.id, input.id),
                        eq(schemas.brandRequests.status, "pending")
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
            if (!isAuthorized)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not allowed to update this brand request",
                });

            return next({
                ctx: {
                    ...ctx,
                    existingBrandRequest,
                },
            });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, existingBrandRequest } = ctx;
            const { id, data } = input;

            const existingDemoUrl = existingBrandRequest.demoUrl;
            if (existingDemoUrl) {
                const fileKey = getUploadThingFileKey(existingDemoUrl);
                await utApi.deleteFiles([fileKey]);
            }

            await db
                .update(schemas.brandRequests)
                .set({
                    ...data,
                    demoUrl: null,
                    rejectedAt: data.status === "rejected" ? new Date() : null,
                })
                .where(eq(schemas.brandRequests.id, id));

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
            const { db, schemas, existingBrandRequest } = ctx;

            const existingDemoUrl = existingBrandRequest.demoUrl;
            if (existingDemoUrl) {
                const fileKey = getUploadThingFileKey(existingDemoUrl);
                await utApi.deleteFiles([fileKey]);
            }

            await db
                .delete(schemas.brandRequests)
                .where(eq(schemas.brandRequests.id, input.id));

            return true;
        }),
});

export const brandsRouter = createTRPCRouter({
    requests: brandRequestsRouter,
});

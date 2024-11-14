import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey, hasPermission } from "@/lib/utils";
import {
    addBrandWaitlistDemoUrlSchema,
    createBrandWaitlistSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

export const brandsWaitlistRouter = createTRPCRouter({
    getBrandsWaitlist: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
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
            const { limit, page, search } = input;

            const brandsWaitlist = await db.query.brandsWaitlist.findMany({
                where: !!search?.length
                    ? ilike(schemas.brandsWaitlist.brandEmail, `%${search}%`)
                    : undefined,
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(schemas.brandsWaitlist.createdAt)],
                extras: {
                    waitlistCount: db
                        .$count(schemas.brandsWaitlist)
                        .as("waitlist_count"),
                },
            });

            return brandsWaitlist;
        }),
    getBrandsWaitlistEntry: protectedProcedure
        .input(
            z
                .object({
                    id: z.string().optional(),
                    brandEmail: z.string().optional(),
                })
                .refine((input) => {
                    if (!input.id && !input.brandEmail)
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "ID or brand email is required",
                        });

                    return true;
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
            const { id, brandEmail } = input;

            const brandsWaitlistEntry = await db.query.brandsWaitlist.findFirst(
                {
                    where: id
                        ? eq(schemas.brandsWaitlist.id, id)
                        : brandEmail
                          ? eq(schemas.brandsWaitlist.brandEmail, brandEmail)
                          : undefined,
                }
            );
            if (!brandsWaitlistEntry)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brands waitlist entry not found",
                });

            return brandsWaitlistEntry;
        }),
    createBrandsWaitlistEntry: publicProcedure
        .input(createBrandWaitlistSchema)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;

            const existingBrandsWaitlistEntry =
                await db.query.brandsWaitlist.findFirst({
                    where: eq(
                        schemas.brandsWaitlist.brandEmail,
                        input.brandEmail
                    ),
                });
            if (existingBrandsWaitlistEntry)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Brands waitlist entry already exists",
                });

            const brandsWaitlistEntry = await db
                .insert(schemas.brandsWaitlist)
                .values(input)
                .returning()
                .then((res) => res[0]);

            return brandsWaitlistEntry;
        }),
    addBrandsWaitlistDemo: publicProcedure
        .input(
            z.object({
                id: z.string(),
                data: addBrandWaitlistDemoUrlSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id, data } = input;

            const existingBrandsWaitlistEntry =
                await db.query.brandsWaitlist.findFirst({
                    where: eq(schemas.brandsWaitlist.id, id),
                });
            if (!existingBrandsWaitlistEntry)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brands waitlist entry not found",
                });

            const existingDemoUrl = existingBrandsWaitlistEntry.demoUrl;
            if (existingDemoUrl && existingDemoUrl !== data.demoUrl) {
                const existingKey = getUploadThingFileKey(existingDemoUrl);
                await utApi.deleteFiles([existingKey]);
            }

            await db
                .update(schemas.brandsWaitlist)
                .set({
                    demoUrl: data.demoUrl,
                })
                .where(eq(schemas.brandsWaitlist.id, id));

            return true;
        }),
    deleteBrandsWaitlistEntry: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_BRANDS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingBrandsWaitlistEntry =
                await db.query.brandsWaitlist.findFirst({
                    where: eq(schemas.brandsWaitlist.id, id),
                });
            if (!existingBrandsWaitlistEntry)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brands waitlist entry not found",
                });

            await db
                .delete(schemas.brandsWaitlist)
                .where(eq(schemas.brandsWaitlist.id, id));

            return true;
        }),
});

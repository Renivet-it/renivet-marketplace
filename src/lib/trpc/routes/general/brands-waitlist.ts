import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldSitePermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey, hasPermission } from "@/lib/utils";
import {
    addBrandWaitlistDemoUrlSchema,
    createBrandWaitlistSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
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
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_BRANDS))
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, search } = input;

            const brandsWaitlist = await queries.waitlists.getWaitlistBrands({
                limit,
                page,
                search,
            });

            return brandsWaitlist;
        }),
    getBrandsWaitlistEntry: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_BRANDS))
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;

            const brandsWaitlistEntry =
                await queries.waitlists.getWaitlistBrand(input.id);
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
            const { queries } = ctx;

            const existingBrandsWaitlistEntry =
                await queries.waitlists.getWaitlistBrandByEmail(
                    input.brandEmail
                );
            if (existingBrandsWaitlistEntry)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Brands waitlist entry already exists",
                });

            const brandsWaitlistEntry =
                await queries.waitlists.createWaitlistBrand(input);

            posthog.capture({
                event: POSTHOG_EVENTS.BRAND.WAITLIST.ADDED,
                distinctId: brandsWaitlistEntry.id,
                properties: {
                    brandName: brandsWaitlistEntry.brandName,
                    brandEmail: brandsWaitlistEntry.brandEmail,
                    brandPhone: brandsWaitlistEntry.brandPhone,
                    registrant: brandsWaitlistEntry.name,
                },
            });

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
            const { queries } = ctx;
            const { id, data } = input;

            const existingBrandsWaitlistEntry =
                await queries.waitlists.getWaitlistBrand(id);
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

            await queries.waitlists.addBrandWaitlistDemo(id, data);

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
            const { queries } = ctx;
            const { id } = input;

            const existingBrandsWaitlistEntry =
                await queries.waitlists.getWaitlistBrand(id);
            if (!existingBrandsWaitlistEntry)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brands waitlist entry not found",
                });

            if (existingBrandsWaitlistEntry.demoUrl) {
                const key = getUploadThingFileKey(
                    existingBrandsWaitlistEntry.demoUrl
                );
                await utApi.deleteFiles([key]);
            }

            await queries.waitlists.deleteWaitlistBrand(id);

            posthog.capture({
                event: POSTHOG_EVENTS.BRAND.WAITLIST.REMOVED,
                distinctId: id,
                properties: {
                    brandName: existingBrandsWaitlistEntry.brandName,
                    brandEmail: existingBrandsWaitlistEntry.brandEmail,
                    brandPhone: existingBrandsWaitlistEntry.brandPhone,
                    registrant: existingBrandsWaitlistEntry.name,
                },
            });

            return true;
        }),
});

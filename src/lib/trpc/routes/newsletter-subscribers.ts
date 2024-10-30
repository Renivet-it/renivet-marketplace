import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { hasPermission } from "@/lib/utils";
import { createNewsletterSubscriberSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const newsletterSubscriberRouter = createTRPCRouter({
    getNewsletterSubscribers: protectedProcedure
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.VIEW_SETTINGS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .query(async ({ ctx }) => {
            const { db } = ctx;

            const newsletterSubscribers =
                await db.query.newsletterSubscribers.findMany();
            return newsletterSubscribers;
        }),
    getNewsletterSubscriber: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.VIEW_SETTINGS,
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
            const { id } = input;

            const newsletterSubscriber =
                await db.query.newsletterSubscribers.findFirst({
                    where: eq(schemas.newsletterSubscribers.id, id),
                });
            if (!newsletterSubscriber)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Newsletter subscriber not found",
                });

            return newsletterSubscriber;
        }),
    createNewsletterSubscriber: publicProcedure
        .input(createNewsletterSubscriberSchema)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;

            const existingNewsletterSubscriber =
                await db.query.newsletterSubscribers.findFirst({
                    where: eq(schemas.newsletterSubscribers.email, input.email),
                });
            if (existingNewsletterSubscriber)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Newsletter subscriber already exists",
                });

            const newsletterSubscriber = await db
                .insert(schemas.newsletterSubscribers)
                .values(input)
                .returning()
                .then((res) => res[0]);

            return newsletterSubscriber;
        }),
    updateNewsletterSubscriber: publicProcedure
        .input(
            z.object({
                email: z.string(),
                isActive: z.boolean(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { email, isActive } = input;

            const existingNewsletterSubscriber =
                await db.query.newsletterSubscribers.findFirst({
                    where: eq(schemas.newsletterSubscribers.email, email),
                });
            if (!existingNewsletterSubscriber)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Newsletter subscriber not found",
                });

            const newsletterSubscriber = await db
                .update(schemas.newsletterSubscribers)
                .set({ isActive })
                .where(eq(schemas.newsletterSubscribers.email, email))
                .returning()
                .then((res) => res[0]);
            if (!newsletterSubscriber)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Newsletter subscriber not found",
                });

            return newsletterSubscriber;
        }),
    deleteNewsletterSubscriber: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_SETTINGS,
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

            const existingNewsletterSubscriber =
                await db.query.newsletterSubscribers.findFirst({
                    where: eq(schemas.newsletterSubscribers.id, id),
                });
            if (!existingNewsletterSubscriber)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Newsletter subscriber not found",
                });

            await db
                .delete(schemas.newsletterSubscribers)
                .where(eq(schemas.newsletterSubscribers.id, id))
                .execute();

            return true;
        }),
});

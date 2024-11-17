import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createNewsletterSubscriberSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const newsletterSubscriberRouter = createTRPCRouter({
    getNewsletterSubscribers: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                isActive: z.boolean().optional(),
                search: z.string().optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_SETTINGS |
                    BitFieldSitePermission.MANAGE_SETTINGS,
                "any"
            )
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, isActive, search } = input;

            const newsletterSubscribers =
                await queries.newsletterSubscribers.getSubscribers({
                    limit,
                    page,
                    isActive,
                    search,
                });

            return newsletterSubscribers;
        }),
    getNewsletterSubscriber: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_SETTINGS |
                    BitFieldSitePermission.MANAGE_SETTINGS,
                "any"
            )
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const newsletterSubscriber =
                await queries.newsletterSubscribers.getSubscriber(id);
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
            const { queries } = ctx;

            const existingNewsletterSubscriber =
                await queries.newsletterSubscribers.getSubscriberByEmail(
                    input.email
                );
            if (existingNewsletterSubscriber)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This email is already subscribed",
                });

            const newsletterSubscriber =
                await queries.newsletterSubscribers.createSubscriber(input);

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
            const { queries } = ctx;
            const { email, isActive } = input;

            const existingNewsletterSubscriber =
                await queries.newsletterSubscribers.getSubscriberByEmail(email);
            if (!existingNewsletterSubscriber)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Newsletter subscriber not found",
                });

            if (existingNewsletterSubscriber.isActive === isActive)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: isActive
                        ? "Subscribtion is already active"
                        : "Subscribtion is already inactive",
                });

            const newsletterSubscriber =
                await queries.newsletterSubscribers.updateSubscriber(
                    email,
                    isActive
                );

            return newsletterSubscriber;
        }),
    deleteNewsletterSubscriber: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingNewsletterSubscriber =
                await queries.newsletterSubscribers.getSubscriber(id);
            if (!existingNewsletterSubscriber)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Newsletter subscriber not found",
                });

            await queries.newsletterSubscribers.deleteSubscriber(id);
            return true;
        }),
});

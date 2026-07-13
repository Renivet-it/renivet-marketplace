import { BitFieldSitePermission } from "@/config/permissions";
import { createTRPCRouter, isTRPCAuth, protectedProcedure } from "@/lib/trpc/trpc";
import {
    createMarketingCampaignSchema,
    createMarketingPartnershipSchema,
    sendMarketingCampaignSchema,
    updateMarketingCampaignSchema,
    updateMarketingPartnershipSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sendDigestCampaign } from "@/lib/marketing/email";

export const marketingRouter = createTRPCRouter({
    getCampaigns: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
                type: z.string().optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_SETTINGS |
                    BitFieldSitePermission.MANAGE_SETTINGS,
                "any"
            )
        )
        .query(({ ctx, input }) => ctx.queries.marketing.getCampaigns(input)),
    createCampaign: protectedProcedure
        .input(createMarketingCampaignSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(({ ctx, input }) =>
            ctx.queries.marketing.createCampaign({
                ...input,
                createdBy: ctx.user.id,
            })
        ),
    updateCampaign: protectedProcedure
        .input(updateMarketingCampaignSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.queries.marketing.getCampaign(input.id);
            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Campaign not found",
                });
            }

            const { id, ...values } = input;
            return ctx.queries.marketing.updateCampaign(id, values);
        }),
    sendCampaign: protectedProcedure
        .input(sendMarketingCampaignSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.queries.marketing.getCampaign(input.id);
            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Campaign not found",
                });
            }

            return sendDigestCampaign(input.id);
        }),
    getPartnerships: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
                status: z.string().optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_SETTINGS |
                    BitFieldSitePermission.MANAGE_SETTINGS,
                "any"
            )
        )
        .query(({ ctx, input }) => ctx.queries.marketing.getPartnerships(input)),
    createPartnership: protectedProcedure
        .input(createMarketingPartnershipSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(({ ctx, input }) => ctx.queries.marketing.createPartnership(input)),
    updatePartnership: protectedProcedure
        .input(updateMarketingPartnershipSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.queries.marketing.getPartnership(input.id);
            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Partnership not found",
                });
            }

            const { id, ...values } = input;
            return ctx.queries.marketing.updatePartnership(id, values);
        }),
    deletePartnership: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const existing = await ctx.queries.marketing.getPartnership(input.id);
            if (!existing) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Partnership not found",
                });
            }

            await ctx.queries.marketing.deletePartnership(input.id);
            return true;
        }),
});

import { BitFieldBrandPermission } from "@/config/permissions";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { posthog } from "@/lib/posthog/client";
import { brandCache, userCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const bansRouter = createTRPCRouter({
    getBannedMembers: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
                limit: z.number().min(1).max(50).default(10),
                page: z.number().min(1).default(1),
                search: z.string().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { brandId, limit, page, search } = input;

            const data = await queries.bannedBrandMembers.getBannedMembers({
                brandId,
                limit,
                page,
                search,
            });

            return data;
        }),
    unbanMember: protectedProcedure
        .input(
            z.object({
                memberId: z.string(),
                brandId: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_TEAM, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { memberId, brandId } = input;

            const [existingBrand, existingBrandMember] = await Promise.all([
                brandCache.get(brandId),
                queries.bannedBrandMembers.getBannedMember(brandId, memberId),
            ]);

            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            if (!existingBrandMember)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Member not found",
                });

            await Promise.all([
                queries.bannedBrandMembers.deleteBannedBrandMember(
                    brandId,
                    memberId
                ),
                userCache.remove(memberId),
                brandCache.remove(brandId),
            ]);

            posthog.capture({
                event: POSTHOG_EVENTS.BRAND.MEMBER.BAN.REMOVED,
                distinctId: brandId,
                properties: {
                    memberId,
                },
            });

            return true;
        }),
});

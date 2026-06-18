import { BitFieldSitePermission } from "@/config/permissions";
import { swapRewardService } from "@/lib/services/swap-reward";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";

export const swapRewardsRouter = createTRPCRouter({
    getSwapRewardStatus: protectedProcedure.query(async ({ ctx }) => {
        return swapRewardService.getStatus(ctx.user.id);
    }),
    getEligibleRewardProducts: protectedProcedure
        .input(
            z
                .object({
                    search: z.string().optional(),
                })
                .optional()
        )
        .query(async ({ input }) => {
            return swapRewardService.listEligibleRewardProducts(input?.search);
        }),
    redeemSwapReward: protectedProcedure
        .input(
            z.object({
                productId: z.string().uuid(),
                variantId: z.string().uuid().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return swapRewardService.prepareRewardRedemption({
                userId: ctx.user.id,
                productId: input.productId,
                variantId: input.variantId,
            });
        }),
    getRewardCheckoutItem: protectedProcedure
        .input(
            z.object({
                redemptionId: z.string().uuid(),
            })
        )
        .query(async ({ ctx, input }) => {
            return swapRewardService.getRewardCheckoutSelection(
                ctx.user.id,
                input.redemptionId
            );
        }),
    getRewardAnalytics: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ANALYTICS))
        .query(async () => {
            return swapRewardService.getAnalytics();
        }),
});

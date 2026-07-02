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
                    page: z.number().int().min(1).optional(),
                    limit: z.number().int().min(1).max(24).optional(),
                    brandId: z.string().uuid().optional(),
                    categoryId: z.string().uuid().optional(),
                    sortBy: z
                        .enum([
                            "recommended",
                            "price_asc",
                            "price_desc",
                            "newest",
                        ])
                        .optional(),
                })
                .optional()
        )
        .query(async ({ input }) => {
            return swapRewardService.listEligibleRewardProducts(input);
        }),
    redeemSwapReward: protectedProcedure
        .input(
            z.object({
                productId: z.string().uuid(),
                variantId: z.string().uuid().optional(),
                mode: z.enum(["checkout", "cart"]).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return swapRewardService.prepareRewardRedemption({
                userId: ctx.user.id,
                productId: input.productId,
                variantId: input.variantId,
                mode: input.mode,
            });
        }),
    getActiveRewardCartItem: protectedProcedure.query(async ({ ctx }) => {
        return swapRewardService.getActiveRewardCartSelection(ctx.user.id);
    }),
    removeRewardCartItem: protectedProcedure
        .input(
            z.object({
                redemptionId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return swapRewardService.cancelRewardCartSelection(
                ctx.user.id,
                input.redemptionId
            );
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

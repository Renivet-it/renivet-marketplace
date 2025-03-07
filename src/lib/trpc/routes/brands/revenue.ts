import { BitFieldBrandPermission } from "@/config/permissions";
import { revenue } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";

export const revenueRouter = createTRPCRouter({
    getRevenue: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                nDays: z.number().int().positive(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.VIEW_ANALYTICS, "all", "brand"))
        .query(async ({ input }) => {
            const data = await revenue.retrieveByRange(input);
            return data;
        }),

    getStats: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                days: z.number().int().positive(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.VIEW_ANALYTICS, "all", "brand"))
        .query(async ({ input }) => {
            return revenue.getStats(input.brandId, input.days);
        }),
});

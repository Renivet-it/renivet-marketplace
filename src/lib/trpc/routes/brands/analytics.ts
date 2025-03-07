import { BitFieldBrandPermission } from "@/config/permissions";
import { analytics } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";

export const analyticsRouter = createTRPCRouter({
    getAnalytics: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                namespace: z.string(),
                nDays: z.number().int().positive(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.VIEW_ANALYTICS, "all", "brand"))
        .query(async ({ input }) => {
            const data = await analytics.retrieveByRange(input);
            return data;
        }),
});

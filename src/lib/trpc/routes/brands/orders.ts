import { BitFieldBrandPermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";

export const ordersRouter = createTRPCRouter({
    getOrdersByBrandId: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.orders.getOrdersByBrandId(input.brandId);
            return data;
        }),
});

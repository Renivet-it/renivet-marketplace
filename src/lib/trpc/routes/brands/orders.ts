import { BitFieldBrandPermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";
import { orderSchema } from "../../../../lib/validations";

export const ordersRouter = createTRPCRouter({
    getOrdersByBrandId: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
            })
        )
        .output(z.array(orderSchema)) // Defines output as array of orderSchema
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const data = await queries.orders.getOrdersByBrandId(input.brandId);
            return z.array(orderSchema).parse(data); // Parse data to match orderSchema
        }),
    getOrderShipmentDetailsByShipmentId: protectedProcedure
        .input(
            z.object({
                shipmentId: z.number(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;

            const data = await queries.orders.getShipmentDetailsByShipmentId(
                input.shipmentId
            );
            return data;
        }),
});

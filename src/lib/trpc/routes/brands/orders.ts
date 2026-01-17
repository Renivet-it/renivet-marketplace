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
                page: z.number().min(1).default(1),
                limit: z.number().min(1).default(10),
                shipmentStatus: z.string().optional(), // NEW optional filter
                isRto: z.boolean().nullable().optional(), // NEW optional filter
            })
        )
        .output(
            z.object({
                data: z.array(orderSchema), // ✅ Make sure this matches the returned array shape
                total: z.number(), // ✅ Total count of matching orders
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        //@ts-ignore
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { data, total } = await queries.orders.getOrdersByBrandId(
                input.brandId,
                input.page,
                input.limit,
                input.shipmentStatus,
                input.isRto
            );
            return { data, total };
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

    updateShipmentImage: protectedProcedure
        .input(
            z.object({
                orderId: z.string(),
                imageUrl: z.string().url(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { db } = ctx;
            const { orderShipments } = await import("@/lib/db/schema");
            const { eq } = await import("drizzle-orm");

            const result = await db
                .update(orderShipments)
                .set({
                    shipmentImageUrl: input.imageUrl,
                    updatedAt: new Date(),
                })
                .where(eq(orderShipments.orderId, input.orderId))
                .returning();

            return result[0];
        }),
});

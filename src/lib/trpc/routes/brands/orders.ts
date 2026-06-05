import { BitFieldBrandPermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";
import { orderSchema } from "../../../../lib/validations";

export const ordersRouter = createTRPCRouter({
    getOrders: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
                page: z.number().min(1).default(1),
                limit: z.number().min(1).default(10),
                search: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                statusTab: z
                    .enum([
                        "all",
                        "ready_to_pickup",
                        "pickup_scheduled",
                        "shipped",
                        "delivered",
                        "cancelled",
                        "rto",
                        "not_fulfilled",
                    ])
                    .optional(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .query(async ({ input, ctx }) => {
            const { brandId, ...filters } = input;
            return ctx.queries.orders.getOrders({
                ...filters,
                brandIds: [brandId],
            });
        }),
    getOrderStatusCounts: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
                search: z.string().optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            })
        )
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .query(async ({ input, ctx }) => {
            return ctx.queries.orders.getOrderStatusCounts({
                brandIds: [input.brandId],
                search: input.search,
                startDate: input.startDate,
                endDate: input.endDate,
            });
        }),
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
                input.isRto ?? undefined
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
});

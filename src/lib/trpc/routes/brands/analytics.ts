import { BitFieldBrandPermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    orderItems,
    orders,
    orderShipmentItems,
    orderShipments,
    products,
    productVariants,
} from "@/lib/db/schema";
import { analytics } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const analyticsRouter = createTRPCRouter({
    // ------------------------------------------------------
    // OLD REDIS ANALYTICS
    // ------------------------------------------------------
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
            return analytics.retrieveByRange(input);
        }),

    // ------------------------------------------------------
    // ⭐ NEW OVERVIEW ANALYTICS (BRAND → SHIPMENTS → ORDERS)
    // ------------------------------------------------------
    getOverview: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                nDays: z.number().int().positive(),
            })
        )
        .query(async ({ input }) => {
            const { brandId, nDays } = input;

            const since = new Date();
            since.setDate(since.getDate() - nDays);

            const sinceISO = since.toISOString(); // ⭐ FIX HERE

            // Total Orders
            const ordersCount = await db.execute(sql`
          SELECT COUNT(*)::int AS count
          FROM ${orderShipments} os
          JOIN ${orders} o ON os.order_id = o.id
          WHERE os.brand_id = ${brandId}
          AND o.created_at >= ${sinceISO}
      `);

            // Revenue from this brand's shipment items only.
            const revenue = await db.execute(sql`
          SELECT SUM(oi.quantity * COALESCE(pv.price, p.price, 0))::numeric AS sum
          FROM ${orderShipments} os
          JOIN ${orders} o ON os.order_id = o.id
          JOIN ${orderShipmentItems} osi ON osi.shipment_id = os.id
          JOIN ${orderItems} oi ON oi.id = osi.order_item_id
          JOIN ${products} p ON p.id = oi.product_id
          LEFT JOIN ${productVariants} pv ON pv.id = oi.variant_id
          WHERE os.brand_id = ${brandId}
          AND p.brand_id = ${brandId}
          AND o.created_at >= ${sinceISO}
      `);

            // Returns
            const returns = await db.execute(sql`
          SELECT COUNT(*)::int AS count
          FROM ${orderShipments} os
          JOIN ${orders} o ON os.order_id = o.id
          WHERE os.brand_id = ${brandId}
          AND o.status = 'RETURNED'
          AND o.created_at >= ${sinceISO}
      `);

            // Active Products
            const activeProducts = await db.execute(sql`
          SELECT COUNT(*)::int AS count
          FROM ${products}
          WHERE brand_id = ${brandId}
          AND is_active = true
          AND is_deleted = false
      `);

            const orderStatusCounts = await db.execute(sql`
          SELECT
              COUNT(*) FILTER (
                  WHERE o.status = 'pending'
                    AND os.status = 'pending'
                    AND COALESCE(os.is_pickup_scheduled, false) = false
              )::int AS new_orders,
              COUNT(*) FILTER (
                  WHERE COALESCE(os.is_pickup_scheduled, false) = true
                     OR os.status = 'pickup_scheduled'
              )::int AS pickup_scheduled,
              COUNT(*) FILTER (
                  WHERE os.status = 'in_transit'
              )::int AS in_transit,
              COUNT(*) FILTER (
                  WHERE o.status = 'delivered'
                     OR os.status = 'delivered'
              )::int AS delivered
          FROM ${orderShipments} os
          JOIN ${orders} o ON os.order_id = o.id
          WHERE os.brand_id = ${brandId}
          AND o.created_at >= ${sinceISO}
      `);

            return {
                totalOrders: Number(ordersCount[0]?.count ?? 0),
                totalRevenue: Number(revenue[0]?.sum ?? 0) / 100,
                returnRate: Number(returns[0]?.count ?? 0),
                activeProducts: Number(activeProducts[0]?.count ?? 0),
                newOrders: Number(orderStatusCounts[0]?.new_orders ?? 0),
                pickupScheduled: Number(
                    orderStatusCounts[0]?.pickup_scheduled ?? 0
                ),
                inTransit: Number(orderStatusCounts[0]?.in_transit ?? 0),
                delivered: Number(orderStatusCounts[0]?.delivered ?? 0),
            };
        }),

    // ------------------------------------------------------
    // ⭐ MONTHLY SALES (BRAND → SHIPMENTS → ORDERS)
    // ------------------------------------------------------
    getMonthlySales: protectedProcedure
        .input(z.object({ brandId: z.string().uuid() }))
        .query(async ({ input }) => {
            const rows = await db.execute(sql`
                SELECT 
                    DATE_TRUNC('month', o.created_at) AS month,
                    SUM(oi.quantity * COALESCE(pv.price, p.price, 0))::numeric AS paise,
                    COUNT(DISTINCT o.id)::int AS orders
                FROM ${orderShipments} os
                JOIN ${orders} o ON os.order_id = o.id
                JOIN ${orderShipmentItems} osi ON osi.shipment_id = os.id
                JOIN ${orderItems} oi ON oi.id = osi.order_item_id
                JOIN ${products} p ON p.id = oi.product_id
                LEFT JOIN ${productVariants} pv ON pv.id = oi.variant_id
                WHERE os.brand_id = ${input.brandId}
                AND p.brand_id = ${input.brandId}
                GROUP BY month
                ORDER BY month ASC
            `);

            return rows.map((r) => ({
                month: r.month,
                revenue: Number(r.paise) / 100, // 💰 to rupees
                orders: r.orders,
            }));
        }),

    // ------------------------------------------------------
    // ⭐ STATUS BREAKDOWN
    // ------------------------------------------------------
    getStatusBreakdown: protectedProcedure
        .input(z.object({ brandId: z.string().uuid() }))
        .query(async ({ input }) => {
            const result = await db.execute(sql`
                SELECT 
                    o.status AS status,
                    COUNT(*)::int AS count
                FROM ${orderShipments} os
                JOIN ${orders} o ON os.order_id = o.id
                WHERE os.brand_id = ${input.brandId}
                GROUP BY o.status
            `);

            return result; // FIXED
        }),

    // ------------------------------------------------------
    // ⭐ TOP PRODUCTS (BRAND → SHIPMENTS → ORDERS → ITEMS → PRODUCTS)
    // ------------------------------------------------------
    //     getTopProducts: protectedProcedure
    //         .input(z.object({
    //             brandId: z.string().uuid(),
    //             limit: z.number().default(5)
    //         }))
    //         .query(async ({ input }) => {

    //             const result = await db.execute(sql`
    //                 SELECT
    //                     p.title AS name,
    //                     SUM(o.total_amount)::numeric AS sales,
    //                     COUNT(*)::int AS orders
    //                 FROM ${orderShipments} os
    //                 JOIN ${orders} o ON os.order_id = o.id
    //                 JOIN ${orderItems} oi ON oi.order_id = o.id
    //                 JOIN ${products} p ON oi.product_id = p.id
    //                 WHERE os.brand_id = ${input.brandId}
    //                 GROUP BY p.title
    //                 ORDER BY sales DESC
    //                 LIMIT ${input.limit}
    //             `);

    //             return result; // FIXED
    //         }),
    // });
    // ⭐ TOP PRODUCTS (USING o.total_amount if 1 order = 1 product)
    getTopProducts: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                limit: z.number().default(5),
            })
        )
        .query(async ({ input }) => {
            const rows = await db.execute(sql`
                SELECT 
                    p.title AS name,
                    SUM(oi.quantity * COALESCE(pv.price, p.price, 0))::numeric AS paise,
                    COUNT(DISTINCT o.id)::int AS orders
                FROM ${orderShipments} os
                JOIN ${orders} o ON os.order_id = o.id
                JOIN ${orderShipmentItems} osi ON osi.shipment_id = os.id
                JOIN ${orderItems} oi ON oi.id = osi.order_item_id
                JOIN ${products} p ON oi.product_id = p.id
                LEFT JOIN ${productVariants} pv ON pv.id = oi.variant_id
                WHERE os.brand_id = ${input.brandId}
                AND p.brand_id = ${input.brandId}
                GROUP BY p.title
                ORDER BY paise DESC
                LIMIT ${input.limit}
            `);

            return rows.map((r) => ({
                name: r.name,
                sales: Number(r.paise) / 100, // 💰 convert to rupees
                orders: r.orders,
            }));
        }),
});

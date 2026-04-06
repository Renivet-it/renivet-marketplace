import { db } from "@/lib/db";
import {
    analyticsDailyBehavior,
    analyticsDailyCommerce,
    analyticsLandingPageDaily,
    brands,
    categories,
    orderItems,
    orderShipments,
    orders,
    productVariants,
    products,
    refunds,
} from "@/lib/db/schema";
import {
    getPostHogDailyBehavior,
    getPostHogLandingPageDaily,
    isPostHogBehaviorConfigured,
} from "@/lib/reports/posthog-behavior";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";

export const ANALYTICS_DATE_PRESETS = [
    "7d",
    "30d",
    "90d",
    "ytd",
    "custom",
] as const;

export const ANALYTICS_COMPARISONS = [
    "none",
    "previous_period",
    "previous_year",
] as const;

export const FREEFORM_DIMENSIONS = [
    "product_title",
    "product_vendor",
    "product_type",
    "order_status",
    "order_date",
] as const;

export const FREEFORM_METRICS = [
    "gross_sales",
    "discounts",
    "returns",
    "net_sales",
    "taxes",
    "shipping",
    "total_sales",
    "orders",
    "units_sold",
] as const;

const TAX_RATE = 0.18;

export type AnalyticsDatePreset = (typeof ANALYTICS_DATE_PRESETS)[number];
export type AnalyticsComparison = (typeof ANALYTICS_COMPARISONS)[number];
export type FreeformDimension = (typeof FREEFORM_DIMENSIONS)[number];
export type FreeformMetric = (typeof FREEFORM_METRICS)[number];

export interface AnalyticsDateInput {
    datePreset: AnalyticsDatePreset;
    comparison: AnalyticsComparison;
    startDate?: string;
    endDate?: string;
}

export interface AnalyticsDateWindow {
    current: {
        start: Date;
        end: Date;
    };
    previous: {
        start: Date;
        end: Date;
    } | null;
}

export interface AdminOverviewMetrics {
    grossSales: number;
    totalSales: number;
    netSales: number;
    orders: number;
    ordersFulfilled: number;
    returningCustomerRate: number;
    newCustomers: number;
    returningCustomers: number;
    comparison: {
        grossSales: number;
        totalSales: number;
        netSales: number;
        orders: number;
        ordersFulfilled: number;
        returningCustomerRate: number;
    };
}

export interface SalesTrendPoint {
    date: string;
    totalSales: number;
    netSales: number;
    grossSales: number;
    orders: number;
}

export interface SalesBreakdown {
    grossSales: number;
    discounts: number;
    returns: number;
    netSales: number;
    shipping: number;
    taxes: number;
    totalSales: number;
    comparison: {
        grossSales: number;
        discounts: number;
        returns: number;
        netSales: number;
        shipping: number;
        taxes: number;
        totalSales: number;
    };
}

export interface AnalyticsReportLibraryItem {
    id: string;
    name: string;
    category: "Sales" | "Behavior" | "Acquisition";
    createdBy: string;
    createdById?: string;
    lastViewed: string;
    dimensions: FreeformDimension[];
    metrics: FreeformMetric[];
    visualizationType?: "line" | "area" | "bar" | "horizontal_bar" | "pie" | "table";
    filtersJson?: Record<string, unknown>;
    isSystemReport?: boolean;
}

export interface FreeformQueryInput extends AnalyticsDateInput {
    metrics: FreeformMetric[];
    dimension: FreeformDimension;
    limit?: number;
    offset?: number;
    sortBy?: FreeformMetric | "dimension";
    sortDirection?: "asc" | "desc";
}

export interface FreeformResultRow {
    dimension: string;
    metrics: Record<FreeformMetric, number>;
}

export interface FreeformResult {
    rows: FreeformResultRow[];
    totalRows: number;
    dimension: FreeformDimension;
    metrics: FreeformMetric[];
}

interface WindowAggregates {
    grossSalesPaise: number;
    discountsPaise: number;
    returnsPaise: number;
    taxesPaise: number;
    shippingPaise: number;
    totalSalesPaise: number;
    netSalesPaise: number;
    orders: number;
    ordersFulfilled: number;
    returningCustomerRate: number;
    newCustomers: number;
    returningCustomers: number;
}

function toDateOnlyKey(value: Date) {
    return value.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function endOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
}

function addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function subtractYears(date: Date, years: number) {
    const copy = new Date(date);
    copy.setFullYear(copy.getFullYear() - years);
    return copy;
}

function paiseToRupees(value: number) {
    return Number((value / 100).toFixed(2));
}

function percentDelta(current: number, previous: number) {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }

    return Number((((current - previous) / previous) * 100).toFixed(2));
}

function toNum(value: unknown) {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
}

function toSqlDateTime(value: Date) {
    return value.toISOString().replace("T", " ").slice(0, 19);
}

function computeTaxesFromGrossPaise(grossSalesPaise: number) {
    return Math.round(Math.max(grossSalesPaise, 0) * TAX_RATE);
}

function computeNetFromGrossPaise(grossSalesPaise: number) {
    const taxesPaise = computeTaxesFromGrossPaise(grossSalesPaise);
    return Math.max(grossSalesPaise - taxesPaise, 0);
}

export function resolveDateWindow(input: AnalyticsDateInput): AnalyticsDateWindow {
    const now = new Date();
    const end = input.datePreset === "custom" && input.endDate
        ? endOfDay(new Date(input.endDate))
        : endOfDay(now);

    let start: Date;

    if (input.datePreset === "custom" && input.startDate) {
        start = startOfDay(new Date(input.startDate));
    } else if (input.datePreset === "7d") {
        start = startOfDay(addDays(end, -6));
    } else if (input.datePreset === "30d") {
        start = startOfDay(addDays(end, -29));
    } else if (input.datePreset === "90d") {
        start = startOfDay(addDays(end, -89));
    } else if (input.datePreset === "ytd") {
        start = startOfDay(new Date(end.getFullYear(), 0, 1));
    } else {
        start = startOfDay(addDays(end, -29));
    }

    if (input.comparison === "none") {
        return {
            current: { start, end },
            previous: null,
        };
    }

    if (input.comparison === "previous_year") {
        return {
            current: { start, end },
            previous: {
                start: subtractYears(start, 1),
                end: subtractYears(end, 1),
            },
        };
    }

    const durationMs = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - durationMs);

    return {
        current: { start, end },
        previous: {
            start: startOfDay(previousStart),
            end: endOfDay(previousEnd),
        },
    };
}

async function getWindowAggregates(start: Date, end: Date): Promise<WindowAggregates> {
    const startSql = toSqlDateTime(start);
    const endSql = toSqlDateTime(end);

    const validOrdersWhere = and(
        sql`${orders.createdAt} >= ${startSql}`,
        sql`${orders.createdAt} <= ${endSql}`,
        ne(orders.status, "cancelled"),
        ne(orders.paymentStatus, "failed")
    );

    const [orderTotals] = await db
        .select({
            orders: sql<number>`COUNT(*)`,
            totalSalesPaise: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
            discountsPaise: sql<number>`COALESCE(SUM(${orders.discountAmount}), 0)`,
            taxesPaise: sql<number>`COALESCE(SUM(${orders.taxAmount}), 0)`,
            shippingPaise: sql<number>`COALESCE(SUM(${orders.deliveryAmount}), 0)`,
        })
        .from(orders)
        .where(validOrdersWhere);

    const [grossTotals] = await db
        .select({
            grossSalesPaise: sql<number>`COALESCE(SUM(${orderItems.quantity} * COALESCE(${productVariants.price}, ${products.price}, 0)), 0)`,
        })
        .from(orderItems)
        .innerJoin(orders, sql`${orderItems.orderId} = ${orders.id}`)
        .innerJoin(products, sql`${orderItems.productId} = ${products.id}`)
        .leftJoin(productVariants, sql`${orderItems.variantId} = ${productVariants.id}`)
        .where(validOrdersWhere);

    const [returnsTotals] = await db
        .select({
            returnsPaise: sql<number>`COALESCE(SUM(${refunds.amount}), 0)`,
        })
        .from(refunds)
        .where(
            and(
                eq(refunds.status, "processed"),
                sql`${refunds.createdAt} >= ${startSql}`,
                sql`${refunds.createdAt} <= ${endSql}`
            )
        );

    const fulfilledRows = await db.execute(sql`
        SELECT COUNT(*)::int AS fulfilled
        FROM ${orderShipments} os
        INNER JOIN ${orders} o ON os.order_id = o.id
        WHERE os.status = 'delivered'
          AND o.status <> 'cancelled'
          AND o.payment_status <> 'failed'
          AND o.created_at >= ${startSql}
          AND o.created_at <= ${endSql}
    `);

    const customerRows = await db.execute(sql`
        WITH first_orders AS (
            SELECT user_id, MIN(created_at) AS first_order_at
            FROM ${orders}
            WHERE status <> 'cancelled'
              AND payment_status <> 'failed'
            GROUP BY user_id
        ),
        period_customers AS (
            SELECT DISTINCT user_id
            FROM ${orders}
            WHERE status <> 'cancelled'
              AND payment_status <> 'failed'
              AND created_at >= ${startSql}
              AND created_at <= ${endSql}
        )
        SELECT
            COUNT(*)::int AS total_customers,
            SUM(CASE WHEN fo.first_order_at < ${startSql} THEN 1 ELSE 0 END)::int AS returning_customers,
            SUM(CASE WHEN fo.first_order_at >= ${startSql} AND fo.first_order_at <= ${endSql} THEN 1 ELSE 0 END)::int AS new_customers
        FROM period_customers pc
        INNER JOIN first_orders fo ON fo.user_id = pc.user_id
    `);

    const grossSalesPaise = toNum(grossTotals?.grossSalesPaise);
    const totalSalesPaise = toNum(orderTotals?.totalSalesPaise);
    const returnsPaise = toNum(returnsTotals?.returnsPaise);

    const taxesPaise = computeTaxesFromGrossPaise(grossSalesPaise);
    const netSalesPaise = computeNetFromGrossPaise(grossSalesPaise);

    const totalCustomers = toNum(customerRows[0]?.total_customers);
    const returningCustomers = toNum(customerRows[0]?.returning_customers);
    const newCustomers = toNum(customerRows[0]?.new_customers);

    return {
        grossSalesPaise,
        discountsPaise: toNum(orderTotals?.discountsPaise),
        returnsPaise,
        taxesPaise,
        shippingPaise: toNum(orderTotals?.shippingPaise),
        totalSalesPaise,
        netSalesPaise,
        orders: toNum(orderTotals?.orders),
        ordersFulfilled: toNum(fulfilledRows[0]?.fulfilled),
        returningCustomerRate:
            totalCustomers > 0
                ? Number(((returningCustomers / totalCustomers) * 100).toFixed(2))
                : 0,
        newCustomers,
        returningCustomers,
    };
}

function emptyWindowAggregates(): WindowAggregates {
    return {
        grossSalesPaise: 0,
        discountsPaise: 0,
        returnsPaise: 0,
        taxesPaise: 0,
        shippingPaise: 0,
        totalSalesPaise: 0,
        netSalesPaise: 0,
        orders: 0,
        ordersFulfilled: 0,
        returningCustomerRate: 0,
        newCustomers: 0,
        returningCustomers: 0,
    };
}

export async function getAdminOverviewMetrics(input: AnalyticsDateInput): Promise<AdminOverviewMetrics> {
    const window = resolveDateWindow(input);

    const current = await getWindowAggregates(window.current.start, window.current.end);
    const previous = window.previous
        ? await getWindowAggregates(window.previous.start, window.previous.end)
        : emptyWindowAggregates();

    return {
        grossSales: paiseToRupees(current.grossSalesPaise),
        totalSales: paiseToRupees(current.totalSalesPaise),
        netSales: paiseToRupees(current.netSalesPaise),
        orders: current.orders,
        ordersFulfilled: current.ordersFulfilled,
        returningCustomerRate: current.returningCustomerRate,
        newCustomers: current.newCustomers,
        returningCustomers: current.returningCustomers,
        comparison: {
            grossSales: percentDelta(current.grossSalesPaise, previous.grossSalesPaise),
            totalSales: percentDelta(current.totalSalesPaise, previous.totalSalesPaise),
            netSales: percentDelta(current.netSalesPaise, previous.netSalesPaise),
            orders: percentDelta(current.orders, previous.orders),
            ordersFulfilled: percentDelta(current.ordersFulfilled, previous.ordersFulfilled),
            returningCustomerRate: percentDelta(current.returningCustomerRate, previous.returningCustomerRate),
        },
    };
}

export async function getAdminSalesBreakdown(input: AnalyticsDateInput): Promise<SalesBreakdown> {
    const window = resolveDateWindow(input);

    const current = await getWindowAggregates(window.current.start, window.current.end);
    const previous = window.previous
        ? await getWindowAggregates(window.previous.start, window.previous.end)
        : emptyWindowAggregates();

    return {
        grossSales: paiseToRupees(current.grossSalesPaise),
        discounts: paiseToRupees(current.discountsPaise),
        returns: paiseToRupees(current.returnsPaise),
        netSales: paiseToRupees(current.netSalesPaise),
        shipping: paiseToRupees(current.shippingPaise),
        taxes: paiseToRupees(current.taxesPaise),
        totalSales: paiseToRupees(current.totalSalesPaise),
        comparison: {
            grossSales: percentDelta(current.grossSalesPaise, previous.grossSalesPaise),
            discounts: percentDelta(current.discountsPaise, previous.discountsPaise),
            returns: percentDelta(current.returnsPaise, previous.returnsPaise),
            netSales: percentDelta(current.netSalesPaise, previous.netSalesPaise),
            shipping: percentDelta(current.shippingPaise, previous.shippingPaise),
            taxes: percentDelta(current.taxesPaise, previous.taxesPaise),
            totalSales: percentDelta(current.totalSalesPaise, previous.totalSalesPaise),
        },
    };
}

async function getSalesSeriesWindow(start: Date, end: Date): Promise<Map<string, SalesTrendPoint>> {
    const startSql = toSqlDateTime(start);
    const endSql = toSqlDateTime(end);

    const rows = await db.execute(sql`
        WITH order_daily AS (
            SELECT
                DATE(o.created_at) AS date,
                COALESCE(SUM(o.total_amount), 0)::numeric AS total_sales,
                COUNT(*)::int AS orders
            FROM ${orders} o
            WHERE o.status <> 'cancelled'
              AND o.payment_status <> 'failed'
              AND o.created_at >= ${startSql}
              AND o.created_at <= ${endSql}
            GROUP BY DATE(o.created_at)
        ),
        gross_daily AS (
            SELECT
                DATE(o.created_at) AS date,
                COALESCE(SUM(oi.quantity * COALESCE(v.price, p.price, 0)), 0)::numeric AS gross_sales
            FROM ${orders} o
            INNER JOIN ${orderItems} oi ON oi.order_id = o.id
            INNER JOIN ${products} p ON oi.product_id = p.id
            LEFT JOIN ${productVariants} v ON oi.variant_id = v.id
            WHERE o.status <> 'cancelled'
              AND o.payment_status <> 'failed'
              AND o.created_at >= ${startSql}
              AND o.created_at <= ${endSql}
            GROUP BY DATE(o.created_at)
        ),
        refunds_daily AS (
            SELECT
                DATE(r.created_at) AS date,
                COALESCE(SUM(r.amount), 0)::numeric AS returns
            FROM ${refunds} r
            WHERE r.status = 'processed'
              AND r.created_at >= ${startSql}
              AND r.created_at <= ${endSql}
            GROUP BY DATE(r.created_at)
        )
        SELECT
            od.date,
            od.total_sales,
            (od.total_sales - COALESCE(rd.returns, 0))::numeric AS net_sales,
            COALESCE(gd.gross_sales, 0)::numeric AS gross_sales,
            od.orders
        FROM order_daily od
        LEFT JOIN gross_daily gd ON gd.date = od.date
        LEFT JOIN refunds_daily rd ON rd.date = od.date
        ORDER BY od.date
    `);

    const map = new Map<string, SalesTrendPoint>();

    for (const row of rows) {
        const date = new Date(row.date as string | Date);
        const key = toDateOnlyKey(date);
        const grossSalesPaise = toNum(row.gross_sales);
        map.set(key, {
            date: key,
            totalSales: paiseToRupees(toNum(row.total_sales)),
            netSales: paiseToRupees(computeNetFromGrossPaise(grossSalesPaise)),
            grossSales: paiseToRupees(grossSalesPaise),
            orders: toNum(row.orders),
        });
    }

    return map;
}
function fillSeries(start: Date, end: Date, dataMap: Map<string, SalesTrendPoint>) {
    const points: SalesTrendPoint[] = [];
    let cursor = startOfDay(start);
    const until = endOfDay(end);

    while (cursor <= until) {
        const key = toDateOnlyKey(cursor);
        points.push(
            dataMap.get(key) ?? {
                date: key,
                totalSales: 0,
                netSales: 0,
                grossSales: 0,
                orders: 0,
            }
        );

        cursor = addDays(cursor, 1);
    }

    return points;
}

export async function getAdminSalesTimeSeries(input: AnalyticsDateInput) {
    const window = resolveDateWindow(input);

    const currentMap = await getSalesSeriesWindow(window.current.start, window.current.end);
    const current = fillSeries(window.current.start, window.current.end, currentMap);

    if (!window.previous) {
        return {
            current,
            previous: [] as SalesTrendPoint[],
        };
    }

    const previousMap = await getSalesSeriesWindow(window.previous.start, window.previous.end);
    const previous = fillSeries(window.previous.start, window.previous.end, previousMap);

    return {
        current,
        previous,
    };
}

export function getAdminReportLibrary(): AnalyticsReportLibraryItem[] {
    return [
        {
            id: "sales_by_product",
            name: "Total sales by product",
            category: "Sales",
            createdBy: "System",
            lastViewed: "2026-04-07",
            dimensions: ["product_title", "product_vendor"],
            metrics: ["gross_sales", "taxes", "net_sales", "total_sales", "orders"],
            isSystemReport: true,
        },
        {
            id: "sessions_by_landing_page",
            name: "Sessions by landing page",
            category: "Behavior",
            createdBy: "System",
            lastViewed: "2026-04-07",
            dimensions: ["order_date"],
            metrics: ["orders"],
            isSystemReport: true,
        },
        {
            id: "sessions_by_location",
            name: "Sessions by location",
            category: "Acquisition",
            createdBy: "System",
            lastViewed: "2026-04-07",
            dimensions: ["order_date"],
            metrics: ["orders"],
            isSystemReport: true,
        },
        {
            id: "bounce_rate_over_time",
            name: "Bounce rate over time",
            category: "Behavior",
            createdBy: "System",
            lastViewed: "2026-04-07",
            dimensions: ["order_date"],
            metrics: ["orders"],
            isSystemReport: true,
        },
        {
            id: "checkout_conversion_over_time",
            name: "Checkout conversion rate over time",
            category: "Behavior",
            createdBy: "System",
            lastViewed: "2026-04-07",
            dimensions: ["order_date"],
            metrics: ["orders"],
            isSystemReport: true,
        },
    ];
}
function getFreeformDimensionSql(dimension: FreeformDimension) {
    if (dimension === "product_title") {
        return sql`COALESCE(li.product_title, 'Unknown product')`;
    }

    if (dimension === "product_vendor") {
        return sql`COALESCE(li.product_vendor, 'Unknown vendor')`;
    }

    if (dimension === "product_type") {
        return sql`COALESCE(li.product_type, 'Unknown type')`;
    }

    if (dimension === "order_status") {
        return sql`COALESCE(li.order_status, 'unknown')`;
    }

    return sql`TO_CHAR(li.order_date, 'YYYY-MM-DD')`;
}

function getSortColumn(sortBy: FreeformMetric | "dimension") {
    if (sortBy === "dimension") return "dimension";
    return sortBy;
}

export async function runAdminFreeformReport(input: FreeformQueryInput): Promise<FreeformResult> {
    const window = resolveDateWindow(input);

    const metrics = input.metrics.length
        ? input.metrics
        : (["total_sales"] as FreeformMetric[]);

    const limit = Math.min(Math.max(input.limit ?? 20, 1), 200);
    const offset = Math.max(input.offset ?? 0, 0);
    const sortBy = getSortColumn(input.sortBy ?? metrics[0] ?? "dimension");
    const sortDirection = input.sortDirection === "asc" ? "ASC" : "DESC";

    const dimensionSql = getFreeformDimensionSql(input.dimension);
    const metricsSelect = sql`
        ROUND(COALESCE(SUM(li.line_gross), 0) / 100.0, 2) AS gross_sales,
        ROUND(COALESCE(SUM(li.alloc_discount), 0) / 100.0, 2) AS discounts,
        ROUND(COALESCE(SUM(li.alloc_returns), 0) / 100.0, 2) AS returns,
        ROUND((COALESCE(SUM(li.line_gross), 0) - (COALESCE(SUM(li.line_gross), 0) * ${TAX_RATE})) / 100.0, 2) AS net_sales,
        ROUND((COALESCE(SUM(li.line_gross), 0) * ${TAX_RATE}) / 100.0, 2) AS taxes,
        ROUND(COALESCE(SUM(li.alloc_shipping), 0) / 100.0, 2) AS shipping,
        ROUND(COALESCE(SUM(li.alloc_total), 0) / 100.0, 2) AS total_sales,
        COUNT(DISTINCT li.order_id)::int AS orders,
        COALESCE(SUM(li.quantity), 0)::int AS units_sold
    `;

    const startSql = toSqlDateTime(window.current.start);
    const endSql = toSqlDateTime(window.current.end);

    const rows = await db.execute(sql`
        WITH line_items AS (
            SELECT
                oi.order_id,
                o.status AS order_status,
                DATE(o.created_at) AS order_date,
                oi.quantity,
                p.title AS product_title,
                b.name AS product_vendor,
                c.name AS product_type,
                (oi.quantity * COALESCE(v.price, p.price, 0))::numeric AS line_gross,
                o.total_amount::numeric AS order_total,
                o.discount_amount::numeric AS order_discount,
                o.tax_amount::numeric AS order_tax,
                o.delivery_amount::numeric AS order_shipping
            FROM ${orderItems} oi
            INNER JOIN ${orders} o ON oi.order_id = o.id
            INNER JOIN ${products} p ON oi.product_id = p.id
            LEFT JOIN ${brands} b ON p.brand_id = b.id
            LEFT JOIN ${categories} c ON p.category_id = c.id
            LEFT JOIN ${productVariants} v ON oi.variant_id = v.id
            WHERE o.status <> 'cancelled'
              AND o.payment_status <> 'failed'
              AND o.created_at >= ${startSql}
              AND o.created_at <= ${endSql}
        ),
        order_gross AS (
            SELECT order_id, SUM(line_gross) AS order_gross
            FROM line_items
            GROUP BY order_id
        ),
        refund_by_order AS (
            SELECT r.order_id, SUM(r.amount)::numeric AS refund_amount
            FROM ${refunds} r
            WHERE r.status = 'processed'
            GROUP BY r.order_id
        ),
        line_enriched AS (
            SELECT
                li.*,
                CASE
                    WHEN og.order_gross > 0 THEN li.line_gross / og.order_gross
                    ELSE 0
                END AS line_weight,
                CASE
                    WHEN og.order_gross > 0 THEN li.order_total * (li.line_gross / og.order_gross)
                    ELSE 0
                END AS alloc_total,
                CASE
                    WHEN og.order_gross > 0 THEN li.order_discount * (li.line_gross / og.order_gross)
                    ELSE 0
                END AS alloc_discount,
                CASE
                    WHEN og.order_gross > 0 THEN li.order_tax * (li.line_gross / og.order_gross)
                    ELSE 0
                END AS alloc_tax,
                CASE
                    WHEN og.order_gross > 0 THEN li.order_shipping * (li.line_gross / og.order_gross)
                    ELSE 0
                END AS alloc_shipping,
                CASE
                    WHEN og.order_gross > 0 THEN COALESCE(rb.refund_amount, 0) * (li.line_gross / og.order_gross)
                    ELSE 0
                END AS alloc_returns
            FROM line_items li
            INNER JOIN order_gross og ON og.order_id = li.order_id
            LEFT JOIN refund_by_order rb ON rb.order_id = li.order_id
        )
        SELECT
            ${dimensionSql} AS dimension,
            ${metricsSelect}
        FROM line_enriched li
        GROUP BY 1
        ORDER BY ${sql.raw(sortBy)} ${sql.raw(sortDirection)}
        LIMIT ${limit}
        OFFSET ${offset}
    `);

    const countRows = await db.execute(sql`
        WITH line_items AS (
            SELECT
                oi.order_id,
                o.status AS order_status,
                DATE(o.created_at) AS order_date,
                p.title AS product_title,
                b.name AS product_vendor,
                c.name AS product_type
            FROM ${orderItems} oi
            INNER JOIN ${orders} o ON oi.order_id = o.id
            INNER JOIN ${products} p ON oi.product_id = p.id
            LEFT JOIN ${brands} b ON p.brand_id = b.id
            LEFT JOIN ${categories} c ON p.category_id = c.id
            WHERE o.status <> 'cancelled'
              AND o.payment_status <> 'failed'
              AND o.created_at >= ${startSql}
              AND o.created_at <= ${endSql}
        )
        SELECT COUNT(*)::int AS total
        FROM (
            SELECT ${dimensionSql} AS dimension
            FROM line_items li
            GROUP BY 1
        ) grouped
    `);

    const formattedRows: FreeformResultRow[] = rows.map((row) => {
        const metricValues = {
            gross_sales: toNum(row.gross_sales),
            discounts: toNum(row.discounts),
            returns: toNum(row.returns),
            net_sales: toNum(row.net_sales),
            taxes: toNum(row.taxes),
            shipping: toNum(row.shipping),
            total_sales: toNum(row.total_sales),
            orders: toNum(row.orders),
            units_sold: toNum(row.units_sold),
        } as Record<FreeformMetric, number>;

        return {
            dimension: String(row.dimension ?? "Unknown"),
            metrics: metricValues,
        };
    });

    return {
        rows: formattedRows,
        totalRows: toNum(countRows[0]?.total),
        dimension: input.dimension,
        metrics,
    };
}





export interface RefreshAnalyticsSnapshotsInput {
    startDate?: string;
    endDate?: string;
    timezone?: string;
    currency?: string;
}

export interface RefreshAnalyticsSnapshotsResult {
    refreshedDateRange: {
        startDate: string;
        endDate: string;
    };
    commerceRowsUpserted: number;
    behaviorRowsUpserted: number;
    landingRowsUpserted: number;
    posthogConfigured: boolean;
}

function getDatesInRange(start: Date, end: Date) {
    const dates: Date[] = [];
    let cursor = startOfDay(start);
    const until = endOfDay(end);

    while (cursor <= until) {
        dates.push(cursor);
        cursor = addDays(cursor, 1);
    }

    return dates;
}

export async function refreshAdminAnalyticsSnapshots(
    input: RefreshAnalyticsSnapshotsInput = {}
): Promise<RefreshAnalyticsSnapshotsResult> {
    const timezone = input.timezone ?? "Asia/Kolkata";
    const currency = input.currency ?? "INR";

    const endDate = input.endDate ? endOfDay(new Date(input.endDate)) : endOfDay(new Date());
    const startDate = input.startDate
        ? startOfDay(new Date(input.startDate))
        : startOfDay(addDays(endDate, -30));

    const dates = getDatesInRange(startDate, endDate);
    let commerceRowsUpserted = 0;

    for (const date of dates) {
        const dateStart = startOfDay(date);
        const dateEnd = endOfDay(date);
        const dateKey = toDateOnlyKey(date);

        const aggregates = await getWindowAggregates(dateStart, dateEnd);

        await db
            .insert(analyticsDailyCommerce)
            .values({
                dateKey,
                timezone,
                currency,
                grossSalesPaise: aggregates.grossSalesPaise,
                discountsPaise: aggregates.discountsPaise,
                returnsPaise: aggregates.returnsPaise,
                netSalesPaise: aggregates.netSalesPaise,
                shippingPaise: aggregates.shippingPaise,
                taxesPaise: aggregates.taxesPaise,
                totalSalesPaise: aggregates.totalSalesPaise,
                ordersCount: aggregates.orders,
                ordersFulfilledCount: aggregates.ordersFulfilled,
                customersCount: aggregates.newCustomers + aggregates.returningCustomers,
                newCustomersCount: aggregates.newCustomers,
                returningCustomersCount: aggregates.returningCustomers,
            })
            .onConflictDoUpdate({
                target: [
                    analyticsDailyCommerce.dateKey,
                    analyticsDailyCommerce.timezone,
                    analyticsDailyCommerce.currency,
                ],
                set: {
                    grossSalesPaise: aggregates.grossSalesPaise,
                    discountsPaise: aggregates.discountsPaise,
                    returnsPaise: aggregates.returnsPaise,
                    netSalesPaise: aggregates.netSalesPaise,
                    shippingPaise: aggregates.shippingPaise,
                    taxesPaise: aggregates.taxesPaise,
                    totalSalesPaise: aggregates.totalSalesPaise,
                    ordersCount: aggregates.orders,
                    ordersFulfilledCount: aggregates.ordersFulfilled,
                    customersCount: aggregates.newCustomers + aggregates.returningCustomers,
                    newCustomersCount: aggregates.newCustomers,
                    returningCustomersCount: aggregates.returningCustomers,
                    updatedAt: new Date(),
                },
            });

        commerceRowsUpserted += 1;
    }

    const posthogConfigured = isPostHogBehaviorConfigured();

    let behaviorRowsUpserted = 0;
    let landingRowsUpserted = 0;

    if (posthogConfigured) {
        const behaviorRows = await getPostHogDailyBehavior(startDate, endDate);
        const behaviorByDate = new Map(behaviorRows.map((row) => [row.dateKey, row]));

        for (const date of dates) {
            const dateKey = toDateOnlyKey(date);
            const row = behaviorByDate.get(dateKey);

            await db
                .insert(analyticsDailyBehavior)
                .values({
                    dateKey,
                    timezone,
                    sessions: row?.sessions ?? 0,
                    visitors: row?.visitors ?? 0,
                    sessionsWithCart: row?.sessionsWithCart ?? 0,
                    sessionsReachedCheckout: row?.sessionsReachedCheckout ?? 0,
                    bounceSessions: row?.bounceSessions ?? 0,
                })
                .onConflictDoUpdate({
                    target: [analyticsDailyBehavior.dateKey, analyticsDailyBehavior.timezone],
                    set: {
                        sessions: row?.sessions ?? 0,
                        visitors: row?.visitors ?? 0,
                        sessionsWithCart: row?.sessionsWithCart ?? 0,
                        sessionsReachedCheckout: row?.sessionsReachedCheckout ?? 0,
                        bounceSessions: row?.bounceSessions ?? 0,
                        updatedAt: new Date(),
                    },
                });

            behaviorRowsUpserted += 1;
        }

        await db.delete(analyticsLandingPageDaily).where(
            and(
                eq(analyticsLandingPageDaily.timezone, timezone),
                gte(analyticsLandingPageDaily.dateKey, toDateOnlyKey(startDate)),
                lte(analyticsLandingPageDaily.dateKey, toDateOnlyKey(endDate))
            )
        );

        const landingRows = await getPostHogLandingPageDaily(startDate, endDate, 5000);

        if (landingRows.length > 0) {
            const chunkSize = 500;
            for (let i = 0; i < landingRows.length; i += chunkSize) {
                const chunk = landingRows.slice(i, i + chunkSize);
                await db.insert(analyticsLandingPageDaily).values(
                    chunk.map((row) => ({
                        dateKey: row.dateKey,
                        timezone,
                        landingPath: row.landingPath,
                        landingType: row.landingType,
                        sessions: row.sessions,
                        visitors: row.visitors,
                        sessionsWithCart: row.sessionsWithCart,
                        sessionsReachedCheckout: row.sessionsReachedCheckout,
                    }))
                );
            }

            landingRowsUpserted = landingRows.length;
        }
    }

    return {
        refreshedDateRange: {
            startDate: toDateOnlyKey(startDate),
            endDate: toDateOnlyKey(endDate),
        },
        commerceRowsUpserted,
        behaviorRowsUpserted,
        landingRowsUpserted,
        posthogConfigured,
    };
}



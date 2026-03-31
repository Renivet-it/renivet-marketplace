import { db } from "@/lib/db";
import {
    brands,
    categories,
    orderItems,
    orders,
    productTypes,
    productVariants,
    products,
    returnItemDetails,
    subCategories,
} from "@/lib/db/schema";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

export const OPERATIONAL_REPORT_TYPES = [
    "stock_movement",
    "catalog",
    "inventory",
    "smart_jit",
    "sales_new",
    "faq",
] as const;

export type OperationalReportType = (typeof OPERATIONAL_REPORT_TYPES)[number];

export const OPERATIONAL_PARTNER_TYPES = [
    "all",
    "prepaid",
    "cod",
    "other",
] as const;

export type OperationalPartnerType = (typeof OPERATIONAL_PARTNER_TYPES)[number];

export type OperationalReportStatus = "completed";

export interface OperationalStoreOption {
    id: string;
    name: string;
}

export interface OperationalReportFilters {
    report: OperationalReportType;
    storeId?: string;
    partnerType: OperationalPartnerType;
    startDate: Date;
    endDate: Date;
}

export interface OperationalReportRow {
    id: string;
    storeId: string | null;
    storeName: string;
    report: OperationalReportType;
    reportName: string;
    partnerType: OperationalPartnerType;
    partnerTypeLabel: string;
    dateRangeLabel: string;
    queryDate: Date;
    status: OperationalReportStatus;
    expectedFinishTime: string;
    downloadUrl: string;
}

export interface OperationalReportListInput extends OperationalReportFilters {
    page: number;
    limit: number;
}

export interface OperationalReportListResult {
    rows: OperationalReportRow[];
    total: number;
}

export interface OperationalCsvInput extends OperationalReportFilters {}

export interface OperationalCsvOutput {
    filename: string;
    headers: string[];
    rows: Record<string, string | number | boolean | null>[];
}

const LOW_STOCK_THRESHOLD = 10;
const SMART_JIT_COVER_DAYS_TARGET = 14;

const formatterDate = new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
});

const formatterDateTime = new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

function formatDate(value: Date) {
    return formatterDate.format(value);
}

function formatDateTime(value: Date) {
    return formatterDateTime.format(value);
}

function formatDateInput(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatMonthName(value: Date) {
    return value.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
    });
}

function toNumber(value: unknown) {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
}

function getReportLabel(report: OperationalReportType) {
    switch (report) {
        case "stock_movement":
            return "Stock Movement Report";
        case "catalog":
            return "Catalog";
        case "inventory":
            return "Inventory";
        case "smart_jit":
            return "SmartJIT";
        case "sales_new":
            return "SalesNew";
        case "faq":
            return "FAQ";
        default:
            return "Report";
    }
}

export function getPartnerTypeLabel(type: OperationalPartnerType) {
    switch (type) {
        case "all":
            return "All";
        case "prepaid":
            return "PREPAID";
        case "cod":
            return "COD";
        case "other":
            return "OTHER";
        default:
            return "All";
    }
}

function getPaymentMethodCondition(partnerType: OperationalPartnerType) {
    if (partnerType === "all") return undefined;

    if (partnerType === "cod") {
        return sql`(
            LOWER(COALESCE(${orders.paymentMethod}, '')) LIKE '%cod%'
            OR LOWER(COALESCE(${orders.paymentMethod}, '')) LIKE '%cash%'
        )`;
    }

    if (partnerType === "prepaid") {
        return sql`(
            ${orders.paymentMethod} IS NOT NULL
            AND TRIM(${orders.paymentMethod}) <> ''
            AND LOWER(COALESCE(${orders.paymentMethod}, '')) NOT LIKE '%cod%'
            AND LOWER(COALESCE(${orders.paymentMethod}, '')) NOT LIKE '%cash%'
        )`;
    }

    return sql`(
        ${orders.paymentMethod} IS NULL
        OR TRIM(${orders.paymentMethod}) = ''
    )`;
}

function getProductStockExpression() {
    return sql<number>`CASE
        WHEN ${products.productHasVariants} = true THEN COALESCE((
            SELECT SUM(${productVariants.quantity})
            FROM ${productVariants}
            WHERE ${productVariants.productId} = ${products.id}
              AND ${productVariants.isDeleted} = false
        ), 0)
        ELSE COALESCE(${products.quantity}, 0)
    END`;
}

function getMonthlyRange(dateText: string) {
    const start = new Date(`${dateText}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    end.setUTCDate(0);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
}

function getPastDate(base: Date, days: number) {
    const result = new Date(base);
    result.setDate(result.getDate() - days);
    return result;
}

function buildDownloadUrl({
    report,
    storeId,
    partnerType,
    startDate,
    endDate,
}: {
    report: OperationalReportType;
    storeId: string | null;
    partnerType: OperationalPartnerType;
    startDate: Date;
    endDate: Date;
}) {
    const params = new URLSearchParams({
        report,
        partnerType,
        startDate: formatDateInput(startDate),
        endDate: formatDateInput(endDate),
    });

    if (storeId) params.set("storeId", storeId);

    return `/api/reports/operational?${params.toString()}`;
}

export async function getOperationalStores() {
    const rows = await db
        .select({
            id: brands.id,
            name: brands.name,
        })
        .from(brands)
        .orderBy(asc(brands.name));

    return rows as OperationalStoreOption[];
}

async function getCatalogSummary(filters: OperationalReportFilters) {
    const rows = await db
        .select({
            storeId: brands.id,
            storeName: brands.name,
            totalProducts: sql<number>`COUNT(${products.id})`,
        })
        .from(products)
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                eq(products.isDeleted, false),
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined,
                gte(products.updatedAt, filters.startDate),
                lte(products.updatedAt, filters.endDate)
            )
        )
        .groupBy(brands.id, brands.name)
        .orderBy(asc(brands.name));

    return rows
        .filter((row) => toNumber(row.totalProducts) > 0)
        .map((row) => {
            const reportName = `CatalogSnapshot_${formatDateInput(filters.endDate)}`;
            return {
                id: `catalog-${row.storeId}`,
                storeId: row.storeId,
                storeName: row.storeName,
                reportName,
                startDate: filters.startDate,
                endDate: filters.endDate,
            };
        });
}

async function getInventorySummary(filters: OperationalReportFilters) {
    const stockExpr = getProductStockExpression();

    const rows = await db
        .select({
            storeId: brands.id,
            storeName: brands.name,
            totalSkus: sql<number>`COUNT(${products.id})`,
            totalStock: sql<number>`SUM(${stockExpr})`,
            lowStockSkus: sql<number>`SUM(CASE WHEN ${stockExpr} <= ${LOW_STOCK_THRESHOLD} THEN 1 ELSE 0 END)`,
        })
        .from(products)
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                eq(products.isDeleted, false),
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined
            )
        )
        .groupBy(brands.id, brands.name)
        .orderBy(asc(brands.name));

    return rows
        .filter((row) => toNumber(row.totalSkus) > 0)
        .map((row) => {
            const reportName = `Seller_Inventory_Report_${formatDateInput(filters.endDate)}`;
            return {
                id: `inventory-${row.storeId}`,
                storeId: row.storeId,
                storeName: row.storeName,
                reportName,
                startDate: filters.startDate,
                endDate: filters.endDate,
            };
        });
}

async function getSmartJitDetails(filters: OperationalReportFilters) {
    const stockExpr = getProductStockExpression();
    const salesStartDate = getPastDate(filters.endDate, 30);
    const paymentCondition = getPaymentMethodCondition(filters.partnerType);

    const salesRows = await db
        .select({
            productId: orderItems.productId,
            soldUnits: sql<number>`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
            and(
                gte(orders.createdAt, salesStartDate),
                lte(orders.createdAt, filters.endDate),
                sql`${orders.status} <> 'cancelled'`,
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined,
                paymentCondition
            )
        )
        .groupBy(orderItems.productId);

    const soldMap = new Map<string, number>(
        salesRows.map((row) => [row.productId, toNumber(row.soldUnits)])
    );

    const inventoryRows = await db
        .select({
            productId: products.id,
            sku: products.sku,
            title: products.title,
            storeId: brands.id,
            storeName: brands.name,
            currentStock: stockExpr,
        })
        .from(products)
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                eq(products.isDeleted, false),
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined
            )
        )
        .orderBy(asc(brands.name), asc(products.title));

    return inventoryRows
        .map((row) => {
            const soldUnitsLast30Days = soldMap.get(row.productId) ?? 0;
            const currentStock = toNumber(row.currentStock);
            const avgDailySales = soldUnitsLast30Days > 0 ? soldUnitsLast30Days / 30 : 0;
            const daysOfCover =
                avgDailySales > 0 ? Number((currentStock / avgDailySales).toFixed(2)) : null;
            const targetStock = Math.ceil(avgDailySales * SMART_JIT_COVER_DAYS_TARGET);
            const recommendedReorderQty = Math.max(targetStock - currentStock, 0);

            return {
                storeId: row.storeId,
                storeName: row.storeName,
                sku: row.sku ?? "NA",
                title: row.title,
                soldUnitsLast30Days,
                currentStock,
                avgDailySales: Number(avgDailySales.toFixed(2)),
                daysOfCover,
                recommendedReorderQty,
            };
        })
        .filter(
            (row) =>
                row.soldUnitsLast30Days > 0 &&
                (row.recommendedReorderQty > 0 ||
                    row.currentStock <= LOW_STOCK_THRESHOLD ||
                    (row.daysOfCover !== null &&
                        row.daysOfCover <= SMART_JIT_COVER_DAYS_TARGET))
        );
}

async function getSmartJitSummary(filters: OperationalReportFilters) {
    const details = await getSmartJitDetails(filters);
    const grouped = new Map<
        string,
        {
            storeId: string;
            storeName: string;
            recommendationCount: number;
        }
    >();

    for (const item of details) {
        const existing = grouped.get(item.storeId);
        if (existing) {
            existing.recommendationCount += 1;
            continue;
        }

        grouped.set(item.storeId, {
            storeId: item.storeId,
            storeName: item.storeName,
            recommendationCount: 1,
        });
    }

    return Array.from(grouped.values()).map((row) => {
        const reportName = `SmartJIT_${formatDateInput(filters.endDate)}`;
        return {
            id: `smart-jit-${row.storeId}`,
            storeId: row.storeId,
            storeName: row.storeName,
            reportName,
            startDate: filters.startDate,
            endDate: filters.endDate,
        };
    });
}
async function getSalesSummary(filters: OperationalReportFilters) {
    const paymentCondition = getPaymentMethodCondition(filters.partnerType);

    const rows = await db
        .select({
            storeId: brands.id,
            storeName: brands.name,
            monthStart: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'YYYY-MM-01')`,
            orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                gte(orders.createdAt, filters.startDate),
                lte(orders.createdAt, filters.endDate),
                sql`${orders.status} <> 'cancelled'`,
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined,
                paymentCondition
            )
        )
        .groupBy(
            brands.id,
            brands.name,
            sql`DATE_TRUNC('month', ${orders.createdAt})`
        )
        .orderBy(desc(sql`DATE_TRUNC('month', ${orders.createdAt})`), asc(brands.name));

    return rows
        .filter((row) => toNumber(row.orderCount) > 0)
        .map((row) => {
            const monthRange = getMonthlyRange(row.monthStart);
            const reportName = `Seller_Orders_Report_${row.monthStart}`;
            return {
                id: `sales-${row.storeId}-${row.monthStart}`,
                storeId: row.storeId,
                storeName: row.storeName,
                reportName,
                startDate: monthRange.start,
                endDate: monthRange.end,
            };
        });
}

async function getStockMovementSummary(filters: OperationalReportFilters) {
    const paymentCondition = getPaymentMethodCondition(filters.partnerType);

    const outboundRows = await db
        .select({
            storeId: brands.id,
            storeName: brands.name,
            monthStart: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'YYYY-MM-01')`,
            outboundUnits: sql<number>`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                gte(orders.createdAt, filters.startDate),
                lte(orders.createdAt, filters.endDate),
                sql`${orders.status} <> 'cancelled'`,
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined,
                paymentCondition
            )
        )
        .groupBy(
            brands.id,
            brands.name,
            sql`DATE_TRUNC('month', ${orders.createdAt})`
        );

    const returnRows =
        filters.partnerType !== "all"
            ? []
            : await db
                  .select({
                      storeId: brands.id,
                      storeName: brands.name,
                      monthStart: sql<string>`TO_CHAR(DATE_TRUNC('month', ${returnItemDetails.createdAt}), 'YYYY-MM-01')`,
                      returnedUnits: sql<number>`SUM(COALESCE(${returnItemDetails.units}, 0))`,
                  })
                  .from(returnItemDetails)
                  .innerJoin(brands, eq(returnItemDetails.brandId, brands.id))
                  .where(
                      and(
                          gte(returnItemDetails.createdAt, filters.startDate),
                          lte(returnItemDetails.createdAt, filters.endDate),
                          filters.storeId
                              ? eq(returnItemDetails.brandId, filters.storeId)
                              : undefined
                      )
                  )
                  .groupBy(
                      brands.id,
                      brands.name,
                      sql`DATE_TRUNC('month', ${returnItemDetails.createdAt})`
                  );

    const merged = new Map<
        string,
        { storeId: string; storeName: string; monthStart: string; outbound: number; returned: number }
    >();

    for (const row of outboundRows) {
        const key = `${row.storeId}-${row.monthStart}`;
        merged.set(key, {
            storeId: row.storeId,
            storeName: row.storeName,
            monthStart: row.monthStart,
            outbound: toNumber(row.outboundUnits),
            returned: 0,
        });
    }

    for (const row of returnRows) {
        const key = `${row.storeId}-${row.monthStart}`;
        const existing = merged.get(key);
        if (existing) {
            existing.returned = toNumber(row.returnedUnits);
            continue;
        }

        merged.set(key, {
            storeId: row.storeId,
            storeName: row.storeName,
            monthStart: row.monthStart,
            outbound: 0,
            returned: toNumber(row.returnedUnits),
        });
    }

    return Array.from(merged.values())
        .sort((a, b) =>
            a.monthStart === b.monthStart
                ? a.storeName.localeCompare(b.storeName)
                : b.monthStart.localeCompare(a.monthStart)
        )
        .filter((row) => row.outbound > 0 || row.returned > 0)
        .map((row) => {
            const monthRange = getMonthlyRange(row.monthStart);
            const reportName = `Stock_Movement_Report_${row.monthStart}`;
            return {
                id: `stock-${row.storeId}-${row.monthStart}`,
                storeId: row.storeId,
                storeName: row.storeName,
                reportName,
                startDate: monthRange.start,
                endDate: monthRange.end,
            };
        });
}

async function getFaqSummary(filters: OperationalReportFilters) {
    const stores = await getOperationalStores();
    const filteredStores = filters.storeId
        ? stores.filter((store) => store.id === filters.storeId)
        : stores;

    return filteredStores.map((store) => ({
        id: `faq-${store.id}`,
        storeId: store.id,
        storeName: store.name,
        reportName: `FAQ_${formatDateInput(filters.endDate)}`,
        startDate: filters.startDate,
        endDate: filters.endDate,
    }));
}

function getDateRangeLabel(startDate: Date, endDate: Date) {
    const isSameDay =
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate();

    if (isSameDay) return "Snapshot";
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export async function getOperationalReportList(input: OperationalReportListInput) {
    let summaryRows:
        | {
              id: string;
              storeId: string | null;
              storeName: string;
              reportName: string;
              startDate: Date;
              endDate: Date;
          }[]
        = [];

    if (input.report === "catalog") {
        summaryRows = await getCatalogSummary(input);
    } else if (input.report === "inventory") {
        summaryRows = await getInventorySummary(input);
    } else if (input.report === "smart_jit") {
        summaryRows = await getSmartJitSummary(input);
    } else if (input.report === "sales_new") {
        summaryRows = await getSalesSummary(input);
    } else if (input.report === "stock_movement") {
        summaryRows = await getStockMovementSummary(input);
    } else if (input.report === "faq") {
        summaryRows = await getFaqSummary(input);
    }

    const queryDate = new Date();
    const partnerTypeLabel = getPartnerTypeLabel(input.partnerType);

    const rows = summaryRows.map<OperationalReportRow>((row) => ({
        id: row.id,
        storeId: row.storeId,
        storeName: row.storeName,
        report: input.report,
        reportName: row.reportName,
        partnerType: input.partnerType,
        partnerTypeLabel,
        dateRangeLabel: getDateRangeLabel(row.startDate, row.endDate),
        queryDate,
        status: "completed",
        expectedFinishTime: "--",
        downloadUrl: buildDownloadUrl({
            report: input.report,
            storeId: row.storeId,
            partnerType: input.partnerType,
            startDate: row.startDate,
            endDate: row.endDate,
        }),
    }));

    const total = rows.length;
    const start = Math.max((input.page - 1) * input.limit, 0);
    const paginatedRows = rows.slice(start, start + input.limit);

    return {
        rows: paginatedRows,
        total,
    };
}
async function getCatalogDetails(filters: OperationalCsvInput) {
    const rows = await db
        .select({
            store: brands.name,
            sku: products.sku,
            title: products.title,
            category: categories.name,
            subCategory: subCategories.name,
            productType: productTypes.name,
            verificationStatus: products.verificationStatus,
            isPublished: products.isPublished,
            isActive: products.isActive,
            stock: sql<number>`COALESCE(${products.quantity}, 0)`,
            updatedAt: products.updatedAt,
        })
        .from(products)
        .innerJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(subCategories, eq(products.subcategoryId, subCategories.id))
        .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
        .where(
            and(
                eq(products.isDeleted, false),
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined,
                gte(products.updatedAt, filters.startDate),
                lte(products.updatedAt, filters.endDate)
            )
        )
        .orderBy(asc(brands.name), asc(products.title));

    return rows.map((row) => ({
        store: row.store,
        sku: row.sku ?? "NA",
        title: row.title,
        category: row.category ?? "NA",
        subCategory: row.subCategory ?? "NA",
        productType: row.productType ?? "NA",
        verificationStatus: row.verificationStatus,
        isPublished: row.isPublished,
        isActive: row.isActive,
        stock: toNumber(row.stock),
        updatedAt: row.updatedAt ? formatDateTime(new Date(row.updatedAt)) : "NA",
    }));
}

async function getInventoryDetails(filters: OperationalCsvInput) {
    const stockExpr = getProductStockExpression();

    const rows = await db
        .select({
            store: brands.name,
            sku: products.sku,
            title: products.title,
            totalStock: stockExpr,
            updatedAt: products.updatedAt,
        })
        .from(products)
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                eq(products.isDeleted, false),
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined
            )
        )
        .orderBy(asc(brands.name), asc(products.title));

    return rows.map((row) => {
        const totalStock = toNumber(row.totalStock);
        return {
            store: row.store,
            sku: row.sku ?? "NA",
            title: row.title,
            totalStock,
            lowStock: totalStock <= LOW_STOCK_THRESHOLD,
            stockStatus:
                totalStock <= 0
                    ? "OUT_OF_STOCK"
                    : totalStock <= LOW_STOCK_THRESHOLD
                      ? "LOW_STOCK"
                      : "HEALTHY",
            updatedAt: row.updatedAt ? formatDateTime(new Date(row.updatedAt)) : "NA",
        };
    });
}

async function getSmartJitCsvRows(filters: OperationalCsvInput) {
    const rows = await getSmartJitDetails(filters);
    return rows.map((row) => ({
        store: row.storeName,
        sku: row.sku,
        title: row.title,
        soldUnitsLast30Days: row.soldUnitsLast30Days,
        currentStock: row.currentStock,
        avgDailySales: row.avgDailySales,
        daysOfCover: row.daysOfCover ?? "NA",
        recommendedReorderQty: row.recommendedReorderQty,
    }));
}

async function getSalesDetails(filters: OperationalCsvInput) {
    const paymentCondition = getPaymentMethodCondition(filters.partnerType);

    const rows = await db
        .select({
            store: brands.name,
            monthStart: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'YYYY-MM-01')`,
            orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
            unitsSold: sql<number>`SUM(${orderItems.quantity})`,
            estimatedRevenuePaise: sql<number>`SUM(COALESCE(${productVariants.price}, ${products.price}, 0) * ${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                gte(orders.createdAt, filters.startDate),
                lte(orders.createdAt, filters.endDate),
                sql`${orders.status} <> 'cancelled'`,
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined,
                paymentCondition
            )
        )
        .groupBy(
            brands.name,
            sql`DATE_TRUNC('month', ${orders.createdAt})`
        )
        .orderBy(desc(sql`DATE_TRUNC('month', ${orders.createdAt})`), asc(brands.name));

    return rows.map((row) => {
        const monthStart = new Date(`${row.monthStart}T00:00:00.000Z`);
        return {
            store: row.store,
            month: formatMonthName(monthStart),
            orders: toNumber(row.orderCount),
            unitsSold: toNumber(row.unitsSold),
            estimatedRevenueInr: Number((toNumber(row.estimatedRevenuePaise) / 100).toFixed(2)),
            partnerType: getPartnerTypeLabel(filters.partnerType),
        };
    });
}

async function getStockMovementDetails(filters: OperationalCsvInput) {
    const paymentCondition = getPaymentMethodCondition(filters.partnerType);

    const outboundRows = await db
        .select({
            storeId: brands.id,
            storeName: brands.name,
            monthStart: sql<string>`TO_CHAR(DATE_TRUNC('month', ${orders.createdAt}), 'YYYY-MM-01')`,
            outboundUnits: sql<number>`SUM(${orderItems.quantity})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(
            and(
                gte(orders.createdAt, filters.startDate),
                lte(orders.createdAt, filters.endDate),
                sql`${orders.status} <> 'cancelled'`,
                filters.storeId ? eq(products.brandId, filters.storeId) : undefined,
                paymentCondition
            )
        )
        .groupBy(
            brands.id,
            brands.name,
            sql`DATE_TRUNC('month', ${orders.createdAt})`
        );

    const returnRows =
        filters.partnerType !== "all"
            ? []
            : await db
                  .select({
                      storeId: brands.id,
                      storeName: brands.name,
                      monthStart: sql<string>`TO_CHAR(DATE_TRUNC('month', ${returnItemDetails.createdAt}), 'YYYY-MM-01')`,
                      returnedUnits: sql<number>`SUM(COALESCE(${returnItemDetails.units}, 0))`,
                  })
                  .from(returnItemDetails)
                  .innerJoin(brands, eq(returnItemDetails.brandId, brands.id))
                  .where(
                      and(
                          gte(returnItemDetails.createdAt, filters.startDate),
                          lte(returnItemDetails.createdAt, filters.endDate),
                          filters.storeId
                              ? eq(returnItemDetails.brandId, filters.storeId)
                              : undefined
                      )
                  )
                  .groupBy(
                      brands.id,
                      brands.name,
                      sql`DATE_TRUNC('month', ${returnItemDetails.createdAt})`
                  );

    const merged = new Map<
        string,
        { storeName: string; monthStart: string; outbound: number; returned: number }
    >();

    for (const row of outboundRows) {
        const key = `${row.storeId}-${row.monthStart}`;
        merged.set(key, {
            storeName: row.storeName,
            monthStart: row.monthStart,
            outbound: toNumber(row.outboundUnits),
            returned: 0,
        });
    }

    for (const row of returnRows) {
        const key = `${row.storeId}-${row.monthStart}`;
        const existing = merged.get(key);
        if (existing) {
            existing.returned = toNumber(row.returnedUnits);
            continue;
        }

        merged.set(key, {
            storeName: row.storeName,
            monthStart: row.monthStart,
            outbound: 0,
            returned: toNumber(row.returnedUnits),
        });
    }

    return Array.from(merged.values())
        .sort((a, b) =>
            a.monthStart === b.monthStart
                ? a.storeName.localeCompare(b.storeName)
                : b.monthStart.localeCompare(a.monthStart)
        )
        .map((row) => {
            const monthStart = new Date(`${row.monthStart}T00:00:00.000Z`);
            return {
                store: row.storeName,
                month: formatMonthName(monthStart),
                outboundUnits: row.outbound,
                returnedUnits: row.returned,
                netMovement: row.returned - row.outbound,
                partnerType: getPartnerTypeLabel(filters.partnerType),
            };
        });
}

function getFaqDetails() {
    return [
        {
            section: "Catalog",
            definition:
                "Catalog report tracks listing status, publish state, and verification health for each SKU.",
            recommendedUse:
                "Use daily to find rejected or unpublished products before campaigns.",
        },
        {
            section: "Inventory",
            definition:
                "Inventory report shows SKU-level stock with low-stock and out-of-stock flags.",
            recommendedUse:
                "Use for replenishment planning and out-of-stock prevention.",
        },
        {
            section: "SmartJIT",
            definition:
                "SmartJIT estimates reorder quantity from recent sales velocity and current stock.",
            recommendedUse:
                "Use weekly to prioritize fast-moving SKUs that need restocking.",
        },
        {
            section: "SalesNew",
            definition:
                "Sales report aggregates monthly orders, units sold, and estimated revenue.",
            recommendedUse:
                "Use for month-over-month performance checks and revenue reviews.",
        },
        {
            section: "Stock Movement",
            definition:
                "Stock movement captures outbound sold units, returned units, and net stock movement.",
            recommendedUse:
                "Use for reconciliation between inventory and order/returns activity.",
        },
    ];
}
export async function getOperationalCsvData(
    input: OperationalCsvInput
): Promise<OperationalCsvOutput> {
    const storeSlug = input.storeId ? `store_${input.storeId}` : "all_stores";
    const dateSlug = `${formatDateInput(input.startDate)}_${formatDateInput(input.endDate)}`;
    const reportSlug = input.report;

    if (input.report === "catalog") {
        const rows = await getCatalogDetails(input);
        return {
            filename: `${reportSlug}_${storeSlug}_${dateSlug}.csv`,
            headers: [
                "store",
                "sku",
                "title",
                "category",
                "subCategory",
                "productType",
                "verificationStatus",
                "isPublished",
                "isActive",
                "stock",
                "updatedAt",
            ],
            rows,
        };
    }

    if (input.report === "inventory") {
        const rows = await getInventoryDetails(input);
        return {
            filename: `${reportSlug}_${storeSlug}_${dateSlug}.csv`,
            headers: [
                "store",
                "sku",
                "title",
                "totalStock",
                "lowStock",
                "stockStatus",
                "updatedAt",
            ],
            rows,
        };
    }

    if (input.report === "smart_jit") {
        const rows = await getSmartJitCsvRows(input);
        return {
            filename: `${reportSlug}_${storeSlug}_${dateSlug}.csv`,
            headers: [
                "store",
                "sku",
                "title",
                "soldUnitsLast30Days",
                "currentStock",
                "avgDailySales",
                "daysOfCover",
                "recommendedReorderQty",
            ],
            rows,
        };
    }

    if (input.report === "sales_new") {
        const rows = await getSalesDetails(input);
        return {
            filename: `${reportSlug}_${storeSlug}_${dateSlug}.csv`,
            headers: [
                "store",
                "month",
                "orders",
                "unitsSold",
                "estimatedRevenueInr",
                "partnerType",
            ],
            rows,
        };
    }

    if (input.report === "stock_movement") {
        const rows = await getStockMovementDetails(input);
        return {
            filename: `${reportSlug}_${storeSlug}_${dateSlug}.csv`,
            headers: [
                "store",
                "month",
                "outboundUnits",
                "returnedUnits",
                "netMovement",
                "partnerType",
            ],
            rows,
        };
    }

    const rows = getFaqDetails();
    return {
        filename: `${reportSlug}_${storeSlug}_${dateSlug}.csv`,
        headers: ["section", "definition", "recommendedUse"],
        rows,
    };
}

export function getOperationalDefaultDates() {
    const endDate = new Date();
    const startDate = getPastDate(endDate, 30);
    return {
        startDate,
        endDate,
    };
}

export function parseOperationalReportType(value: string | undefined) {
    if (!value) return "catalog" as OperationalReportType;
    return OPERATIONAL_REPORT_TYPES.includes(value as OperationalReportType)
        ? (value as OperationalReportType)
        : ("catalog" as OperationalReportType);
}

export function parseOperationalPartnerType(value: string | undefined) {
    if (!value) return "all" as OperationalPartnerType;
    return OPERATIONAL_PARTNER_TYPES.includes(value as OperationalPartnerType)
        ? (value as OperationalPartnerType)
        : ("all" as OperationalPartnerType);
}

export function parseOperationalDate(value: string | undefined, fallback: Date) {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed;
}

export function parseOperationalPage(value: string | undefined) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.trunc(parsed);
}

export function parseOperationalLimit(value: string | undefined) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 10;
    return Math.min(Math.trunc(parsed), 100);
}

export function getOperationalReportTitle(report: OperationalReportType) {
    return getReportLabel(report);
}

export function getOperationalDateInputValue(date: Date) {
    return formatDateInput(date);
}

export function getOperationalDateTimeLabel(date: Date) {
    return formatDateTime(date);
}

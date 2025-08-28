// app/actions/analytics.ts
"use server";

import { productQueries } from "@/lib/db/queries";

export async function getOverviewMetrics(dateRange: string = "30d") {
  try {
    return await productQueries.getOverviewMetrics(dateRange);
  } catch (error) {
    console.error("Error fetching overview metrics:", error);
    throw new Error("Failed to fetch overview metrics");
  }
}

export async function getRevenueTrend(dateRange: string = "30d") {
  try {
    return await productQueries.getRevenueTrend(dateRange);
  } catch (error) {
    console.error("Error fetching revenue trend:", error);
    throw new Error("Failed to fetch revenue trend");
  }
}

export async function getBrandPerformance(dateRange: string = "30d") {
  try {
    return await productQueries.getBrandPerformance(dateRange);
  } catch (error) {
    console.error("Error fetching brand performance:", error);
    throw new Error("Failed to fetch brand performance");
  }
}

export async function getTopProducts(limit: number = 5, dateRange: string = "30d") {
  try {
    return await productQueries.getTopProducts(limit, dateRange);
  } catch (error) {
    console.error("Error fetching top products:", error);
    throw new Error("Failed to fetch top products");
  }
}


export async function getTopProductsbySales(limit: number = 5, dateRange: string = "30d") {
  try {
    return await productQueries.getTopProductsbySales(limit, dateRange);
  } catch (error) {
    console.error("Error fetching top products:", error);
    throw new Error("Failed to fetch top products");
  }
}

export async function getProductsByCategory(dateRange: string = "30d") {
  try {
    return await productQueries.getProductsByCategory(dateRange);
  } catch (error) {
    console.error("Error fetching top products:", error);
    throw new Error("Failed to fetch top products");
  }
}



// ✅ Get Products for Conversion Chart
export async function getProductsForConversion(limit: number = 10, dateRange: string = "30d") {
  try {
    return await productQueries.getProductsForConversion(limit, dateRange);
  } catch (error) {
    console.error("Error fetching products for conversion:", error);
    throw new Error("Failed to fetch conversion data");
  }
}

// ✅ Get Products for Funnel Analysis
export async function getProductsForFunnel(limit: number = 15, dateRange: string = "30d") {
  try {
    return await productQueries.getProductsForFunnel(limit, dateRange);
  } catch (error) {
    console.error("Error fetching products for funnel:", error);
    throw new Error("Failed to fetch funnel data");
  }
}



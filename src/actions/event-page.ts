"use server";

import { productQueries } from "@/lib/db/queries";

type EventFilters = {
  page?: number;
  limit?: number;
  search?: string;
  brandIds?: string[];
  colors?: string[];
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  categoryId?: string | undefined;
  subCategoryId?: string | undefined;
  productTypeId?: string | undefined;
  sortBy?: "price" | "createdAt" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
};


export async function getEventProducts(filters: EventFilters) {
  return await productQueries.getNewEventPage(filters);
}

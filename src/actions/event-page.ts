"use server";

import { WomenHomeSectionQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";

export async function fetchProductGridForEvent() {
    // @ts-ignore
    const products = await productQueries.getNewEventPage();
    if (!products.length) return null;
    return products;
}
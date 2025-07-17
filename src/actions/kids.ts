"use server";

import { WomenHomeSectionQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";

export async function fetchBanners() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getKidsBannerSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchSustainableBatch() {
    // Note: The original SustanableBatchFetch does not fetch data and returns a component directly.
    // Assuming this is a placeholder, you might need to add actual data fetching logic here.
    // For now, returning null or a placeholder response.
    return null; // Replace with actual query if needed
}

export async function fetchExploreCategory() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getKidsExploreCategorySections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchSpecialCare() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getKidsCareSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchDiscountOffer() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getkidDiscountOfferSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchDollBanner() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getkidDollBuyingSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchKidTwining() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getkidDolllTwiningSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchProductGrid() {
    const products = await productQueries.getKidsPageFeaturedProducts();
    if (!products.length) return null;
    return products;
}
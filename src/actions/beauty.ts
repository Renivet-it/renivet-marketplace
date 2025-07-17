"use server";

import { WomenHomeSectionQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";

export async function fetchBanners() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyPersonalSections();
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
        WomenHomeSectionQueries.getBeautyExploreCategorySections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchBeautySkinCareBanner() {

    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautySkinBannerSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchNurtureBanner() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyNurtureSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBeautyDiscount() {

    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyDiscountSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBestSellerBanner() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyBestSellerSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBeautyMindful() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyMindFulSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBeautySkinQuiz() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautySkinQuizections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBeautyCareRoutine() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyCareRoutinetions();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchProductGridTopPicks() {
    // @ts-ignore
    const products = await productQueries.getBeautyTopPicks();
    if (!products.length) return null;
    return products;
}

export async function fetchProductGridNewArrivals() {
    // @ts-ignore
    const products = await productQueries.getBeautyNewArrivals();
    if (!products.length) return null;
    return products;
}
"use server";

import { WomenHomeSectionQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";

export async function fetchBanners() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingSections();
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
        WomenHomeSectionQueries.gethomeAndLivingCategoryExploreSections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchNewCollection() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingNewCollectionSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchMiddleBanner() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingBannerMiddleSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchEcoBanner() {

    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingEcoBanners();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBrandSection() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingBrandSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchCurateSection() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingCurateConciousSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchProductGridTopPicks() {
    const products = await productQueries.getHomeAndLivingTopPicks();
    if (!products.length) return null;
    return products;
}

export async function fetchProductGridNewArrivals() {
    const products = await productQueries.getHomeAndLivingNewArrivals();
    if (!products.length) return null;
    return products;
}
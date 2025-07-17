// actions/women.ts
"use server";

import { WomenHomeSectionQueries, homeShopByCategoryQueries, homeShopByCategoryTitleQueries, advertisementQueries, blogQueries, homeBrandProductQueries, productQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";

export async function fetchBanners() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getAllHomeShopByCategories();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchStyleWithSubstance() {
    const products = await WomenHomeSectionQueries.getWomenStyleWithSubstanceMiddleSection();
    if (!products.length) return null;
    return products;
}

export async function fetchProductGrid() {
    const products = await productQueries.getWomenPageFeaturedProducts();
    if (!products.length) return null;
    return products;
}

export async function fetchShopByCategories() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!sbc.length) return null;
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchShopByNewCategories() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getAllexploreCategories(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchElevateYourLooks() {

    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getAllelavateLooks(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchBlogs() {
    const blogs = await blogQueries.getBlogs({
        isPublished: true,
        limit: 6,
        page: 1,
    });
    return blogs.data;
}

export async function fetchBrandProducts() {
    const brandProducts = await homeBrandProductQueries.getAllHomeBrandProducts();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchWomenSkincare() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getwomenBrandSkinCareSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchMiddleAnimationSection() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getAlloutfitVarients();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBrandStoryTelling() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getwomenBranStoryTellingSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchNewCollectionMiddle() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getNewCollections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchSpecialOffer() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getWomenSummerSaleSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchFindYourStyle() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getWomenFindYourStyleSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchGetReady() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getWomenGetReadySection();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchNewCollectionDiscount() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getnewCollectionDiscountSection();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchStyleDirectory() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getAllstyleDirectory(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchSuggestedLook() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getSuggestedLookSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchMarketingStrip() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;
    const sorted = cachedMarktingStrip.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sorted;
}

export async function fetchDealMarketingStrip() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;
    const sorted = cachedMarktingStrip.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sorted;
}

export async function fetchAdvertisements() {
    const advertisements = await advertisementQueries.getAllAdvertisements({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;
    return advertisements;
}

export async function fetchNewAdvertisements() {
    const advertisements = await advertisementQueries.getAllAdvertisements({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;
    return advertisements;
}

export async function fetchDiscountPage() {
    const advertisements = await WomenHomeSectionQueries.getNewOfferSections({
    // @ts-ignore
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;
    return advertisements;
}

export async function fetchMoodBoard() {
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getWomenMoodBoards(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { moodboardItems: sbc, titleData: sbcT };
}

export async function fetchTopCollection() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getWomenStyleSubstanceSections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { collections: sbc, titleData: sbcT };
}
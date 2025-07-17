"use server";

import { WomenHomeSectionQueries, homeBrandProductQueries, homeShopByCategoryTitleQueries, advertisementQueries, blogQueries, productQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";

export async function fetchBanners() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getMenHomeBannerSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchBrandProducts() {
    const brandProducts = await homeBrandProductQueries.getAllHomeBrandProducts();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchMoodBoardMen() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getMenMoodBoardSection(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { moodboardItems: sbc, titleData: sbcT };
}

export async function fetchMenFreshCollection() {

    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getMenFreshInkCollection();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchShopByNewCategories() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getMenExploreCategorySections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchProductGrid() {
    const products = await productQueries.getMenPageFeaturedProducts();
    if (!products.length) return null;
    return products;
}

export async function fetchElevateYourLooks() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getMenelevateLooksections(),
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

export async function fetchMiddleAnimationSection() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getMenOutFitVarientSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchTopCollectionBanner() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getMenTopcollections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchNewCollectionMiddle() {

    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getMenNewCollections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchSpecialOffer() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getWomenSummerSaleSections();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchStyleDirectory() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getStyleDirectorySections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { shopByCategories: sbc, titleData: sbcT };
}

export async function fetchSuggestedLook() {
    // @ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getSuggestedLooksForYous();
    if (!brandProducts.length) return null;
    return brandProducts;
}

export async function fetchStyleWithSubstance() {
    const products = await WomenHomeSectionQueries.getmenStyleWithSubstanceMiddleSection();
    if (!products.length) return null;
    return products;
}

export async function fetchDiscountPage() {

    const advertisements = await WomenHomeSectionQueries.getDiscountOfferSections({
    // @ts-ignore
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;
    return advertisements;
}

export async function fetchTopCollection() {
    // @ts-ignore
    const [sbc, sbcT] = await Promise.all([
    // @ts-ignore
        WomenHomeSectionQueries.getTopCollectionSections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return { collections: sbc, titleData: sbcT };
}
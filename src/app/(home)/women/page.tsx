import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries,WomenHomeSectionQueries, homeShopByCategoryQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
import { Landing } from "@/components/home/women/banner";
import { ExploreCategories } from "@/components/home/women/explore-categories";
import { ElevateYourLooks } from "@/components/home/women/elavate-looks";
import { MiddleAnimationSection } from "@/components/home/women/middle-animation-banner";
import { StyleDirectory } from "@/components/home/women/style-directory";
import { NewCollection } from "@/components/home/women/new-collection";
import { DiscountOffer } from "@/components/home/women/discount-offer";
import { MoodboardItem } from "@/components/home/women/moodboard";
import { TopCollection } from "@/components/home/women/top-collection";
import { SpecialOffer } from "@/components/home/women/special-offer";
import { FindYourStyle } from "@/components/home/women/find-your-style";
import { SuggestedLook } from "@/components/home/women/suggested-looks";
import { BrandProducts } from "@/components/home/women/women-store-brand";
import { BrandStoryTelling } from "@/components/home/women/brand-storytelling";
import { WomenSkincare } from "@/components/home/women/women-glowing-skincare";

export default function Page() {
    return (
        <>
            <Suspense
                fallback={
                    <div className="h-[calc(100vh-20vh)] w-full bg-background" />
                }
            >
                <BannersFetch />
            </Suspense>
            <Suspense>
                <ShopByNewCategoriesFetch />
            </Suspense>
                        <Suspense>
                <ElevateYourLooksFetch />
            </Suspense>
                        <Suspense>
                <MiddleAnimationSectionFetch />
            </Suspense>
                                    <Suspense>
                <StyleDirectoryFetch />
            </Suspense>
                <Suspense>
                <NewCollectionMiddleFetch />
            </Suspense>
            <Suspense>
                <DiscountPage />
            </Suspense>
           <Suspense>
                <MoodBoardFetch />
            </Suspense>
                       <Suspense>
                <TopCollectionFetch />
            </Suspense>

                        <Suspense>
                <SpecialOfferFetch />
            </Suspense>
                                    <Suspense>
                <FindYourStyleFetch />
            </Suspense>
                                                <Suspense>
                <SuggestedLookFetch />
            </Suspense>
            <Suspense>
                <BrandStoryTellingFetch />
            </Suspense>
            <Suspense>
                <WomenSkincareFetch />
            </Suspense>
            <Suspense>
                <BlogsFetch />
            </Suspense>
        </>
    );
}

async function BannersFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getAllHomeShopByCategories();
    if (!brandProducts.length) return null;

    return <Landing banners={brandProducts} />;
}

async function ShopByCategoriesFetch() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!sbc.length) return null;

    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function ShopByNewCategoriesFetch() {
    const [sbc, sbcT] = await Promise.all([
        // homeShopByCategoryQueries.getAllHomeShopByCategories(),
        await WomenHomeSectionQueries.getAllexploreCategories()
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function ElevateYourLooksFetch() {
    const [sbc, sbcT] = await Promise.all([
        WomenHomeSectionQueries.getAllelavateLooks(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return <ElevateYourLooks shopByCategories={sbc} titleData={sbcT} />;
}
async function BlogsFetch() {
    const blogs = await blogQueries.getBlogs({
        isPublished: true,
        limit: 6,
        page: 1,
    });
    return <Blogs blogs={blogs.data} />;
}

// async function BannersFetch() {
//     const cachedBanners = await bannerCache.getAll();
//     if (!cachedBanners.length) return null;

//     const sorted = cachedBanners.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <Landing banners={sorted} />;
// }

async function WomenSkincareFetch() {
    const cachedBanners = await bannerCache.getAll();
    if (!cachedBanners.length) return null;

    const sorted = cachedBanners.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <WomenSkincare banners={sorted} />;
}

async function MiddleAnimationSectionFetch() {

        const brandProducts =
        await WomenHomeSectionQueries.getAlloutfitVarients();
    if (!brandProducts.length) return null;

    return <MiddleAnimationSection banners={brandProducts} />;

}

async function BrandStoryTellingFetch() {
    const cachedBanners = await bannerCache.getAll();
    if (!cachedBanners.length) return null;

    const sorted = cachedBanners.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <BrandStoryTelling banners={sorted} />;
}


async function NewCollectionMiddleFetch() {
      const brandProducts =
        await WomenHomeSectionQueries.getNewCollections();
    if (!brandProducts.length) return null;

    return <NewCollection banners={brandProducts} />;
}
async function SpecialOfferFetch() {
    const cachedBanners = await bannerCache.getAll();
    if (!cachedBanners.length) return null;

    const sorted = cachedBanners.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <SpecialOffer banners={sorted} />;
}

async function FindYourStyleFetch() {
    const advertisements = await advertisementQueries.getAllAdvertisements({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;

    return <FindYourStyle advertisements={advertisements} />;
}

// async function StyleDirectoryFetch() {
//     const cachedBanners = await bannerCache.getAll();
//     if (!cachedBanners.length) return null;

//     const sorted = cachedBanners.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <StyleDirectory banners={sorted} />;
// }

async function StyleDirectoryFetch() {
    const [sbc, sbcT] = await Promise.all([
        WomenHomeSectionQueries.getAllstyleDirectory(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return <StyleDirectory shopByCategories={sbc} titleData={sbcT} />;
}

async function SuggestedLookFetch() {
    const cachedBanners = await bannerCache.getAll();
    if (!cachedBanners.length) return null;

    const sorted = cachedBanners.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <SuggestedLook banners={sorted} />;
}

async function MarketingStripFetch() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;

    const sorted = cachedMarktingStrip.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <MarketingStrip marketingStrip={sorted} />;
}

async function DealMarketingStripFetch() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;

    const sorted = cachedMarktingStrip.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <DealofTheMonthStrip marketingStrip={sorted} />;
}

async function AdvertisementsFetch() {
    const advertisements = await advertisementQueries.getAllAdvertisements({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;

    return <AdvertisementPage advertisements={advertisements} />;
}

async function NewAdvertisementsFetch() {
    const advertisements = await advertisementQueries.getAllAdvertisements({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;

    return <AdvertisementDiscountPage advertisements={advertisements} />;
}

async function DiscountPage() {
    const advertisements = await WomenHomeSectionQueries.getNewOfferSections({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;

    return <DiscountOffer advertisements={advertisements} />;
}


async function MoodBoardFetch() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return <MoodboardItem moodboardItems={sbc} titleData={sbcT} />;
}

async function TopCollectionFetch() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    return <TopCollection collections={sbc} titleData={sbcT} />;
}
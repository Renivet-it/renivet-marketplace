import { AdvertisementPage, Blogs, BrandProducts, Landing, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { HomeAndLivingectionAdvertisement } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, productQueries, homeShopByCategoryQueries, homeShopByCategoryTitleQueries, WomenHomeSectionQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
import { Page as ElavateLooksPage } from "@/components/home/shop-slow";
import { Page as BrandCollaborate } from "@/components/home/types-of-brand-section";
import { ShopCategories } from "@/components/home/new-home-page/shop-by-category";
import { CuratedBanner } from "@/components/home/new-home-page/curated-banner";
import { BrandPromotion } from "@/components/home/new-home-page/brand-promotion";
import { MatchaBag } from "@/components/home/new-home-page/match-a-bag";
import { ConciousClick } from "@/components/home/new-home-page/concious-click";
import { SwapSpace } from "@/components/home/new-home-page/swap-space";
import { ArtisanCollection } from "@/components/home/new-home-page/artisan-space";
import { InstaBanner } from "@/components/home/new-home-page/insta-banner";

import { ProductGrid } from "@/components/home/new-home-page/kids-product-grid";
import { ProductGridNewArrivals } from "@/components/home/new-home-page/new-arrivals";

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
                <SustanableBatchFetch />
            </Suspense>
                                           <Suspense>
                <ShopCategoryFetch />
            </Suspense>
                            <Suspense>
                <BrandCollaborateFetch />
            </Suspense>
                            <Suspense>
                <DealMarketingStripFetch />
            </Suspense>

                               <Suspense>
                <CuratedBannerFetch />
            </Suspense>
                        <Suspense>
                <BrandProductsFetch />
            </Suspense>
                           <Suspense>
                <BrandPromotionFetch />
            </Suspense>
                                    <Suspense>
                <ProductNewArrivalsGridFetch />
            </Suspense>
                                 <Suspense>
                <NewAdvertisementsFetch />
            </Suspense>
                                  <Suspense>
                <ProductGridFetch />
            </Suspense>
                                       <Suspense>
                <MatchaBagFetch />
            </Suspense>
                                                  <Suspense>
                <ConciousClickBannerFetch />
            </Suspense>
                                                  <Suspense>
                <SwapSpaceBannerFetch />
            </Suspense>

                                                          <Suspense>
                <ArtisanCollectionFetch />
            </Suspense>

                                                          <Suspense>
                <InstaBannerFetch />
            </Suspense>
            {/* <Suspense>
                <ShopByNewCategoriesFetch />
            </Suspense> */}

   
            {/* <Suspense>
                <MarketingStripFetch />
            </Suspense> */}
            {/* <Suspense>
                <BlogsFetch />
            </Suspense> */}
        </>
    );
}

async function BrandProductsFetch() {
    const brandProducts =
        await homeBrandProductQueries.getAllHomeBrandProducts();
    if (!brandProducts.length) return null;

    return <BrandProducts brandProducts={brandProducts} />;
}


async function ProductNewArrivalsGridFetch() {
  const products = await productQueries.getHomePageFeaturedProducts();
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGridNewArrivals products={products} />;
}


async function ProductGridFetch() {
  const products = await productQueries.getKidsPageFeaturedProducts();
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGrid products={products} />;
}

async function CuratedBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageTrustedSections();
    if (!brandProducts.length) return null;

    return <CuratedBanner banners={brandProducts} />;
}

async function SwapSpaceBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageSwapBannerSections();
    if (!brandProducts.length) return null;

    return <SwapSpace banners={brandProducts} />;
}

async function ArtisanCollectionFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageNewArtisanSections();
    if (!brandProducts.length) return null;

    return <ArtisanCollection shopByCategories={brandProducts} />;
}

async function InstaBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageInsaBannerSections();
    if (!brandProducts.length) return null;

    return <InstaBanner banners={brandProducts} />;
}

async function ConciousClickBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageFirstConciousClickSections();
    if (!brandProducts.length) return null;

    return <ConciousClick banners={brandProducts} />;
}

async function BrandPromotionFetch() {
    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

        WomenHomeSectionQueries.getHomePageBrandIntroductionSections(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <BrandPromotion moodboardItems={sbc} titleData={sbcT} />;
}

async function MatchaBagFetch() {
    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

        WomenHomeSectionQueries.getHomePageMatchingSections(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <MatchaBag moodboardItems={sbc} titleData={sbcT} />;
}

async function SustanableBatchFetch() {
    //@ts-ignore

    return <ElavateLooksPage />;
}
async function ShopCategoryFetch() {
    //@ts-ignore

    return <ShopCategories />;
}
async function BrandCollaborateFetch() {
    //@ts-ignore

    return <BrandCollaborate />;
}
async function ShopByCategoriesFetch() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!sbc.length) return null;

    return <ShopByCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function ShopByNewCategoriesFetch() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    console.log("ShopByNewCategoriesFetch - sbc:", sbc); // Debug log
    if (!Array.isArray(sbc) || !sbc.length) {
        console.warn("ShopByNewCategoriesFetch: No categories found or invalid data", sbc);
        return null;
    }
    return <ShopByNewCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function BlogsFetch() {
    const blogs = await blogQueries.getBlogs({
        isPublished: true,
        limit: 6,
        page: 1,
    });
    return <Blogs blogs={blogs.data} />;
}

async function BannersFetch() {
    const cachedBanners = await bannerCache.getAll();
    if (!cachedBanners.length) return null;

    const sorted = cachedBanners.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <Landing banners={sorted} />;
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

    return <HomeAndLivingectionAdvertisement banners={advertisements} />;
}

// import {
//     AdvertisementPage,
//     Blogs,
//     BrandProducts,
//     Landing,
//     MarketingStrip,
//     ShopByCategories,
// } from "@/components/home";
// import {
//     advertisementQueries,
//     blogQueries,
//     homeBrandProductQueries,
//     homeShopByCategoryQueries,
//     homeShopByCategoryTitleQueries,
// } from "@/lib/db/queries";
// import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
// import { Suspense } from "react";

// export default function Page() {
//     return (
//         <>
//             <Suspense
//                 fallback={
//                     <div className="h-[calc(100vh-20vh)] w-full bg-background" />
//                 }
//             >
//                 <BannersFetch />
//             </Suspense>
//             <Suspense>
//                 <MarketingStripFetch />
//             </Suspense>
//             <Suspense>
//                 <AdvertisementsFetch />
//             </Suspense>
//             <Suspense>
//                 <BrandProductsFetch />
//             </Suspense>
//             <Suspense>
//                 <ShopByCategoriesFetch />
//             </Suspense>
//             {/* <Offer /> */}
//             {/* <Expectations /> */}
//             {/* <Popular title="Best Sellers" /> */}
//             {/* <Theme /> */}
//             {/* <Arrivals title="New Arrivals" /> */}
//             <Suspense>
//                 <BlogsFetch />
//             </Suspense>
//         </>
//     );
// }

// async function BrandProductsFetch() {
//     const brandProducts =
//         await homeBrandProductQueries.getAllHomeBrandProducts();
//     if (!brandProducts.length) return null;

//     return <BrandProducts brandProducts={brandProducts} />;
// }

// async function ShopByCategoriesFetch() {
//     const [sbc, sbcT] = await Promise.all([
//         homeShopByCategoryQueries.getAllHomeShopByCategories(),
//         homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
//     ]);
//     if (!sbc.length) return null;

//     return <ShopByCategories shopByCategories={sbc} titleData={sbcT} />;
// }

// async function BlogsFetch() {
//     const blogs = await blogQueries.getBlogs({
//         isPublished: true,
//         limit: 6,
//         page: 1,
//     });
//     return <Blogs blogs={blogs.data} />;
// }

// async function BannersFetch() {
//     const cachedBanners = await bannerCache.getAll();
//     if (!cachedBanners.length) return null;

//     const sorted = cachedBanners.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <Landing banners={sorted} />;
// }

// async function MarketingStripFetch() {
//     const cachedMarktingStrip = await marketingStripCache.getAll();
//     if (!cachedMarktingStrip.length) return null;

//     const sorted = cachedMarktingStrip.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <MarketingStrip marketingStrip={sorted} />;
// }

// async function AdvertisementsFetch() {
//     const advertisements = await advertisementQueries.getAllAdvertisements({
//         isPublished: true,
//         orderBy: "position",
//     });
//     if (!advertisements.length) return null;

//     return <AdvertisementPage advertisements={advertisements} />;
// }

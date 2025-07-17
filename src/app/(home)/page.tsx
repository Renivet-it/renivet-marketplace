import { AdvertisementPage, Blogs, BrandProducts, Landing, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, homeShopByCategoryQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
import { Page as ElavateLooksPage } from "@/components/home/shop-slow";
import { Page as BrandCollaborate } from "@/components/home/types-of-brand-section";
import { ShopCategories } from "@/components/home/new-home-page/shop-by-category";


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
                <BrandCollaborateFetch />
            </Suspense>
                               <Suspense>
                <ShopCategoryFetch />
            </Suspense>
            {/* <Suspense>
                <ShopByNewCategoriesFetch />
            </Suspense> */}
            <Suspense>
                <DealMarketingStripFetch />
            </Suspense>
                        {/* <Suspense>
                <NewAdvertisementsFetch />
            </Suspense> */}
            <Suspense>
                <MarketingStripFetch />
            </Suspense>
            <Suspense>
                <AdvertisementsFetch />
            </Suspense>
            <Suspense>
                <BrandProductsFetch />
            </Suspense>
            <Suspense>
                <ShopByCategoriesFetch />
            </Suspense>
            {/* <Offer /> */}
            {/* <Expectations /> */}
            {/* <Popular title="Best Sellers" /> */}
            {/* <Theme /> */}
            {/* <Arrivals title="New Arrivals" /> */}
            <Suspense>
                <BlogsFetch />
            </Suspense>
        </>
    );
}

async function BrandProductsFetch() {
    const brandProducts =
        await homeBrandProductQueries.getAllHomeBrandProducts();
    if (!brandProducts.length) return null;

    return <BrandProducts brandProducts={brandProducts} />;
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

    return <AdvertisementDiscountPage advertisements={advertisements} />;
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

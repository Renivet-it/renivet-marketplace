import { FloatingLoginButton } from "@/components/home/floating-login-button";
import { Landing } from "@/components/home/landing";
import {
    homeShopByCategoryQueries,
    homeShopByCategoryTitleQueries,
    productQueries,
    WomenHomeSectionQueries,
} from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import all below-the-fold components to reduce initial JS bundle
const BrandPromotion = dynamic(() =>
    import("@/components/home/new-home-page/brand-promotion").then((m) => ({
        default: m.BrandPromotion,
    }))
);
const BrandTypes = dynamic(() =>
    import("@/components/home/new-home-page/brand-types").then((m) => ({
        default: m.BrandTypes,
    }))
);
const CuratedBanner = dynamic(() =>
    import("@/components/home/new-home-page/curated-banner").then((m) => ({
        default: m.CuratedBanner,
    }))
);
const DealofTheMonthStrip = dynamic(() =>
    import("@/components/home/new-home-page/deal-of-month").then((m) => ({
        default: m.DealofTheMonthStrip,
    }))
);
const EffortlessElegance = dynamic(() =>
    import("@/components/home/new-home-page/effortless-section").then((m) => ({
        default: m.EffortlessElegance,
    }))
);
const EventSectionTwoBanner = dynamic(() =>
    import("@/components/home/new-home-page/event-section-two").then((m) => ({
        default: m.EventSectionTwoBanner,
    }))
);
const LoveThese = dynamic(() =>
    import("@/components/home/new-home-page/love-these").then((m) => ({
        default: m.LoveThese,
    }))
);
const MatchaBag = dynamic(() =>
    import("@/components/home/new-home-page/match-a-bag").then((m) => ({
        default: m.MatchaBag,
    }))
);
const MayAlsoLoveThese = dynamic(() =>
    import("@/components/home/new-home-page/may-also-love").then((m) => ({
        default: m.MayAlsoLoveThese,
    }))
);
const MobileBottom = dynamic(() =>
    import("@/components/home/new-home-page/mobile-bottom-product").then(
        (m) => ({ default: m.MobileBottom })
    )
);
const MobileCategories = dynamic(() =>
    import("@/components/home/new-home-page/mobile-categories").then((m) => ({
        default: m.MobileCategories,
    }))
);
const ProductGridNewArrivals = dynamic(() =>
    import("@/components/home/new-home-page/new-arrivals").then((m) => ({
        default: m.ProductGridNewArrivals,
    }))
);
const ShopCategories = dynamic(() =>
    import("@/components/home/new-home-page/shop-by-category").then((m) => ({
        default: m.ShopCategories,
    }))
);
const ShopByNewCategories = dynamic(() =>
    import("@/components/home/new-home-page/shop-by-new-category").then(
        (m) => ({ default: m.ShopByNewCategories })
    )
);
const SwapSpace = dynamic(() =>
    import("@/components/home/new-home-page/swap-space").then((m) => ({
        default: m.SwapSpace,
    }))
);
const SwipeCard = dynamic(() =>
    import("@/components/home/new-home-page/swipe-card").then((m) => ({
        default: m.SwipeCard,
    }))
);
const WelcomeRenivet = dynamic(() =>
    import("@/components/home/new-home-page/welcome-to-renivet").then((m) => ({
        default: m.WelcomeRenivet,
    }))
);

export default function Page() {
    return (
        <>
            <Suspense
                fallback={
                    <div className="h-[calc(100vh-20vh)] w-full bg-[#FCFBF4]" />
                }
            >
                <BannersFetch />
            </Suspense>

            <Suspense>
                <ShopCategoryFetch />
            </Suspense>
            <Suspense>
                <MobileCategoriesFetch />
            </Suspense>
            {/* <Suspense>
                <BrandTypesFetch />
            </Suspense> */}
            {/* <Suspense>
                <CuratedBannerFetch />
            </Suspense> */}
            <Suspense>
                <SwapSpaceBannerFetch />
            </Suspense>
            <Suspense>
                <LoveTheseFetch />
            </Suspense>
            <Suspense>
                <ProductNewArrivalsGridFetch />
            </Suspense>

            <Suspense>
                <ProductSwipeCardFetch />
            </Suspense>
            <Suspense>
                <EventSectionTwoBannerFetch />
            </Suspense>
            {/* <Suspense>
                <DealMarketingStripFetch />
            </Suspense> */}

            {/* <Suspense>
                <EffortlessEleganceFetch />
            </Suspense> */}
            {/* <Suspense>
                <ProductNewArrivalsGridFetch />
            </Suspense> */}
            <Suspense>
                <MayAlsoLoveTheseFetch />
            </Suspense>

            {/* <Suspense>
                <MatchaBagFetch />
            </Suspense> */}
            {/* <Suspense>
                <LoveTheseFetch />
            </Suspense> */}

            <Suspense>
                <WelcomeToRenivetFetch />
            </Suspense>
            <Suspense>
                <BrandPromotionFetch />
            </Suspense>
            {/* <Suspense>
                <HomePageMainProductFetch />
            </Suspense> */}

            <div className="hidden md:block">
                <Suspense>
                    <ShopByNewCategoriesFetch />
                </Suspense>
            </div>

            <FloatingLoginButton />
        </>
    );
}

async function ProductNewArrivalsGridFetch() {
    const products = await productQueries.getHomePageFeaturedProducts();
    if (!products.length) return null;
    //@ts-ignore
    return <ProductGridNewArrivals products={products} />;
}

async function ProductSwipeCardFetch() {
    const products = await productQueries.getHomePageFeaturedProducts();
    if (!products.length) return null;
    //@ts-ignore
    return <SwipeCard products={products} />;
}

async function EventSectionTwoBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageEventTwoSections();
    if (!brandProducts.length) return null;

    return <EventSectionTwoBanner banners={brandProducts} />;
}

async function CuratedBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageTrustedSections();
    if (!brandProducts.length) return null;

    return <CuratedBanner banners={brandProducts} />;
}

async function SwapSpaceBannerFetch() {
    const brandProducts = await productQueries.getHomeHeroProducts();
    if (!brandProducts.length) return null;

    return <SwapSpace banners={brandProducts} />;
}

async function LoveTheseFetch() {
    const brandProducts = await productQueries.getHomeLoveTheseProducts();
    if (!brandProducts.length) return null;

    return <LoveThese banners={brandProducts} />;
}

async function HomePageMainProductFetch() {
    const brandProducts = await productQueries.getHomePageProducts();
    if (!brandProducts.length) return null;

    return <MobileBottom banners={brandProducts} />;
}

async function MayAlsoLoveTheseFetch() {
    const brandProducts = await productQueries.getHomeYouMayAlsoLikeProducts();
    if (!brandProducts.length) return null;

    return <MayAlsoLoveThese banners={brandProducts} />;
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

async function EffortlessEleganceFetch() {
    const [sbc, sbcT] = await Promise.all([
        //@ts-ignore
        WomenHomeSectionQueries.getHomePageEffortlessEleganceSections(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore
    return <EffortlessElegance moodboardItems={sbc} titleData={sbcT} />;
}

async function ShopCategoryFetch() {
    //@ts-ignore
    return <ShopCategories />;
}

async function BrandTypesFetch() {
    //@ts-ignore
    return <BrandTypes />;
}

async function MobileCategoriesFetch() {
    //@ts-ignore
    return <MobileCategories />;
}

async function WelcomeToRenivetFetch() {
    //@ts-ignore
    return <WelcomeRenivet />;
}

async function ShopByNewCategoriesFetch() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        console.warn(
            "ShopByNewCategoriesFetch: No categories found or invalid data",
            sbc
        );
        return null;
    }
    return <ShopByNewCategories shopByCategories={sbc} titleData={sbcT} />;
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

async function DealMarketingStripFetch() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;

    const sorted = cachedMarktingStrip.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <DealofTheMonthStrip marketingStrip={sorted} />;
}

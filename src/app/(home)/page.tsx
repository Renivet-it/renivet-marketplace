import { FloatingLoginButton } from "@/components/home/floating-login-button";
import { Landing } from "@/components/home/landing";
import {
    homeShopByCategoryQueries,
    homeShopByCategoryTitleQueries,
    productQueries,
    WomenHomeSectionQueries,
} from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { getAbsoluteURL } from "@/lib/utils";
import type { Metadata } from "next";
import { Leaf, Lock, RefreshCcw, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Renivet | Sustainable Marketplace for Quality Products",
    description:
        "Renivet is India's sustainable online marketplace connecting conscious consumers with high-quality, eco-friendly brands. Discover verified sellers, transparent pricing, and responsibly sourced products.",
    alternates: {
        canonical: getAbsoluteURL("/"),
    },
    openGraph: {
        title: "Renivet | Sustainable Marketplace for Quality Products",
        description:
            "Shop responsibly with Renivet — your trusted sustainable marketplace featuring eco-conscious brands, verified sellers, and ethically sourced products.",
        url: getAbsoluteURL("/"),
        type: "website",
    },
};

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
const ProductsUnder999 = dynamic(() =>
    import("@/components/home/new-home-page/products-under-999").then(
        (m) => ({
            default: m.ProductsUnder999,
        })
    )
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

const ScrollReveal = dynamic(() =>
    import("@/components/ui/scroll-reveal").then((m) => ({
        default: m.ScrollReveal,
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

            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <ShopCategoryFetch />
            </Suspense> */}
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <MobileCategoriesFetch />
            </Suspense>
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <BrandTypesFetch />
            </Suspense> */}
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <CuratedBannerFetch />
            </Suspense> */}
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <SwapSpaceBannerFetch />
            </Suspense>
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <ProductsUnder999Fetch />
            </Suspense>
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <LoveTheseFetch />
            </Suspense>

            {/* Mobile-only Trust Badges Marquee */}
            <div className="block w-full overflow-hidden bg-[#E4EDF7] md:hidden">
                <style>
                    {`
                        @keyframes trustBadgesMarquee {
                            0% { transform: translateX(0%); }
                            100% { transform: translateX(-50%); }
                        }
                    `}
                </style>
                <div
                    style={{
                        display: "inline-flex",
                        whiteSpace: "nowrap",
                        gap: "40px",
                        padding: "6px 0",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "#000",
                        animation: "trustBadgesMarquee 25s linear infinite",
                    }}
                >
                    {Array.from({ length: 8 }).map((_, i) => (
                        <span key={i} className="flex items-center gap-[24px]">
                            <span className="flex items-center gap-1.5">
                                <Leaf className="h-3.5 w-3.5 text-emerald-700" />
                                Verified Sustainable Brands
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1.5">
                                <RefreshCcw className="h-3.5 w-3.5 text-blue-700" />
                                Easy Returns
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-slate-800" />
                                Secure Payments
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5 text-amber-700" />
                                Free Shipping
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5 text-amber-900" />
                                Pan‑India Delivery
                            </span>
                            <span className="text-gray-400">•</span>
                        </span>
                    ))}
                </div>
            </div>

            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <ProductNewArrivalsGridFetch />
            </Suspense>

            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <ProductSwipeCardFetch />
            </Suspense>
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <EventSectionTwoBannerFetch />
            </Suspense>
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <DealMarketingStripFetch />
            </Suspense> */}

            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <EffortlessEleganceFetch />
            </Suspense> */}
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <ProductNewArrivalsGridFetch />
            </Suspense> */}
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <MayAlsoLoveTheseFetch />
            </Suspense>

            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <MatchaBagFetch />
            </Suspense> */}
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <LoveTheseFetch />
            </Suspense> */}

            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <WelcomeToRenivetFetch />
            </Suspense>
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <BrandPromotionFetch />
            </Suspense>
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <HomePageMainProductFetch />
            </Suspense> */}

            <div className="hidden md:block">
                <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
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
    return (
        <ScrollReveal>
            <ProductGridNewArrivals products={products} />
        </ScrollReveal>
    );
}

async function ProductSwipeCardFetch() {
    const products = await productQueries.getHomePageFeaturedProducts();
    if (!products.length) return null;
    return (
        <ScrollReveal>
            <SwipeCard products={products} />
        </ScrollReveal>
    );
}

async function EventSectionTwoBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageEventTwoSections();
    if (!brandProducts.length) return null;

    return (
        <ScrollReveal>
            <EventSectionTwoBanner banners={brandProducts} />
        </ScrollReveal>
    );
}

async function CuratedBannerFetch() {
    const brandProducts =
        await WomenHomeSectionQueries.getHomePageTrustedSections();
    if (!brandProducts.length) return null;

    return (
        <ScrollReveal>
            <CuratedBanner banners={brandProducts} />
        </ScrollReveal>
    );
}

async function SwapSpaceBannerFetch() {
    const brandProducts = await productQueries.getHomeHeroProducts();
    if (!brandProducts.length) return null;

    return (
        <ScrollReveal>
            <SwapSpace banners={brandProducts} />
        </ScrollReveal>
    );
}

async function LoveTheseFetch() {
    const brandProducts = await productQueries.getHomeLoveTheseProducts();
    if (!brandProducts.length) return null;

    return (
        <ScrollReveal>
            <LoveThese banners={brandProducts} />
        </ScrollReveal>
    );
}

async function ProductsUnder999Fetch() {
    const products = await productQueries.getHomeProductsUnder999();
    if (!products.length) return null;

    return (
        <ScrollReveal>
            <ProductsUnder999 products={products} />
        </ScrollReveal>
    );
}

async function HomePageMainProductFetch() {
    const brandProducts = await productQueries.getHomePageProducts();
    if (!brandProducts.length) return null;

    return (
        <ScrollReveal>
            <MobileBottom banners={brandProducts} />
        </ScrollReveal>
    );
}

async function MayAlsoLoveTheseFetch() {
    const brandProducts = await productQueries.getHomeYouMayAlsoLikeProducts();
    if (!brandProducts.length) return null;

    return (
        <ScrollReveal>
            <MayAlsoLoveThese banners={brandProducts} />
        </ScrollReveal>
    );
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
    return (
        <ScrollReveal>
            <BrandPromotion moodboardItems={sbc} titleData={sbcT} />
        </ScrollReveal>
    );
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
    return (
        <ScrollReveal>
            <MatchaBag moodboardItems={sbc} titleData={sbcT} />
        </ScrollReveal>
    );
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
    return (
        <ScrollReveal>
            <EffortlessElegance moodboardItems={sbc} titleData={sbcT} />
        </ScrollReveal>
    );
}

async function ShopCategoryFetch() {
    return (
        <ScrollReveal>
            <ShopCategories />
        </ScrollReveal>
    );
}

async function BrandTypesFetch() {
    return (
        <ScrollReveal>
            <BrandTypes />
        </ScrollReveal>
    );
}

async function MobileCategoriesFetch() {
    return (
        <ScrollReveal>
            <MobileCategories />
        </ScrollReveal>
    );
}

async function WelcomeToRenivetFetch() {
    return (
        <ScrollReveal>
            <WelcomeRenivet />
        </ScrollReveal>
    );
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
    return (
        <ScrollReveal>
            <ShopByNewCategories shopByCategories={sbc} titleData={sbcT} />
        </ScrollReveal>
    );
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

    return (
        <ScrollReveal>
            <DealofTheMonthStrip marketingStrip={sorted} />
        </ScrollReveal>
    );
}

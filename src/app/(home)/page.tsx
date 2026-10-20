import { EmailCompletionCard } from "@/components/auth/email-completion-card";
import { FloatingLoginButton } from "@/components/home/floating-login-button";
import { Landing } from "@/components/home/landing";
import { DiscoverPrompt } from "@/components/home/new-home-page/discover-prompt";
import { siteConfig } from "@/config/site";
import {
    blogQueries,
    homeShopByCategoryTitleQueries,
    productQueries,
    WomenHomeSectionQueries,
} from "@/lib/db/queries";
import {
    bannerCache,
    brandCache,
    marketingStripCache,
} from "@/lib/redis/methods";
import { getAbsoluteURL } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
    Leaf,
    Lock,
    Package,
    RefreshCcw,
    ShieldCheck,
    Star,
    Truck,
} from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { cache, Suspense } from "react";

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
        images: [
            {
                ...siteConfig.og,
                alt: "Renivet - Sustainable Marketplace",
            },
        ],
    },
};

// Dynamically import all below-the-fold components to reduce initial JS bundle
const Blogs = dynamic(() =>
    import("@/components/home/blogs").then((m) => ({
        default: m.Blogs,
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
const MostPopularProducts = dynamic(() =>
    import("@/components/home/new-home-page/most-popular-products").then(
        (m) => ({
            default: m.MostPopularProducts,
        })
    )
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
const SwapSpace = dynamic(() =>
    import("@/components/home/new-home-page/swap-space").then((m) => ({
        default: m.SwapSpace,
    }))
);
const RenivetEdit = dynamic(() =>
    import("@/components/home/new-home-page/renivet-edit").then((m) => ({
        default: m.RenivetEdit,
    }))
);
const HowRenivetCurates = dynamic(() =>
    import("@/components/home/new-home-page/how-renivet-curates").then((m) => ({
        default: m.HowRenivetCurates,
    }))
);
const ThoughtfulProducts = dynamic(() =>
    import("@/components/home/new-home-page/thoughtful-products").then((m) => ({
        default: m.ThoughtfulProducts,
    }))
);
const FeaturedBrands = dynamic(() =>
    import("@/components/home/new-home-page/featured-brands").then((m) => ({
        default: m.FeaturedBrands,
    }))
);
const FeaturedBrandsEditorial = dynamic(() =>
    import("@/components/home/new-home-page/featured-brands-editorial").then(
        (m) => ({ default: m.FeaturedBrandsEditorial })
    )
);
const RenivetCircleSignup = dynamic(() =>
    import("@/components/home/renivet-circle-signup").then((m) => ({
        default: m.RenivetCircleSignup,
    }))
);
const BotanicalBanner = dynamic(() =>
    import("@/components/home/new-home-page/botanical-banner").then((m) => ({
        default: m.BotanicalBanner,
    }))
);
const ScrollReveal = dynamic(() =>
    import("@/components/ui/scroll-reveal").then((m) => ({
        default: m.ScrollReveal,
    }))
);

export default async function Page() {
    const { userId } = await auth();

    return (
        <main className="min-h-screen bg-[#FAF7F2] [&_section]:bg-[#FAF7F2] [&_h1]:!text-[#3E2127] [&_h2]:!text-[#3E2127] [&_h3]:!text-[#3E2127] [&_h4]:!text-[#3E2127] [&_h5]:!text-[#3E2127] [&_h6]:!text-[#3E2127]">
            <h1 className="sr-only">Renivet Sustainable Marketplace</h1>
            <EmailCompletionCard />
            <ScrollReveal className="w-full">
                <Suspense
                fallback={
                    <div className="h-[calc(100vh-20vh)] w-full bg-white" />
                }
                >
                    <BannersFetch />
                </Suspense>
            </ScrollReveal>
            <ScrollReveal className="w-full">
                <TrustBadgesMarquee />
            </ScrollReveal>
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <ShopCategoryFetch />
            </Suspense> */}
            {/* Temporarily hidden from the home page per the current UI direction. */}
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <BrandTypesFetch />
            </Suspense> */}
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <CuratedBannerFetch />
            </Suspense> */}
            <Suspense
                fallback={
                    <div className="h-[200px] w-full animate-pulse bg-gray-50 md:h-[400px]" />
                }
            >
                <SwapSpaceBannerFetch />
            </Suspense>
            <ScrollReveal className="w-full">
                <Suspense
                fallback={
                    <div className="h-[320px] w-full animate-pulse bg-[#f8f5ef] md:h-[360px]" />
                }
                >
                    <RenivetEdit />
                </Suspense>
            </ScrollReveal>
            <ScrollReveal className="w-full">
                <Suspense
                fallback={
                    <div className="h-[370px] w-full animate-pulse bg-[#f8f5ef] md:h-[460px]" />
                }
                >
                    <HowRenivetCurates />
                </Suspense>
            </ScrollReveal>
            <ScrollReveal className="w-full">
                <Suspense
                fallback={
                    <div className="h-[560px] w-full animate-pulse bg-[#f8f5ef] md:h-[390px]" />
                }
                >
                    <ThoughtfulProducts />
                </Suspense>
            </ScrollReveal>
            <ScrollReveal className="w-full">
                <Suspense
                fallback={
                    <div className="h-[380px] w-full animate-pulse bg-[#FAF7F2] md:hidden" />
                }
                >
                    <FeaturedBrandsEditorial />
                </Suspense>
            </ScrollReveal>
            <ScrollReveal className="w-full">
                <Suspense
                fallback={
                    <div className="h-[150px] w-full animate-pulse bg-[#f8f5ef] md:h-[190px]" />
                }
                >
                    <FeaturedBrandsFetch />
                </Suspense>
            </ScrollReveal>
            <ScrollReveal className="w-full">
                <Suspense
                fallback={
                    <div className="h-[224px] w-full animate-pulse bg-[#f8f5ef] md:h-[400px]" />
                }
                >
                    <BotanicalBannerFetch />
                </Suspense>
            </ScrollReveal>
            {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50" />}>
                <LoveTheseFetch />
            </Suspense> */}

            {/* Mobile-only Trust Badges Marquee */}
            <div className="hidden w-full overflow-hidden bg-[#61333D] md:hidden">
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
                        color: "#fff",
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

            <Suspense
                fallback={
                    <div className="h-[200px] w-full animate-pulse bg-gray-50 md:h-[400px]" />
                }
            >
                <ProductNewArrivalsGridFetch />
            </Suspense>
            {userId ? (
                <ScrollReveal className="w-full">
                    <DiscoverPrompt />
                </ScrollReveal>
            ) : null}
            <Suspense
                fallback={
                    <div className="h-[200px] w-full animate-pulse bg-gray-50 md:h-[400px]" />
                }
            >
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
            <ScrollReveal className="w-full">
                <Suspense
                    fallback={
                        <div className="h-[200px] w-full animate-pulse bg-gray-50 md:h-[400px]" />
                    }
                >
                    <BlogsFetch />
                </Suspense>
            </ScrollReveal>
            <ScrollReveal className="w-full">
                <RenivetCircleSignup />
            </ScrollReveal>

            <FloatingLoginButton />
        </main>
    );
}

function TrustBadgesMarquee() {
    const badges = [
        { label: "50+ Vetted Brands", icon: Star },
        { label: "Every Seller Audited", icon: ShieldCheck },
        { label: "Plastic-Conscious Packaging", icon: Package },
        { label: "Easy Returns", icon: RefreshCcw },
    ];

    return (
        <div className="block w-full border-y border-[#c9aaa8] bg-[#ead8d5]">
            <div className="grid min-h-[102px] grid-cols-4 items-center px-2 py-4 text-center text-[10px] font-medium leading-[1.25] text-[#3E2127] md:min-h-[82px] md:px-16 md:py-3 md:text-[11px]">
                {badges.map(({ label, icon: Icon }) => (
                    <div key={label} className="flex min-w-0 flex-col items-center gap-2 px-1 md:gap-1.5">
                        <Icon aria-hidden="true" className="size-5 stroke-[1.5] md:size-4" />
                        <span className="max-w-[82px] md:max-w-none">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

async function ProductNewArrivalsGridFetch() {
    const [featuredProducts, loveTheseProducts] = await Promise.all([
        productQueries.getHomePageFeaturedProducts(),
        productQueries.getHomeLoveTheseProducts(),
    ]);

    const mappedLoveThese = loveTheseProducts.map((item) => ({
        ...item,
        category: "Basic Collection",
    }));

    const products = [...featuredProducts, ...mappedLoveThese];

    if (!products.length) return null;
    return (
        <ScrollReveal>
            <ProductGridNewArrivals products={products as any} />
        </ScrollReveal>
    );
}

async function MostPopularProductsFetch({ userId }: { userId?: string }) {
    try {
        const products = await productQueries.getMostPopularProducts({
            limit: 30,
            days: 30,
        });

        if (!products.length) return null;
        const safeProducts = JSON.parse(JSON.stringify(products));

        return (
            <ScrollReveal>
                <MostPopularProducts products={safeProducts} userId={userId} />
            </ScrollReveal>
        );
    } catch (error) {
        console.error("MostPopularProductsFetch failed:", error);
        return null;
    }
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

const getActiveStorefrontBrands = cache(async () => {
    return await brandCache
        .getAll()
        .then((items) =>
            items
                .filter((brand) => brand.isActive)
                .map(({ id, name, slug, logoUrl }) => ({
                    id,
                    name,
                    slug,
                    logoUrl: logoUrl || null,
                }))
        )
        .catch(() => []);
});

async function FeaturedBrandsFetch() {
    const brands = await getActiveStorefrontBrands();

    if (!brands.length) return null;
    return <FeaturedBrands brands={brands} />;
}

async function BotanicalBannerFetch() {
    const brands = await getActiveStorefrontBrands();

    return <BotanicalBanner brands={brands} />;
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

async function BlogsFetch() {
    const blogs = await blogQueries.getBlogs({
        isPublished: true,
        limit: 6,
        page: 1,
    });
    if (!blogs.data?.length) return null;
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

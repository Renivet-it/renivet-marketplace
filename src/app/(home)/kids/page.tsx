export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { Landing } from "@/components/home/kids/banner";
import { DiscountOffer } from "@/components/home/kids/discount-offer";
import { ExploreCategories } from "@/components/home/kids/explore-categories";
import { SpecialCare } from "@/components/home/kids/special-care";
import { DollBanner } from "@/components/home/kids/doll-banner";
import { TwiningSection } from "@/components/home/kids/twining-section";
import { ProductGrid } from "@/components/home/kids/product-grid";
import { Page as ElavateLooksPage } from "@/components/home/kids/elavate-looks";
import {
  fetchBanners,
  fetchSustainableBatch,
  fetchExploreCategory,
  fetchSpecialCare,
  fetchDiscountOffer,
  fetchDollBanner,
  fetchKidTwining,
  fetchProductGrid,
} from "@/actions/kids";

export default async function Page() {

  
    return (
    <>
{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BannersSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ExploreCategorySection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SpecialCareSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ProductGridSection /></Suspense>        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SustainableBatchSection /></Suspense>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><DollBannerSection /></Suspense> */}{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><DiscountOfferSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><KidTwiningSection /></Suspense>
    </>
  );
}

async function BannersSection() {
    const banners = await fetchBanners();
    if (!banners) return null;
    return ( <Landing banners={banners} /> );
}


async function SustainableBatchSection() {
    const sustainableBatch = await fetchSustainableBatch();
    if (!sustainableBatch) return null;
    return ( <ScrollReveal><ElavateLooksPage /></ScrollReveal> );
}


async function ExploreCategorySection() {
    const exploreCategory = await fetchExploreCategory();
    if (!exploreCategory) return null;
    return ( ( <ScrollReveal><ExploreCategories shopByCategories={exploreCategory.shopByCategories} titleData={exploreCategory.titleData} /></ScrollReveal>  ) );
}


async function SpecialCareSection() {
    const specialCare = await fetchSpecialCare();
    if (!specialCare) return null;
    return ( <ScrollReveal><SpecialCare banners={specialCare} /></ScrollReveal> );
}


async function DiscountOfferSection() {
    const discountOffer = await fetchDiscountOffer();
    if (!discountOffer) return null;
    return ( <ScrollReveal><DiscountOffer advertisements={discountOffer} /></ScrollReveal> );
}


async function DollBannerSection() {
    const dollBanner = await fetchDollBanner();
    if (!dollBanner) return null;
    return ( <ScrollReveal><DollBanner banners={dollBanner} /></ScrollReveal> );
}


async function KidTwiningSection() {
    const kidTwining = await fetchKidTwining();
    if (!kidTwining) return null;
    return ( <ScrollReveal><TwiningSection banners={kidTwining} /></ScrollReveal> );
}


async function ProductGridSection() {
    const productGrid = await fetchProductGrid();
    if (!productGrid) return null;
    return ( <ScrollReveal><ProductGrid products={productGrid} /></ScrollReveal> );
}

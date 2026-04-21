export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { Landing } from "@/components/home/beauty-personal/banner";
import { BeautyCareSection } from "@/components/home/beauty-personal/beauty-care";
import { BestSellerBanner } from "@/components/home/beauty-personal/best-seller-banner";
import { DiscountOffer } from "@/components/home/beauty-personal/discount-banner";
import { ExploreCategories } from "@/components/home/beauty-personal/explore-categories";
import { MindFullStarter } from "@/components/home/beauty-personal/mindful-starter";
import { NurtureBanner } from "@/components/home/beauty-personal/nurture-banner";
import { SkinQuizBanner } from "@/components/home/beauty-personal/skin-quiz";
import { SkinCareBanner } from "@/components/home/beauty-personal/skincare-banner";
import { ProductGrid } from "@/components/home/beauty-personal/product-grid";
import { ProductGridNewArrivals } from "@/components/home/beauty-personal/product-new-arrival";
import { Page as ElavateLooksPage } from "@/components/home/beauty-personal/elavate-looks";
import {
  fetchBanners,
  fetchSustainableBatch,
  fetchExploreCategory,
  fetchBeautySkinCareBanner,
  fetchNurtureBanner,
  fetchBeautyDiscount,
  fetchBestSellerBanner,
  fetchBeautyMindful,
  fetchBeautySkinQuiz,
  fetchBeautyCareRoutine,
  fetchProductGridTopPicks,
  fetchProductGridNewArrivals,
} from "@/actions/beauty";

export default async function Page() {

  
    return (
    <>
{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BannersSection /></Suspense>        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ExploreCategorySection /></Suspense>        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BeautySkinCareBannerSection /></Suspense>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BeautyCareRoutineSection /></Suspense> */}        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ProductGridTopPicksSection /></Suspense>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ProductGridNewArrivalsSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><NurtureBannerSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BeautyDiscountSection /></Suspense> */}        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BestSellerBannerSection /></Suspense>        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BeautyMindfulSection /></Suspense>        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SustainableBatchSection /></Suspense>

      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BeautySkinQuizSection /></Suspense> */}
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


async function BeautySkinCareBannerSection() {
    const beautySkinCareBanner = await fetchBeautySkinCareBanner();
    if (!beautySkinCareBanner) return null;
    return ( <ScrollReveal><SkinCareBanner banners={beautySkinCareBanner} /></ScrollReveal> );
}


async function NurtureBannerSection() {
    const nurtureBanner = await fetchNurtureBanner();
    if (!nurtureBanner) return null;
    return ( <ScrollReveal><NurtureBanner banners={nurtureBanner} /></ScrollReveal> );
}


async function BeautyDiscountSection() {
    const beautyDiscount = await fetchBeautyDiscount();
    if (!beautyDiscount) return null;
    return ( <ScrollReveal><DiscountOffer advertisements={beautyDiscount} /></ScrollReveal> );
}


async function BestSellerBannerSection() {
    const bestSellerBanner = await fetchBestSellerBanner();
    if (!bestSellerBanner) return null;
    return ( <ScrollReveal><BestSellerBanner banners={bestSellerBanner} /></ScrollReveal> );
}


async function BeautyMindfulSection() {
    const beautyMindful = await fetchBeautyMindful();
    if (!beautyMindful) return null;
    return ( <ScrollReveal><MindFullStarter banners={beautyMindful} /></ScrollReveal> );
}


async function BeautySkinQuizSection() {
    const beautySkinQuiz = await fetchBeautySkinQuiz();
    if (!beautySkinQuiz) return null;
    return ( <ScrollReveal><SkinQuizBanner banners={beautySkinQuiz} /></ScrollReveal> );
}


async function BeautyCareRoutineSection() {
    const beautyCareRoutine = await fetchBeautyCareRoutine();
    if (!beautyCareRoutine) return null;
    return ( <ScrollReveal><BeautyCareSection shopByCategories={beautyCareRoutine} /></ScrollReveal> );
}


async function ProductGridTopPicksSection() {
    const productGridTopPicks = await fetchProductGridTopPicks();
    if (!productGridTopPicks) return null;
    return ( <ScrollReveal><ProductGrid products={productGridTopPicks} /></ScrollReveal> );
}


async function ProductGridNewArrivalsSection() {
    const productGridNewArrivals = await fetchProductGridNewArrivals();
    if (!productGridNewArrivals) return null;
    return ( <ScrollReveal><ProductGridNewArrivals products={productGridNewArrivals} /></ScrollReveal> );
}

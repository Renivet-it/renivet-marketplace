export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { Landing } from "@/components/home/home-and-living/banner";
import { NewCollection } from "@/components/home/home-and-living/new-collection";
import { ExploreCategories } from "@/components/home/home-and-living/explore-categories";
import { MiddleBannerSection } from "@/components/home/home-and-living/middle-banner";
import { EcoBannerSection as EcoBannerSectionComponent } from "@/components/home/home-and-living/eco-banner";
import { BrandSection } from "@/components/home/home-and-living/brand-section";
import { ProductGrid } from "@/components/home/home-and-living/product-grid";
import { ProductGridNewArrivals } from "@/components/home/home-and-living/product-new-arrival";
import { FeaturesSection as ElevateLooksPage } from "@/components/home/home-and-living/icons-section";
import { CurateConcious } from "@/components/home/home-and-living/curate-concious";
import {
  fetchBanners,
  fetchSustainableBatch,
  fetchExploreCategory,
  fetchNewCollection,
  fetchMiddleBanner,
  fetchEcoBanner,
  fetchBrandSection,
  fetchCurateSection,
  fetchProductGridTopPicks,
  fetchProductGridNewArrivals,
} from "@/actions/home-living";

export default async function Page() {

  
    return (
    <>
{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BannersSection /></Suspense>        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ExploreCategorySection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><NewCollectionSection /></Suspense>        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ProductGridTopPicksSection /></Suspense>        {/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><CurateSectionSection /></Suspense>        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SustainableBatchSection /></Suspense>

      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ProductGridNewArrivalsSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><MiddleBannerSectionServerWrapper /></Suspense>        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><EcoBannerSection /></Suspense> */}        {/*@ts-ignore*/}
          <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BrandSectionSection /></Suspense>
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
    return ( <ScrollReveal><ElevateLooksPage /></ScrollReveal> );
}


async function ExploreCategorySection() {
    const exploreCategory = await fetchExploreCategory();
    if (!exploreCategory) return null;
    return ( ( <ScrollReveal><ExploreCategories shopByCategories={exploreCategory.shopByCategories} titleData={exploreCategory.titleData} /></ScrollReveal>  ) );
}


async function NewCollectionSection() {
    const newCollection = await fetchNewCollection();
    if (!newCollection) return null;
    return ( <ScrollReveal><NewCollection banners={newCollection} /></ScrollReveal> );
}


async function MiddleBannerSectionServerWrapper() {
    const middleBanner = await fetchMiddleBanner();
    if (!middleBanner) return null;
    return ( <ScrollReveal><MiddleBannerSection banners={middleBanner} /></ScrollReveal> );
}


async function EcoBannerSection() {
    const ecoBanner = await fetchEcoBanner();
    if (!ecoBanner) return null;
    return ( <ScrollReveal><EcoBannerSectionComponent banners={ecoBanner} /></ScrollReveal> );
}


async function BrandSectionSection() {
    const brandSection = await fetchBrandSection();
    if (!brandSection) return null;
    return ( <ScrollReveal><BrandSection banners={brandSection} /></ScrollReveal> );
}


async function CurateSectionSection() {
    const curateSection = await fetchCurateSection();
    if (!curateSection) return null;
    return ( <ScrollReveal><CurateConcious banners={curateSection} /></ScrollReveal> );
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

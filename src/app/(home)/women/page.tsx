export const dynamic = "force-dynamic";
import { AdvertisementPage, Blogs, MarketingStrip } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
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
import { WomenBrandProducts } from "@/components/home/women/brand-products";
import { BrandStoryTelling } from "@/components/home/women/brand-storytelling";
import { WomenSkincare } from "@/components/home/women/women-glowing-skincare";
import { ProductGrid } from "@/components/home/women/product-grid";
import { StyleWithSubstance } from "@/components/home/women/style-with-substance";
import { GetReadySection } from "@/components/home/women/get-ready-style";
import { GetNewDiscountCollection } from "@/components/home/women/new-discount-collection";
import {
  fetchBanners, fetchStyleWithSubstance, fetchProductGrid, fetchShopByCategories, fetchShopByNewCategories,
  fetchElevateYourLooks, fetchBlogs, fetchBrandProducts, fetchWomenSkincare, fetchMiddleAnimationSection,
  fetchBrandStoryTelling, fetchNewCollectionMiddle, fetchSpecialOffer, fetchFindYourStyle, fetchGetReady,
  fetchNewCollectionDiscount, fetchStyleDirectory, fetchSuggestedLook, fetchMarketingStrip, fetchDealMarketingStrip,
  fetchAdvertisements, fetchNewAdvertisements, fetchDiscountPage, fetchMoodBoard, fetchTopCollection
} from "@/actions/women";
import { Suspense } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default async function Page() {
return (
    <>
{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BannersSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ShopByNewCategoriesSection /></Suspense>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ElevateYourLooksSection /></Suspense> */}{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><MiddleAnimationSectionSection /></Suspense>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><StyleDirectorySection /></Suspense> */}{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><StyleWithSubstanceSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><MoodBoardSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><DiscountPageSection /></Suspense>

      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><TopCollectionSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><NewCollectionDiscountSection /></Suspense> */}{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><GetReadyFetchSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SpecialOfferSection /></Suspense>

      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SuggestedLookSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><NewCollectionMiddleSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BrandStoryTellingSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><FindYourStyleSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BrandProductsSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><WomenSkincareSection /></Suspense> */}
      <div className="block md:hidden">{/*@ts-ignore*/}
          <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ProductGridSection /></Suspense>
      </div>
    </>
  );
}

async function BannersSection() {
    const banners = await fetchBanners();
    if (!banners) return null;
    return ( <Landing banners={banners} /> );
}


async function StyleWithSubstanceSection() {
    const styleWithSubstance = await fetchStyleWithSubstance();
    if (!styleWithSubstance) return null;
    return ( <ScrollReveal><StyleWithSubstance products={styleWithSubstance} /></ScrollReveal> );
}


async function ProductGridSection() {
    const productGrid = await fetchProductGrid();
    if (!productGrid) return null;
    return ( <ScrollReveal><ProductGrid products={productGrid} /></ScrollReveal> );
}


async function ShopByNewCategoriesSection() {
    const shopByNewCategories = await fetchShopByNewCategories();
    if (!shopByNewCategories) return null;
    return ( ( <ScrollReveal><ExploreCategories shopByCategories={shopByNewCategories.shopByCategories} titleData={shopByNewCategories.titleData} /></ScrollReveal>  ) );
}


async function ElevateYourLooksSection() {
    const elevateYourLooks = await fetchElevateYourLooks();
    if (!elevateYourLooks) return null;
    return ( ( <ScrollReveal><ElevateYourLooks shopByCategories={elevateYourLooks.shopByCategories} titleData={elevateYourLooks.titleData} /></ScrollReveal>  ) );
}


async function BrandProductsSection() {
    const brandProducts = await fetchBrandProducts();
    if (!brandProducts) return null;
    return ( <ScrollReveal><WomenBrandProducts brandProducts={brandProducts} /></ScrollReveal> );
}


async function WomenSkincareSection() {
    const womenSkincare = await fetchWomenSkincare();
    if (!womenSkincare) return null;
    return ( <ScrollReveal><WomenSkincare banners={womenSkincare} /></ScrollReveal> );
}


async function MiddleAnimationSectionSection() {
    const middleAnimationSection = await fetchMiddleAnimationSection();
    if (!middleAnimationSection) return null;
    return ( <ScrollReveal><MiddleAnimationSection banners={middleAnimationSection} /></ScrollReveal> );
}


async function BrandStoryTellingSection() {
    const brandStoryTelling = await fetchBrandStoryTelling();
    if (!brandStoryTelling) return null;
    return ( <ScrollReveal><BrandStoryTelling banners={brandStoryTelling} /></ScrollReveal> );
}


async function NewCollectionMiddleSection() {
    const newCollectionMiddle = await fetchNewCollectionMiddle();
    if (!newCollectionMiddle) return null;
    return ( <ScrollReveal><NewCollection banners={newCollectionMiddle} /></ScrollReveal> );
}


async function SpecialOfferSection() {
    const specialOffer = await fetchSpecialOffer();
    if (!specialOffer) return null;
    return ( <ScrollReveal><SpecialOffer banners={specialOffer} /></ScrollReveal> );
}


async function FindYourStyleSection() {
    const findYourStyle = await fetchFindYourStyle();
    if (!findYourStyle) return null;
    return ( <ScrollReveal><FindYourStyle advertisements={findYourStyle} /></ScrollReveal> );
}


async function GetReadyFetchSection() {
    const getReady = await fetchGetReady();
    if (!getReady) return null;
    return ( <ScrollReveal><GetReadySection banners={getReady} /></ScrollReveal> );
}


async function NewCollectionDiscountSection() {
    const newCollectionDiscount = await fetchNewCollectionDiscount();
    if (!newCollectionDiscount) return null;
    return ( <ScrollReveal><GetNewDiscountCollection banners={newCollectionDiscount} /></ScrollReveal> );
}


async function StyleDirectorySection() {
    const styleDirectory = await fetchStyleDirectory();
    if (!styleDirectory) return null;
    return ( <ScrollReveal><StyleDirectory shopByCategories={styleDirectory.shopByCategories} titleData={styleDirectory.titleData} /></ScrollReveal> );
}


async function SuggestedLookSection() {
    const suggestedLook = await fetchSuggestedLook();
    if (!suggestedLook) return null;
    return ( <ScrollReveal><SuggestedLook banners={suggestedLook} /></ScrollReveal> );
}


async function DiscountPageSection() {
    const discountPage = await fetchDiscountPage();
    if (!discountPage) return null;
    return ( <ScrollReveal><DiscountOffer advertisements={discountPage} /></ScrollReveal> );
}


async function MoodBoardSection() {
    const moodBoard = await fetchMoodBoard();
    if (!moodBoard) return null;
    return ( ( <ScrollReveal><MoodboardItem moodboardItems={moodBoard.moodboardItems} titleData={moodBoard.titleData} /></ScrollReveal>  ) );
}


async function TopCollectionSection() {
    const topCollection = await fetchTopCollection();
    if (!topCollection) return null;
    return ( ( <ScrollReveal><TopCollection collections={topCollection.collections} titleData={topCollection.titleData} /></ScrollReveal>  ) );
}

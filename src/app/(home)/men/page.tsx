export const dynamic = "force-dynamic";
import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { Suspense } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Landing } from "@/components/home/men/banner";
import { ExploreCategories } from "@/components/home/men/explore-categories";
import { ElevateYourLooks } from "@/components/home/men/elavate-looks";
import { MiddleAnimationSection } from "@/components/home/men/middle-animation-banner";
import { StyleDirectory } from "@/components/home/men/style-directory";
import { NewCollection } from "@/components/home/men/new-collection";
import { DiscountOffer } from "@/components/home/men/discount-offer";
import { TopCollection } from "@/components/home/men/top-collection";
import { SpecialOffer } from "@/components/home/men/special-offer";
import { SuggestedLook } from "@/components/home/men/suggested-looks";
import { ProductGrid } from "@/components/home/men/product-grid";
import { TopCollectionBanner } from "@/components/home/men/top-collection.-banner";
import { StyleWithSubstance } from "@/components/home/men/style-substance";
import { FreshInkCollection } from "@/components/home/men/fresh-ink-collection";
import { MoodboardItemMen } from "@/components/home/men/moodboard";
import { WomenBrandProducts } from "@/components/home/women/brand-products";
import {
  fetchBanners, fetchBrandProducts, fetchMoodBoardMen, fetchMenFreshCollection,
  fetchShopByNewCategories, fetchProductGrid, fetchElevateYourLooks, fetchBlogs,
  fetchMiddleAnimationSection, fetchTopCollectionBanner, fetchNewCollectionMiddle,
  fetchSpecialOffer, fetchStyleDirectory, fetchSuggestedLook, fetchStyleWithSubstance,
  fetchDiscountPage, fetchTopCollection
} from "@/actions/men";

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
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><MoodBoardMenSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><TopCollectionBannerSection /></Suspense>{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><MenFreshCollectionSection /></Suspense>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><DiscountPageSection /></Suspense> */}{/*@ts-ignore*/}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><TopCollectionSection /></Suspense>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SpecialOfferSection /></Suspense> */}
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><SuggestedLookSection /></Suspense>        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BrandProductsSection /></Suspense>        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><NewCollectionMiddleSection /></Suspense> */}
      <div className="block md:hidden">{/*@ts-ignore*/}
          <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><ProductGridSection /></Suspense>
      </div>
      {/* }>
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}><BlogsSection /></Suspense> */}
    </>
  );
}

async function BannersSection() {
    const banners = await fetchBanners();
    if (!banners) return null;
    return ( <Landing banners={banners} /> );
}


async function BrandProductsSection() {
    const brandProducts = await fetchBrandProducts();
    if (!brandProducts) return null;
    return ( <ScrollReveal><WomenBrandProducts brandProducts={brandProducts} /></ScrollReveal> );
}


async function MoodBoardMenSection() {
    const moodBoardMen = await fetchMoodBoardMen();
    if (!moodBoardMen) return null;
    return ( <ScrollReveal><MoodboardItemMen moodboardItems={moodBoardMen.moodboardItems} titleData={moodBoardMen.titleData} /></ScrollReveal> );
}


async function MenFreshCollectionSection() {
    const menFreshCollection = await fetchMenFreshCollection();
    if (!menFreshCollection) return null;
    return ( <ScrollReveal><FreshInkCollection banners={menFreshCollection} /></ScrollReveal> );
}


async function ShopByNewCategoriesSection() {
    const shopByNewCategories = await fetchShopByNewCategories();
    if (!shopByNewCategories) return null;
    return ( <ScrollReveal><ExploreCategories shopByCategories={shopByNewCategories.shopByCategories} titleData={shopByNewCategories.titleData} /></ScrollReveal> );
}


async function ProductGridSection() {
    const productGrid = await fetchProductGrid();
    if (!productGrid) return null;
    return ( <ScrollReveal><ProductGrid products={productGrid} /></ScrollReveal> );
}


async function ElevateYourLooksSection() {
    const elevateYourLooks = await fetchElevateYourLooks();
    if (!elevateYourLooks) return null;
    return ( <ScrollReveal><ElevateYourLooks shopByCategories={elevateYourLooks.shopByCategories} titleData={elevateYourLooks.titleData} /></ScrollReveal> );
}


async function BlogsSection() {
    const blogs = await fetchBlogs();
    if (!blogs) return null;
    return ( <ScrollReveal><Blogs blogs={blogs} /></ScrollReveal> );
}


async function MiddleAnimationSectionSection() {
    const middleAnimationSection = await fetchMiddleAnimationSection();
    if (!middleAnimationSection) return null;
    return ( <ScrollReveal><MiddleAnimationSection banners={middleAnimationSection} /></ScrollReveal> );
}


async function TopCollectionBannerSection() {
    const topCollectionBanner = await fetchTopCollectionBanner();
    if (!topCollectionBanner) return null;
    return ( <ScrollReveal><TopCollectionBanner advertisements={topCollectionBanner} /></ScrollReveal> );
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


async function StyleWithSubstanceSection() {
    const styleWithSubstance = await fetchStyleWithSubstance();
    if (!styleWithSubstance) return null;
    return ( <ScrollReveal><StyleWithSubstance products={styleWithSubstance} /></ScrollReveal> );
}


async function DiscountPageSection() {
    const discountPage = await fetchDiscountPage();
    if (!discountPage) return null;
    return ( <ScrollReveal><DiscountOffer advertisements={discountPage} /></ScrollReveal> );
}


async function TopCollectionSection() {
    const topCollection = await fetchTopCollection();
    if (!topCollection) return null;
    return ( <ScrollReveal><TopCollection collections={topCollection.collections} titleData={topCollection.titleData} /></ScrollReveal> );
}

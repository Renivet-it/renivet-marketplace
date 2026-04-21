"use client";


import { useQuery } from "@tanstack/react-query";
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

export default function Page() {
  const { data: banners } = useQuery({ queryKey: ["banners"], queryFn: fetchBanners });
  const { data: styleWithSubstance } = useQuery({ queryKey: ["styleWithSubstance"], queryFn: fetchStyleWithSubstance });
  const { data: productGrid } = useQuery({ queryKey: ["productGrid"], queryFn: fetchProductGrid });
  const { data: shopByCategories } = useQuery({ queryKey: ["shopByCategories"], queryFn: fetchShopByCategories });
  const { data: shopByNewCategories } = useQuery({ queryKey: ["shopByNewCategories"], queryFn: fetchShopByNewCategories });
  const { data: elevateYourLooks } = useQuery({ queryKey: ["elevateYourLooks"], queryFn: fetchElevateYourLooks });
  const { data: blogs } = useQuery({ queryKey: ["blogs"], queryFn: fetchBlogs });
  const { data: brandProducts } = useQuery({ queryKey: ["brandProducts"], queryFn: fetchBrandProducts });
  const { data: womenSkincare } = useQuery({ queryKey: ["womenSkincare"], queryFn: fetchWomenSkincare });
  const { data: middleAnimationSection } = useQuery({ queryKey: ["middleAnimationSection"], queryFn: fetchMiddleAnimationSection });
  const { data: brandStoryTelling } = useQuery({ queryKey: ["brandStoryTelling"], queryFn: fetchBrandStoryTelling });
  const { data: newCollectionMiddle } = useQuery({ queryKey: ["newCollectionMiddle"], queryFn: fetchNewCollectionMiddle });
  const { data: specialOffer } = useQuery({ queryKey: ["specialOffer"], queryFn: fetchSpecialOffer });
  const { data: findYourStyle } = useQuery({ queryKey: ["findYourStyle"], queryFn: fetchFindYourStyle });
  const { data: getReady } = useQuery({ queryKey: ["getReady"], queryFn: fetchGetReady });
  const { data: newCollectionDiscount } = useQuery({ queryKey: ["newCollectionDiscount"], queryFn: fetchNewCollectionDiscount });
  const { data: styleDirectory } = useQuery({ queryKey: ["styleDirectory"], queryFn: fetchStyleDirectory });
  const { data: suggestedLook } = useQuery({ queryKey: ["suggestedLook"], queryFn: fetchSuggestedLook });
  const { data: marketingStrip } = useQuery({ queryKey: ["marketingStrip"], queryFn: fetchMarketingStrip });
  const { data: dealMarketingStrip } = useQuery({ queryKey: ["dealMarketingStrip"], queryFn: fetchDealMarketingStrip });
  const { data: advertisements } = useQuery({ queryKey: ["advertisements"], queryFn: fetchAdvertisements });
  const { data: newAdvertisements } = useQuery({ queryKey: ["newAdvertisements"], queryFn: fetchNewAdvertisements });
  const { data: discountPage } = useQuery({ queryKey: ["discountPage"], queryFn: fetchDiscountPage });
  const { data: moodBoard } = useQuery({ queryKey: ["moodBoard"], queryFn: fetchMoodBoard });
  const { data: topCollection } = useQuery({ queryKey: ["topCollection"], queryFn: fetchTopCollection });

  return (
    <>
      <Suspense fallback={<div className="h-[calc(100vh-20vh)] w-full bg-background" />}>
{/*@ts-ignore*/}
        {banners && <ScrollReveal><Landing banners={banners} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {shopByNewCategories && ( <ScrollReveal><ExploreCategories shopByCategories={shopByNewCategories.shopByCategories} titleData={shopByNewCategories.titleData} /></ScrollReveal> )}
      </Suspense>
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {elevateYourLooks && ( <ScrollReveal><ElevateYourLooks shopByCategories={elevateYourLooks.shopByCategories} titleData={elevateYourLooks.titleData} /></ScrollReveal> )}
      </Suspense> */}
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {middleAnimationSection && <ScrollReveal><MiddleAnimationSection banners={middleAnimationSection} /></ScrollReveal>}
      </Suspense>
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {styleDirectory && ( <ScrollReveal><StyleDirectory shopByCategories={styleDirectory.shopByCategories} titleData={styleDirectory.titleData} /></ScrollReveal> )}
      </Suspense> */}
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {styleWithSubstance && <ScrollReveal><StyleWithSubstance products={styleWithSubstance} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {moodBoard && ( <ScrollReveal><MoodboardItem moodboardItems={moodBoard.moodboardItems} titleData={moodBoard.titleData} /></ScrollReveal> )}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {discountPage && <ScrollReveal><DiscountOffer advertisements={discountPage} /></ScrollReveal>}
      </Suspense>

      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {topCollection && ( <ScrollReveal><TopCollection collections={topCollection.collections} titleData={topCollection.titleData} /></ScrollReveal> )}
      </Suspense> */}
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {newCollectionDiscount && <ScrollReveal><GetNewDiscountCollection banners={newCollectionDiscount} /></ScrollReveal>}
      </Suspense> */}
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {getReady && <ScrollReveal><GetReadySection banners={getReady} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {specialOffer && <ScrollReveal><SpecialOffer banners={specialOffer} /></ScrollReveal>}
      </Suspense>

      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {suggestedLook && <ScrollReveal><SuggestedLook banners={suggestedLook} /></ScrollReveal>}
      </Suspense> */}
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {newCollectionMiddle && <ScrollReveal><NewCollection banners={newCollectionMiddle} /></ScrollReveal>}
      </Suspense> */}
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {brandStoryTelling && <ScrollReveal><BrandStoryTelling banners={brandStoryTelling} /></ScrollReveal>}
      </Suspense> */}
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {findYourStyle && <ScrollReveal><FindYourStyle advertisements={findYourStyle} /></ScrollReveal>}
      </Suspense> */}
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {brandProducts && <ScrollReveal><WomenBrandProducts brandProducts={brandProducts} /></ScrollReveal>}
      </Suspense> */}
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {womenSkincare && <ScrollReveal><WomenSkincare banners={womenSkincare} /></ScrollReveal>}
      </Suspense> */}
      <div className="block md:hidden">
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
          {productGrid && <ScrollReveal><ProductGrid products={productGrid} /></ScrollReveal>}
        </Suspense>
      </div>
    </>
  );
}
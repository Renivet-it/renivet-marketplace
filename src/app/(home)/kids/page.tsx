"use client";
// export const revalidate = 60;


// import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
// import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
// import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
// import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
// import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
// import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
// import { Suspense } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
// import { Landing } from "@/components/home/kids/banner";
// import { DiscountOffer } from "@/components/home/kids/discount-offer";
// import { ExploreCategories } from "@/components/home/kids/explore-categories";
// import { SpecialCare } from "@/components/home/kids/special-care";
// import { DollBanner } from "@/components/home/kids/doll-banner";
// import { TwiningSection } from "@/components/home/kids/twining-section";
// import { ProductGrid } from "@/components/home/kids/product-grid";
// import { Page as ElavateLooksPage } from "@/components/home/kids/elavate-looks";
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
//                         <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <ExploreCategoryFetch />
//             </Suspense>

//                         <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <SpecialCareSection />
//             </Suspense>
//                                           <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <SustanableBatchFetch />
//             </Suspense>
//                               <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                     <DollBannerSection />
//                   </Suspense>
//                                                <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <DiscountOfferSectionFetch />
//             </Suspense>
//                           <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <ProductGridFetch />
//               </Suspense>

//                                                 <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                     <KidTwiningFetch />
//                   </Suspense>

//         </>
//     );
// }

// async function BannersFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getKidsBannerSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <Landing banners={brandProducts} />;
// }

// async function SustanableBatchFetch() {
//     //@ts-ignore

//     return <ElavateLooksPage />;
// }

// async function ExploreCategoryFetch() {
//     //@ts-ignore
//     const [sbc, sbcT] = await Promise.all([
//         // homeShopByCategoryQueries.getAllHomeShopByCategories(),
//     //@ts-ignore
//        WomenHomeSectionQueries.getKidsExploreCategorySections()
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore
//     return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
// }

// async function SpecialCareSection() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getKidsCareSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <SpecialCare banners={brandProducts} />;
// }
// async function DiscountOfferSectionFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getkidDiscountOfferSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <DiscountOffer advertisements={brandProducts} />;
// }
// async function DollBannerSection() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getkidDollBuyingSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <DollBanner banners={brandProducts} />;
// }
// async function KidTwiningFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getkidDolllTwiningSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <TwiningSection banners={brandProducts} />;
// }
// async function ProductGridFetch() {
//   const products = await productQueries.getKidsPageFeaturedProducts();
//   if (!products.length) return null;
//     //@ts-ignore
//   return <ProductGrid products={products} />;
// }


// async function ShopByNewCategoriesFetch() {
//     //@ts-ignore
//     const [sbc, sbcT] = await Promise.all([
//         // homeShopByCategoryQueries.getAllHomeShopByCategories(),
//     //@ts-ignore
//        WomenHomeSectionQueries.getMenExploreCategorySections()
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore
//     return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
// }





import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
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

export default function Page() {
  const { data: banners, error: bannersError } = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
    staleTime: 1000 * 60, // Cache for 60 seconds
  });
  const { data: sustainableBatch, error: sustainableBatchError } = useQuery({
    queryKey: ["sustainableBatch"],
    queryFn: fetchSustainableBatch,
    staleTime: 1000 * 60,
  });
  const { data: exploreCategory, error: exploreCategoryError } = useQuery({
    queryKey: ["exploreCategory"],
    queryFn: fetchExploreCategory,
    staleTime: 1000 * 60,
  });
  const { data: specialCare, error: specialCareError } = useQuery({
    queryKey: ["specialCare"],
    queryFn: fetchSpecialCare,
    staleTime: 1000 * 60,
  });
  const { data: discountOffer, error: discountOfferError } = useQuery({
    queryKey: ["discountOffer"],
    queryFn: fetchDiscountOffer,
    staleTime: 1000 * 60,
  });
  const { data: dollBanner, error: dollBannerError } = useQuery({
    queryKey: ["dollBanner"],
    queryFn: fetchDollBanner,
    staleTime: 1000 * 60,
  });
  const { data: kidTwining, error: kidTwiningError } = useQuery({
    queryKey: ["kidTwining"],
    queryFn: fetchKidTwining,
    staleTime: 1000 * 60,
  });
  const { data: productGrid, error: productGridError } = useQuery({
    queryKey: ["productGrid"],
    queryFn: fetchProductGrid,
    staleTime: 1000 * 60,
  });

  // Basic error handling
  if (bannersError) return <div>Error loading banners: {bannersError.message}</div>;
  if (sustainableBatchError) return <div>Error loading sustainable batch: {sustainableBatchError.message}</div>;
  if (exploreCategoryError) return <div>Error loading explore category: {exploreCategoryError.message}</div>;
  if (specialCareError) return <div>Error loading special care: {specialCareError.message}</div>;
  if (discountOfferError) return <div>Error loading discount offer: {discountOfferError.message}</div>;
  if (dollBannerError) return <div>Error loading doll banner: {dollBannerError.message}</div>;
  if (kidTwiningError) return <div>Error loading kid twining: {kidTwiningError.message}</div>;
  if (productGridError) return <div>Error loading product grid: {productGridError.message}</div>;

  return (
    <>
      <Suspense fallback={<div className="h-[calc(100vh-20vh)] w-full bg-background" />}>

{/*@ts-ignore*/}
        {banners && <ScrollReveal><Landing banners={banners} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {exploreCategory && ( <ScrollReveal><ExploreCategories shopByCategories={exploreCategory.shopByCategories} titleData={exploreCategory.titleData} /></ScrollReveal> )}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {specialCare && <ScrollReveal><SpecialCare banners={specialCare} /></ScrollReveal>}
      </Suspense>
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {productGrid && <ScrollReveal><ProductGrid products={productGrid} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {sustainableBatch && <ScrollReveal><ElavateLooksPage /></ScrollReveal>}
      </Suspense>
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {dollBanner && <ScrollReveal><DollBanner banners={dollBanner} /></ScrollReveal>}
      </Suspense> */}
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {discountOffer && <ScrollReveal><DiscountOffer advertisements={discountOffer} /></ScrollReveal>}
      </Suspense>

      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
{/*@ts-ignore*/}
        {kidTwining && <ScrollReveal><TwiningSection banners={kidTwining} /></ScrollReveal>}
      </Suspense>
    </>
  );
}
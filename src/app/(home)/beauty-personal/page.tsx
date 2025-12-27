// export const revalidate = 60;


// import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
// import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
// import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
// import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
// import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
// import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
// import { Suspense } from "react";
// import { Landing } from "@/components/home/beauty-personal/banner";
// import { BeautyCareSection } from "@/components/home/beauty-personal/beauty-care";
// import { BestSellerBanner } from "@/components/home/beauty-personal/best-seller-banner";
// import { DiscountOffer } from "@/components/home/beauty-personal/discount-banner";
// import { ExploreCategories } from "@/components/home/beauty-personal/explore-categories";
// import { MindFullStarter } from "@/components/home/beauty-personal/mindful-starter";
// import { NurtureBanner } from "@/components/home/beauty-personal/nurture-banner";
// import { SkinQuizBanner } from "@/components/home/beauty-personal/skin-quiz";
// import { SkinCareBanner } from "@/components/home/beauty-personal/skincare-banner";
// import { ProductGrid } from "@/components/home/beauty-personal/product-grid";
// import { ProductGridNewArrivals } from "@/components/home/beauty-personal/product-new-arrival";
// import { Page as ElavateLooksPage } from "@/components/home/beauty-personal/elavate-looks";


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
//                         <Suspense>
//                 <ExploreCategoryFetch />
//             </Suspense>

//                         <Suspense>
//                 <BeautySkinCareBanner />
//             </Suspense>

//                         <Suspense>
//                 <BeautyCareRoutineFetch />
//             </Suspense>


//                                      <Suspense>
//                 <ProductGridFetchNewArrivals />
//               </Suspense>
//                                                            <Suspense>
//                 <NurtureBannerFetch />
//             </Suspense>
//                               <Suspense>
//                     <BeautyDiscountFetch />
//                   </Suspense>
//                        <Suspense>
//                 <BestSellerBannnerFetch />
//             </Suspense>
//                        <Suspense>
//                 <BeautyMindFulFetch />
//             </Suspense>
//                                                    <Suspense>
//                             <SustanableBatchFetch />
//                         </Suspense>
//                                                               <Suspense>
//                 <ProductGridFetchTopPicks />
//               </Suspense>
//                        <Suspense>
//                 <BeautySkinQuizFetch />
//             </Suspense>
//         </>
//     );
// }

// async function BannersFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautyPersonalSections();
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
//        WomenHomeSectionQueries.getBeautyExploreCategorySections()
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore
//     return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
// }

// async function BeautySkinCareBanner() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautySkinBannerSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <SkinCareBanner banners={brandProducts} />;
// }
// async function NurtureBannerFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautyNurtureSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <NurtureBanner banners={brandProducts} />;
// }
// async function BeautyDiscountFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautyDiscountSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <DiscountOffer advertisements={brandProducts} />;
// }

// async function BestSellerBannnerFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautyBestSellerSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <BestSellerBanner banners={brandProducts} />;
// }

// async function BeautyMindFulFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautyMindFulSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <MindFullStarter banners={brandProducts} />;
// }

// async function BeautySkinQuizFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautySkinQuizections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <SkinQuizBanner banners={brandProducts} />;
// }



// async function BeautyCareRoutineFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.getBeautyCareRoutinetions();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <BeautyCareSection shopByCategories={brandProducts} />;
// }
// async function ProductGridFetchTopPicks() {
//   const products = await productQueries.getBeautyTopPicks();
//   if (!products.length) return null;
//     //@ts-ignore
//   return <ProductGrid products={products} />;
// }

// async function ProductGridFetchNewArrivals() {
//   const products = await productQueries.getBeautyNewArrivals();
//   if (!products.length) return null;
//     //@ts-ignore
//   return <ProductGridNewArrivals products={products} />;
// }



"use client";

import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
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
  const { data: beautySkinCareBanner, error: beautySkinCareBannerError } = useQuery({
    queryKey: ["beautySkinCareBanner"],
    queryFn: fetchBeautySkinCareBanner,
    staleTime: 1000 * 60,
  });
  const { data: nurtureBanner, error: nurtureBannerError } = useQuery({
    queryKey: ["nurtureBanner"],
    queryFn: fetchNurtureBanner,
    staleTime: 1000 * 60,
  });
  const { data: beautyDiscount, error: beautyDiscountError } = useQuery({
    queryKey: ["beautyDiscount"],
    queryFn: fetchBeautyDiscount,
    staleTime: 1000 * 60,
  });
  const { data: bestSellerBanner, error: bestSellerBannerError } = useQuery({
    queryKey: ["bestSellerBanner"],
    queryFn: fetchBestSellerBanner,
    staleTime: 1000 * 60,
  });
  const { data: beautyMindful, error: beautyMindfulError } = useQuery({
    queryKey: ["beautyMindful"],
    queryFn: fetchBeautyMindful,
    staleTime: 1000 * 60,
  });
  const { data: beautySkinQuiz, error: beautySkinQuizError } = useQuery({
    queryKey: ["beautySkinQuiz"],
    queryFn: fetchBeautySkinQuiz,
    staleTime: 1000 * 60,
  });
  const { data: beautyCareRoutine, error: beautyCareRoutineError } = useQuery({
    queryKey: ["beautyCareRoutine"],
    queryFn: fetchBeautyCareRoutine,
    staleTime: 1000 * 60,
  });
  const { data: productGridTopPicks, error: productGridTopPicksError } = useQuery({
    queryKey: ["productGridTopPicks"],
    queryFn: fetchProductGridTopPicks,
    staleTime: 1000 * 60,
  });
  const { data: productGridNewArrivals, error: productGridNewArrivalsError } = useQuery({
    queryKey: ["productGridNewArrivals"],
    queryFn: fetchProductGridNewArrivals,
    staleTime: 1000 * 60,
  });

  // Basic error handling
  if (bannersError) return <div>Error loading banners: {bannersError.message}</div>;
  if (sustainableBatchError) return <div>Error loading sustainable batch: {sustainableBatchError.message}</div>;
  if (exploreCategoryError) return <div>Error loading explore category: {exploreCategoryError.message}</div>;
  if (beautySkinCareBannerError) return <div>Error loading skin care banner: {beautySkinCareBannerError.message}</div>;
  if (nurtureBannerError) return <div>Error loading nurture banner: {nurtureBannerError.message}</div>;
  if (beautyDiscountError) return <div>Error loading discount: {beautyDiscountError.message}</div>;
  if (bestSellerBannerError) return <div>Error loading best seller banner: {bestSellerBannerError.message}</div>;
  if (beautyMindfulError) return <div>Error loading mindful starter: {beautyMindfulError.message}</div>;
  if (beautySkinQuizError) return <div>Error loading skin quiz: {beautySkinQuizError.message}</div>;
  if (beautyCareRoutineError) return <div>Error loading care routine: {beautyCareRoutineError.message}</div>;
  if (productGridTopPicksError) return <div>Error loading top picks: {productGridTopPicksError.message}</div>;
  if (productGridNewArrivalsError) return <div>Error loading new arrivals: {productGridNewArrivalsError.message}</div>;

  return (
    <>
      <Suspense fallback={<div className="h-[calc(100vh-20vh)] w-full bg-background" />}>
        {/*@ts-ignore*/}
        {banners && <Landing banners={banners} />}
      </Suspense>
      <Suspense>
        {/*@ts-ignore*/}
        {exploreCategory && ( <ExploreCategories shopByCategories={exploreCategory.shopByCategories} titleData={exploreCategory.titleData} />
        )}
      </Suspense>
      <Suspense>
        {/*@ts-ignore*/}
        {beautySkinCareBanner && <SkinCareBanner banners={beautySkinCareBanner} />}
      </Suspense>
      {/* <Suspense>
        {beautyCareRoutine && <BeautyCareSection shopByCategories={beautyCareRoutine} />}
      </Suspense> */}
            <Suspense>
        {/*@ts-ignore*/}
        {productGridTopPicks && <ProductGrid products={productGridTopPicks} />}
      </Suspense>
      {/* <Suspense>
        {productGridNewArrivals && <ProductGridNewArrivals products={productGridNewArrivals} />}
      </Suspense> */}
      {/* <Suspense>
        {nurtureBanner && <NurtureBanner banners={nurtureBanner} />}
      </Suspense> */}
      {/* <Suspense>
        {beautyDiscount && <DiscountOffer advertisements={beautyDiscount} />}
      </Suspense> */}
      <Suspense>
        {/*@ts-ignore*/}
        {bestSellerBanner && <BestSellerBanner banners={bestSellerBanner} />}
      </Suspense>
      <Suspense>
        {/*@ts-ignore*/}
        {beautyMindful && <MindFullStarter banners={beautyMindful} />}
      </Suspense>
      <Suspense>
        {sustainableBatch && <ElavateLooksPage />}
      </Suspense>

      {/* <Suspense>
        {beautySkinQuiz && <SkinQuizBanner banners={beautySkinQuiz} />}
      </Suspense> */}
    </>
  );
}
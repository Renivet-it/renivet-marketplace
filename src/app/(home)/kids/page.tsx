// export const revalidate = 60;


// import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
// import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
// import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
// import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
// import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
// import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
// import { Suspense } from "react";
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
//                         <Suspense>
//                 <ExploreCategoryFetch />
//             </Suspense>

//                         <Suspense>
//                 <SpecialCareSection />
//             </Suspense>
//                                           <Suspense>
//                 <SustanableBatchFetch />
//             </Suspense>
//                               <Suspense>
//                     <DollBannerSection />
//                   </Suspense>
//                                                <Suspense>
//                 <DiscountOfferSectionFetch />
//             </Suspense>
//                           <Suspense>
//                 <ProductGridFetch />
//               </Suspense>

//                                                 <Suspense>
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




"use client";

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
        {banners && <Landing banners={banners} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {exploreCategory && ( <ExploreCategories shopByCategories={exploreCategory.shopByCategories} titleData={exploreCategory.titleData} />
        )}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {specialCare && <SpecialCare banners={specialCare} />}
      </Suspense>
      <Suspense>
        {sustainableBatch && <ElavateLooksPage />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {dollBanner && <DollBanner banners={dollBanner} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {discountOffer && <DiscountOffer advertisements={discountOffer} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {productGrid && <ProductGrid products={productGrid} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {kidTwining && <TwiningSection banners={kidTwining} />}
      </Suspense>
    </>
  );
}
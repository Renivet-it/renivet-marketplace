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
// import { Landing } from "@/components/home/home-and-living/banner";
// import { NewCollection } from "@/components/home/home-and-living/new-collection";
// import { ExploreCategories } from "@/components/home/home-and-living/explore-categories";
// import { MiddleBannerSection } from "@/components/home/home-and-living/middle-banner";
// import { EcoBannerSection as EcoBannerSectionComponent } from "@/components/home/home-and-living/eco-banner";
// import { BrandSection } from "@/components/home/home-and-living/brand-section";
// import { ProductGrid } from "@/components/home/home-and-living/product-grid";
// import { ProductGridNewArrivals } from "@/components/home/home-and-living/product-new-arrival";
// import { FeaturesSection as ElavateLooksPage } from "@/components/home/home-and-living/icons-section";
// import { CurateConcious } from "@/components/home/home-and-living/curate-concious";

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
//                 <NewCollectionSection />
//             </Suspense>

//                         <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <CurateSectionFetch />
//             </Suspense>

//                                           <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <SustanableBatchFetch />
//             </Suspense>
//                                       <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <ProductGridFetchTopPicks />
//               </Suspense>
//                                      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <ProductGridFetchNewArrivals />
//               </Suspense>
//                                                            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <MiddleBannerFetch />
//             </Suspense>
//                               <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                     <EcoBannerSection />
//                   </Suspense>

// <div className="pb-10">
//                                                 <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                     <BrandSectionFetch />
//                   </Suspense>
//                   </div>
//                        {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <TopCollectionBannerFecth />
//             </Suspense> */}


//             <div className="block md:hidden"> {/* Hidden on md and larger screens */}

//             </div>
//             {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
//                 <BlogsFetch />
//             </Suspense> */}
//         </>
//     );
// }

// async function BannersFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingSections();
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
//         WomenHomeSectionQueries.gethomeAndLivingCategoryExploreSections()
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore
//     return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
// }

// async function NewCollectionSection() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingNewCollectionSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <NewCollection banners={brandProducts} />;
// }
// async function MiddleBannerFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingBannerMiddleSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <MiddleBannerSection banners={brandProducts} />;
// }
// async function EcoBannerSection() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingEcoBanners();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <EcoBannerSectionComponent banners={brandProducts} />;
// }
// async function BrandSectionFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingBrandSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <BrandSection banners={brandProducts} />;
// }
// async function CurateSectionFetch() {
//     //@ts-ignore
//     const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingCurateConciousSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <CurateConcious banners={brandProducts} />;
// }
// async function ProductGridFetchTopPicks() {
//   const products = await productQueries.getHomeAndLivingTopPicks();
//   if (!products.length) return null;
//     //@ts-ignore
//   return <ProductGrid products={products} />;
// }

// async function ProductGridFetchNewArrivals() {
//   const products = await productQueries.getHomeAndLivingNewArrivals();
//   if (!products.length) return null;
//     //@ts-ignore
//   return <ProductGridNewArrivals products={products} />;
// }


// async function ShopByNewCategoriesFetch() {
//     //@ts-ignore
//     const [sbc, sbcT] = await Promise.all([
//         // homeShopByCategoryQueries.getAllHomeShopByCategories(),
//     //@ts-ignore
//         WomenHomeSectionQueries.getMenExploreCategorySections()
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
  const { data: newCollection, error: newCollectionError } = useQuery({
    queryKey: ["newCollection"],
    queryFn: fetchNewCollection,
    staleTime: 1000 * 60,
  });
  const { data: middleBanner, error: middleBannerError } = useQuery({
    queryKey: ["middleBanner"],
    queryFn: fetchMiddleBanner,
    staleTime: 1000 * 60,
  });
  const { data: ecoBanner, error: ecoBannerError } = useQuery({
    queryKey: ["ecoBanner"],
    queryFn: fetchEcoBanner,
    staleTime: 1000 * 60,
  });
  const { data: brandSection, error: brandSectionError } = useQuery({
    queryKey: ["brandSection"],
    queryFn: fetchBrandSection,
    staleTime: 1000 * 60,
  });
  const { data: curateSection, error: curateSectionError } = useQuery({
    queryKey: ["curateSection"],
    queryFn: fetchCurateSection,
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
  if (newCollectionError) return <div>Error loading new collection: {newCollectionError.message}</div>;
  if (middleBannerError) return <div>Error loading middle banner: {middleBannerError.message}</div>;
  if (ecoBannerError) return <div>Error loading eco banner: {ecoBannerError.message}</div>;
  if (brandSectionError) return <div>Error loading brand section: {brandSectionError.message}</div>;
  if (curateSectionError) return <div>Error loading curate section: {curateSectionError.message}</div>;
  if (productGridTopPicksError) return <div>Error loading top picks: {productGridTopPicksError.message}</div>;
  if (productGridNewArrivalsError) return <div>Error loading new arrivals: {productGridNewArrivalsError.message}</div>;

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
        {newCollection && <ScrollReveal><NewCollection banners={newCollection} /></ScrollReveal>}
      </Suspense>
            <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {/*@ts-ignore*/}
        {productGridTopPicks && <ScrollReveal><ProductGrid products={productGridTopPicks} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {/*@ts-ignore*/}
        {curateSection && <ScrollReveal><CurateConcious banners={curateSection} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {sustainableBatch && <ScrollReveal><ElevateLooksPage /></ScrollReveal>}
      </Suspense>

      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {productGridNewArrivals && <ScrollReveal><ProductGridNewArrivals products={productGridNewArrivals} /></ScrollReveal>}
      </Suspense> */}
      {/* <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {middleBanner && <ScrollReveal><MiddleBannerSection banners={middleBanner} /></ScrollReveal>}
      </Suspense>
      <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {ecoBanner && <ScrollReveal><EcoBannerSectionComponent banners={ecoBanner} /></ScrollReveal>}
      </Suspense> */}
        <Suspense fallback={<div className="h-[200px] md:h-[400px] w-full animate-pulse bg-gray-50 my-4 rounded-xl" />}>
        {/*@ts-ignore*/}
          {brandSection && <ScrollReveal><BrandSection banners={brandSection} /></ScrollReveal>}
        </Suspense>
    </>
  );
}
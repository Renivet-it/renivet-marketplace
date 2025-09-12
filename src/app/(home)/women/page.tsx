// export const revalidate = 60;


// import { AdvertisementPage, Blogs, MarketingStrip } from "@/components/home";
// import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
// import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
// import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
// import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, homeShopByCategoryTitleQueries, productQueries } from "@/lib/db/queries";
// import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
// import { Suspense } from "react";
// import { Landing } from "@/components/home/women/banner";
// import { ExploreCategories } from "@/components/home/women/explore-categories";
// import { ElevateYourLooks } from "@/components/home/women/elavate-looks";
// import { MiddleAnimationSection } from "@/components/home/women/middle-animation-banner";
// import { StyleDirectory } from "@/components/home/women/style-directory";
// import { NewCollection } from "@/components/home/women/new-collection";
// import { DiscountOffer } from "@/components/home/women/discount-offer";
// import { MoodboardItem } from "@/components/home/women/moodboard";
// import { TopCollection } from "@/components/home/women/top-collection";
// import { SpecialOffer } from "@/components/home/women/special-offer";
// import { FindYourStyle } from "@/components/home/women/find-your-style";
// import { SuggestedLook } from "@/components/home/women/suggested-looks";
// import { BrandProducts } from "@/components/home/women/women-store-brand";
// import { WomenBrandProducts } from "@/components/home/women/brand-products";
// import { BrandStoryTelling } from "@/components/home/women/brand-storytelling";
// import { WomenSkincare } from "@/components/home/women/women-glowing-skincare";
// import { ProductGrid } from "@/components/home/women/product-grid";
// import { StyleWithSubstance } from "@/components/home/women/style-with-substance";
// import { GetReadySection } from "@/components/home/women/get-ready-style";
// import { GetNewDiscountCollection } from "@/components/home/women/new-discount-collection";

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
//             <Suspense>
//                 <ShopByNewCategoriesFetch />
//             </Suspense>
//                         <Suspense>
//                 <ElevateYourLooksFetch />
//             </Suspense>
//                         <Suspense>
//                 <MiddleAnimationSectionFetch />
//             </Suspense>
//                                     <Suspense>
//                 <StyleDirectoryFetch />
//             </Suspense>
//                        <Suspense>
//                 <MoodBoardFetch />
//             </Suspense>
//                    <Suspense>
//                 <DiscountPage />
//             </Suspense>
//                   <Suspense>
//         <StyleWithSubstanceFetch />
//       </Suspense>
//                                    <Suspense>
//                 <TopCollectionFetch />
//             </Suspense>

//                  <Suspense>
//                 <NewCollectionDiscountFetch />
//             </Suspense>

//                         <Suspense>
//                 <SpecialOfferFetch />
//             </Suspense>
//                                     <Suspense>
//                 <GetReadyFetch />
//             </Suspense>
//                                                 <Suspense>
//                 <SuggestedLookFetch />
//             </Suspense>
//                      <Suspense>
//                 <NewCollectionMiddleFetch />
//             </Suspense>


//                         <Suspense>
//                 <BrandStoryTellingFetch />
//             </Suspense>
//                                                           <Suspense>
//                 <FindYourStyleFetch />
//             </Suspense>
//                                     <Suspense>
//                 <BrandProductsFetch />
//             </Suspense>
//             <Suspense>
//                 <WomenSkincareFetch />
//             </Suspense>
// <div className="block md:hidden"> {/* Hidden on md and larger screens */}
//   <Suspense>
//     <ProductGridFetch />
//   </Suspense>
// </div>
//         </>
//     );
// }

// async function BannersFetch() {
//     const brandProducts =
//     //@ts-ignore
//         await WomenHomeSectionQueries.getAllHomeShopByCategories();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <Landing banners={brandProducts} />;
// }
// async function StyleWithSubstanceFetch() {
//   const products = await WomenHomeSectionQueries.getWomenStyleWithSubstanceMiddleSection();
//   if (!products.length) return null;
//     //@ts-ignore
//   return <StyleWithSubstance products={products} />;
// }
// async function ProductGridFetch() {
//   const products = await productQueries.getWomenPageFeaturedProducts();
//   if (!products.length) return null;
//     //@ts-ignore

//   return <ProductGrid products={products} />;
// }
// async function ShopByCategoriesFetch() {
//     const [sbc, sbcT] = await Promise.all([
//         homeShopByCategoryQueries.getAllHomeShopByCategories(),
//         homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
//     ]);
//     if (!sbc.length) return null;

//     return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
// }

// async function ShopByNewCategoriesFetch() {

//     //@ts-ignore
//     const [sbc, sbcT] = await Promise.all([
//         // homeShopByCategoryQueries.getAllHomeShopByCategories(),
//     //@ts-ignore

//        WomenHomeSectionQueries.getAllexploreCategories()
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore

//     return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
// }

// async function ElevateYourLooksFetch() {
//     //@ts-ignore

//     const [sbc, sbcT] = await Promise.all([

//     //@ts-ignore
//         WomenHomeSectionQueries.getAllelavateLooks(),
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore

//     return <ElevateYourLooks shopByCategories={sbc} titleData={sbcT} />;
// }
// async function BlogsFetch() {
//     const blogs = await blogQueries.getBlogs({
//         isPublished: true,
//         limit: 6,
//         page: 1,
//     });
//     return <Blogs blogs={blogs.data} />;
// }

// // async function BannersFetch() {
// //     const cachedBanners = await bannerCache.getAll();
// //     if (!cachedBanners.length) return null;

// //     const sorted = cachedBanners.sort(
// //         (a, b) =>
// //             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
// //     );

// //     return <Landing banners={sorted} />;
// // }

// async function BrandProductsFetch() {
//     const brandProducts =
//         await homeBrandProductQueries.getAllHomeBrandProducts();
//     if (!brandProducts.length) return null;

//     return <WomenBrandProducts brandProducts={brandProducts} />;
// }


// async function WomenSkincareFetch() {
//         const brandProducts =
//     //@ts-ignore

//         await WomenHomeSectionQueries.getwomenBrandSkinCareSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <WomenSkincare banners={brandProducts} />;
// }

// async function MiddleAnimationSectionFetch() {

//         const brandProducts =
//     //@ts-ignore

//         await WomenHomeSectionQueries.getAlloutfitVarients();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <MiddleAnimationSection banners={brandProducts} />;

// }

// async function BrandStoryTellingFetch() {
//         const brandProducts =
//     //@ts-ignore

//         await WomenHomeSectionQueries.getwomenBranStoryTellingSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <BrandStoryTelling banners={brandProducts} />;
// }


// async function NewCollectionMiddleFetch() {
//       const brandProducts =
//     //@ts-ignore

//       await WomenHomeSectionQueries.getNewCollections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <NewCollection banners={brandProducts} />;
// }
// async function SpecialOfferFetch() {
//      const brandProducts =
//     //@ts-ignore

//      await WomenHomeSectionQueries.getWomenSummerSaleSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <SpecialOffer banners={brandProducts} />;
// }

// async function FindYourStyleFetch() {
//      const brandProducts =
//     //@ts-ignore

//      await WomenHomeSectionQueries.getWomenFindYourStyleSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <FindYourStyle advertisements={brandProducts} />;
// }

// async function GetReadyFetch() {
//      const brandProducts =
//     //@ts-ignore

//      await WomenHomeSectionQueries.getWomenGetReadySection();
//     if (!brandProducts.length) return null;
//     //@ts-ignore
//     return <GetReadySection banners={brandProducts} />;
// }


// async function NewCollectionDiscountFetch() {
//      const brandProducts =
//     //@ts-ignore

//      await WomenHomeSectionQueries.getnewCollectionDiscountSection();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <GetNewDiscountCollection banners={brandProducts} />;
// }

// // async function StyleDirectoryFetch() {
// //     const cachedBanners = await bannerCache.getAll();
// //     if (!cachedBanners.length) return null;

// //     const sorted = cachedBanners.sort(
// //         (a, b) =>
// //             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
// //     );

// //     return <StyleDirectory banners={sorted} />;
// // }

// async function StyleDirectoryFetch() {
//     //@ts-ignore

//     const [sbc, sbcT] = await Promise.all([
//     //@ts-ignore

//         WomenHomeSectionQueries.getAllstyleDirectory(),
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore

//     return <StyleDirectory shopByCategories={sbc} titleData={sbcT} />;
// }

// async function SuggestedLookFetch() {
//      const brandProducts =
//     //@ts-ignore

//      await WomenHomeSectionQueries.getSuggestedLookSections();
//     if (!brandProducts.length) return null;
//     //@ts-ignore

//     return <SuggestedLook banners={brandProducts} />;
// }

// async function MarketingStripFetch() {
//     const cachedMarktingStrip = await marketingStripCache.getAll();
//     if (!cachedMarktingStrip.length) return null;

//     const sorted = cachedMarktingStrip.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <MarketingStrip marketingStrip={sorted} />;
// }

// async function DealMarketingStripFetch() {
//     const cachedMarktingStrip = await marketingStripCache.getAll();
//     if (!cachedMarktingStrip.length) return null;

//     const sorted = cachedMarktingStrip.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <DealofTheMonthStrip marketingStrip={sorted} />;
// }

// async function AdvertisementsFetch() {
//     const advertisements = await advertisementQueries.getAllAdvertisements({
//         isPublished: true,
//         orderBy: "position",
//     });
//     if (!advertisements.length) return null;

//     return <AdvertisementPage advertisements={advertisements} />;
// }

// async function NewAdvertisementsFetch() {
//     const advertisements = await advertisementQueries.getAllAdvertisements({
//         isPublished: true,
//         orderBy: "position",
//     });
//     if (!advertisements.length) return null;

//     return <AdvertisementDiscountPage advertisements={advertisements} />;
// }

// async function DiscountPage() {
//     const advertisements = await WomenHomeSectionQueries.getNewOfferSections({
//     //@ts-ignore

//         isPublished: true,
//         orderBy: "position",
//     });
//     if (!advertisements.length) return null;

//     //@ts-ignore

//     return <DiscountOffer advertisements={advertisements} />;
// }


// async function MoodBoardFetch() {
//     const [sbc, sbcT] = await Promise.all([
//     //@ts-ignore

//         WomenHomeSectionQueries.getWomenMoodBoards(),
//         homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore

//     return <MoodboardItem moodboardItems={sbc} titleData={sbcT} />;
// }

// async function TopCollectionFetch() {

//     //@ts-ignore
//     const [sbc, sbcT] = await Promise.all([
//     //@ts-ignore

//         WomenHomeSectionQueries.getWomenStyleSubstanceSections(),
//     ]);
//     if (!Array.isArray(sbc) || !sbc.length) {
//         return null;
//     }
//     //@ts-ignore

//     return <TopCollection collections={sbc} titleData={sbcT} />;
// }



// app/page.tsx
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
        {banners && <Landing banners={banners} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {shopByNewCategories && ( <ExploreCategories shopByCategories={shopByNewCategories.shopByCategories} titleData={shopByNewCategories.titleData} />
        )}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {elevateYourLooks && ( <ElevateYourLooks shopByCategories={elevateYourLooks.shopByCategories} titleData={elevateYourLooks.titleData} />
        )}
      </Suspense>


      <Suspense>
{/*@ts-ignore*/}
        {middleAnimationSection && <MiddleAnimationSection banners={middleAnimationSection} />}
      </Suspense>
      
      <Suspense>
{/*@ts-ignore*/}
        {styleDirectory && ( <StyleDirectory shopByCategories={styleDirectory.shopByCategories} titleData={styleDirectory.titleData} />
        )}
      </Suspense>

      
      <Suspense>
{/*@ts-ignore*/}
        {moodBoard && ( <MoodboardItem moodboardItems={moodBoard.moodboardItems} titleData={moodBoard.titleData} />
        )}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {discountPage && <DiscountOffer advertisements={discountPage} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {styleWithSubstance && <StyleWithSubstance products={styleWithSubstance} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {topCollection && ( <TopCollection collections={topCollection.collections} titleData={topCollection.titleData} />
        )}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {newCollectionDiscount && <GetNewDiscountCollection banners={newCollectionDiscount} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}


        {specialOffer && <SpecialOffer banners={specialOffer} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {getReady && <GetReadySection banners={getReady} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {suggestedLook && <SuggestedLook banners={suggestedLook} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {newCollectionMiddle && <NewCollection banners={newCollectionMiddle} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {brandStoryTelling && <BrandStoryTelling banners={brandStoryTelling} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {findYourStyle && <FindYourStyle advertisements={findYourStyle} />}
      </Suspense>
      <Suspense>
        {brandProducts && <WomenBrandProducts brandProducts={brandProducts} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {womenSkincare && <WomenSkincare banners={womenSkincare} />}
      </Suspense>
      <div className="block md:hidden">
        <Suspense>
{/*@ts-ignore*/}
          {productGrid && <ProductGrid products={productGrid} />}
        </Suspense>
      </div>
    </>
  );
}
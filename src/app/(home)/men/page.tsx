
"use client";

import { useQuery } from "@tanstack/react-query";
import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { Suspense } from "react";
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

export default function Page() {
  const { data: banners, error: bannersError } = useQuery({
    queryKey: ["banners"],
    queryFn: fetchBanners,
    staleTime: 1000 * 60, // Cache for 60 seconds
  });
  const { data: brandProducts, error: brandProductsError } = useQuery({
    queryKey: ["brandProducts"],
    queryFn: fetchBrandProducts,
    staleTime: 1000 * 60,
  });
  const { data: moodBoardMen, error: moodBoardError } = useQuery({
    queryKey: ["moodBoardMen"],
    queryFn: fetchMoodBoardMen,
    staleTime: 1000 * 60,
  });
  const { data: menFreshCollection, error: freshCollectionError } = useQuery({
    queryKey: ["menFreshCollection"],
    queryFn: fetchMenFreshCollection,
    staleTime: 1000 * 60,
  });
  const { data: shopByNewCategories, error: shopByNewCategoriesError } = useQuery({
    queryKey: ["shopByNewCategories"],
    queryFn: fetchShopByNewCategories,
    staleTime: 1000 * 60,
  });
  const { data: productGrid, error: productGridError } = useQuery({
    queryKey: ["productGrid"],
    queryFn: fetchProductGrid,
    staleTime: 1000 * 60,
  });
  const { data: elevateYourLooks, error: elevateYourLooksError } = useQuery({
    queryKey: ["elevateYourLooks"],
    queryFn: fetchElevateYourLooks,
    staleTime: 1000 * 60,
  });
  const { data: blogs, error: blogsError } = useQuery({
    queryKey: ["blogs"],
    queryFn: fetchBlogs,
    staleTime: 1000 * 60,
  });
  const { data: middleAnimationSection, error: middleAnimationError } = useQuery({
    queryKey: ["middleAnimationSection"],
    queryFn: fetchMiddleAnimationSection,
    staleTime: 1000 * 60,
  });
  const { data: topCollectionBanner, error: topCollectionBannerError } = useQuery({
    queryKey: ["topCollectionBanner"],
    queryFn: fetchTopCollectionBanner,
    staleTime: 1000 * 60,
  });
  const { data: newCollectionMiddle, error: newCollectionMiddleError } = useQuery({
    queryKey: ["newCollectionMiddle"],
    queryFn: fetchNewCollectionMiddle,
    staleTime: 1000 * 60,
  });
  const { data: specialOffer, error: specialOfferError } = useQuery({
    queryKey: ["specialOffer"],
    queryFn: fetchSpecialOffer,
    staleTime: 1000 * 60,
  });
  const { data: styleDirectory, error: styleDirectoryError } = useQuery({
    queryKey: ["styleDirectory"],
    queryFn: fetchStyleDirectory,
    staleTime: 1000 * 60,
  });
  const { data: suggestedLook, error: suggestedLookError } = useQuery({
    queryKey: ["suggestedLook"],
    queryFn: fetchSuggestedLook,
    staleTime: 1000 * 60,
  });
  const { data: styleWithSubstance, error: styleWithSubstanceError } = useQuery({
    queryKey: ["styleWithSubstance"],
    queryFn: fetchStyleWithSubstance,
    staleTime: 1000 * 60,
  });
  const { data: discountPage, error: discountPageError } = useQuery({
    queryKey: ["discountPage"],
    queryFn: fetchDiscountPage,
    staleTime: 1000 * 60,
  });
  const { data: topCollection, error: topCollectionError } = useQuery({
    queryKey: ["topCollection"],
    queryFn: fetchTopCollection,
    staleTime: 1000 * 60,
  });

  // Basic error handling
  if (bannersError) return <div>Error loading banners: {bannersError.message}</div>;
  if (brandProductsError) return <div>Error loading brand products: {brandProductsError.message}</div>;
  if (moodBoardError) return <div>Error loading mood board: {moodBoardError.message}</div>;
  if (freshCollectionError) return <div>Error loading fresh collection: {freshCollectionError.message}</div>;
  if (shopByNewCategoriesError) return <div>Error loading shop by categories: {shopByNewCategoriesError.message}</div>;
  if (productGridError) return <div>Error loading product grid: {productGridError.message}</div>;
  if (elevateYourLooksError) return <div>Error loading elevate your looks: {elevateYourLooksError.message}</div>;
  if (blogsError) return <div>Error loading blogs: {blogsError.message}</div>;
  if (middleAnimationError) return <div>Error loading middle animation: {middleAnimationError.message}</div>;
  if (topCollectionBannerError) return <div>Error loading top collection banner: {topCollectionBannerError.message}</div>;
  if (newCollectionMiddleError) return <div>Error loading new collection: {newCollectionMiddleError.message}</div>;
  if (specialOfferError) return <div>Error loading special offer: {specialOfferError.message}</div>;
  if (styleDirectoryError) return <div>Error loading style directory: {styleDirectoryError.message}</div>;
  if (suggestedLookError) return <div>Error loading suggested look: {suggestedLookError.message}</div>;
  if (styleWithSubstanceError) return <div>Error loading style with substance: {styleWithSubstanceError.message}</div>;
  if (discountPageError) return <div>Error loading discount page: {discountPageError.message}</div>;
  if (topCollectionError) return <div>Error loading top collection: {topCollectionError.message}</div>;

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
      {/* <Suspense>
        {elevateYourLooks && ( <ElevateYourLooks shopByCategories={elevateYourLooks.shopByCategories} titleData={elevateYourLooks.titleData} />
        )}
      </Suspense> */}
      <Suspense>
{/*@ts-ignore*/}
        {middleAnimationSection && <MiddleAnimationSection banners={middleAnimationSection} />}
      </Suspense>
      {/* <Suspense>

        {styleDirectory && ( <StyleDirectory shopByCategories={styleDirectory.shopByCategories} titleData={styleDirectory.titleData} />
        )}
      </Suspense> */}
            <Suspense>
{/*@ts-ignore*/}
        {styleWithSubstance && <StyleWithSubstance products={styleWithSubstance} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {moodBoardMen && ( <MoodboardItemMen moodboardItems={moodBoardMen.moodboardItems} titleData={moodBoardMen.titleData} />
        )}
      </Suspense>

      <Suspense>
{/*@ts-ignore*/}
        {topCollectionBanner && <TopCollectionBanner advertisements={topCollectionBanner} />}
      </Suspense>
      <Suspense>
{/*@ts-ignore*/}
        {menFreshCollection && <FreshInkCollection banners={menFreshCollection} />}
      </Suspense>
      {/* <Suspense>
        {discountPage && <DiscountOffer advertisements={discountPage} />}
      </Suspense> */}
      <Suspense>
{/*@ts-ignore*/}
        {topCollection && ( <TopCollection collections={topCollection.collections} titleData={topCollection.titleData} />
        )}
      </Suspense>
      {/* <Suspense>
        {specialOffer && <SpecialOffer banners={specialOffer} />}
      </Suspense> */}
      {/* <Suspense>
        {suggestedLook && <SuggestedLook banners={suggestedLook} />}
      </Suspense>
      <Suspense>
        {brandProducts && <WomenBrandProducts brandProducts={brandProducts} />}
      </Suspense>
      <Suspense>

        {newCollectionMiddle && <NewCollection banners={newCollectionMiddle} />}
      </Suspense> */}
      <div className="block md:hidden">
        <Suspense>

{/*@ts-ignore*/}
          {productGrid && <ProductGrid products={productGrid} />}
        </Suspense>
      </div>
      {/* <Suspense>
        {blogs && <Blogs blogs={blogs} />}
      </Suspense> */}
    </>
  );
}
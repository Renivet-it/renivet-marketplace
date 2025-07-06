import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
import { ExploreCategories } from "@/components/home/men/explore-categories";
import { ProductGrid } from "@/components/home/men/product-grid";
import { Landing } from "@/components/home/kids/banner";
import { DiscountOffer } from "@/components/home/kids/discount-offer";
import { ExploreCategories } from "@/components/home/kids/explore-categories";
import { ElevateYourLooks } from "@/components/home/kids/elavate-looks";
import { ElevateYourLooks } from "@/components/home/kids/middle-animation-banner";


export default function Page() {
    return (
        <>
            <Suspense
                fallback={
                    <div className="h-[calc(100vh-20vh)] w-full bg-background" />
                }
            >
                <BannersFetch />
            </Suspense>
            <Suspense>
                <ShopByNewCategoriesFetch />
            </Suspense>
                        <Suspense>
                <ElevateYourLooksFetch />
            </Suspense>
                        <Suspense>
                <MiddleAnimationSectionFetch />
            </Suspense>
                                    <Suspense>
                <StyleDirectoryFetch />
            </Suspense>
                                               <Suspense>
                <MoodBoardMenFecth />
            </Suspense>
                              <Suspense>
                    <StyleWithSubstanceFetch />
                  </Suspense>
                       <Suspense>
                <TopCollectionBannerFecth />
            </Suspense>
                              <Suspense>
                <MenFreshCollectionFetch />
            </Suspense>
                                    <Suspense>
                <DiscountPage />
            </Suspense>
                       <Suspense>
                <TopCollectionFetch />
            </Suspense>


                        {/* <Suspense>
                <SpecialOfferFetch />
            </Suspense> */}
                                                <Suspense>
                <SuggestedLookFetch />
            </Suspense>
                                                <Suspense>
                            <BrandProductsFetch />
                        </Suspense>
                            <Suspense>
                <NewCollectionMiddleFetch />
            </Suspense>
            <div className="block md:hidden"> {/* Hidden on md and larger screens */}
              <Suspense>
                <ProductGridFetch />
              </Suspense>
            </div>
            {/* <Suspense>
                <BlogsFetch />
            </Suspense> */}
        </>
    );
}

async function BannersFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getMenHomeBannerSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <Landing banners={brandProducts} />;
}



async function ShopByNewCategoriesFetch() {
    //@ts-ignore
    const [sbc, sbcT] = await Promise.all([
        // homeShopByCategoryQueries.getAllHomeShopByCategories(),
    //@ts-ignore
        await WomenHomeSectionQueries.getMenExploreCategorySections()
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore
    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function ProductGridFetch() {
  const products = await productQueries.getMenPageFeaturedProducts();
  console.log("Products:", products);
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGrid products={products} />;
}



export const revalidate = 60;


import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
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
                <ExploreCategoryFetch />
            </Suspense>

                        <Suspense>
                <BeautySkinCareBanner />
            </Suspense>

                        <Suspense>
                <BeautyCareRoutineFetch />
            </Suspense>


                                     <Suspense>
                <ProductGridFetchNewArrivals />
              </Suspense>
                                                           <Suspense>
                <NurtureBannerFetch />
            </Suspense>
                              <Suspense>
                    <BeautyDiscountFetch />
                  </Suspense>
                       <Suspense>
                <BestSellerBannnerFetch />
            </Suspense>
                       <Suspense>
                <BeautyMindFulFetch />
            </Suspense>
                                                   <Suspense>
                            <SustanableBatchFetch />
                        </Suspense>
                                                              <Suspense>
                <ProductGridFetchTopPicks />
              </Suspense>
                       <Suspense>
                <BeautySkinQuizFetch />
            </Suspense>
        </>
    );
}

async function BannersFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyPersonalSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <Landing banners={brandProducts} />;
}

async function SustanableBatchFetch() {
    //@ts-ignore

    return <ElavateLooksPage />;
}

async function ExploreCategoryFetch() {
    //@ts-ignore
    const [sbc, sbcT] = await Promise.all([
        // homeShopByCategoryQueries.getAllHomeShopByCategories(),
    //@ts-ignore
       WomenHomeSectionQueries.getBeautyExploreCategorySections()
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore
    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function BeautySkinCareBanner() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautySkinBannerSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <SkinCareBanner banners={brandProducts} />;
}
async function NurtureBannerFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyNurtureSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <NurtureBanner banners={brandProducts} />;
}
async function BeautyDiscountFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyDiscountSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <DiscountOffer advertisements={brandProducts} />;
}

async function BestSellerBannnerFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyBestSellerSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <BestSellerBanner banners={brandProducts} />;
}

async function BeautyMindFulFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyMindFulSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <MindFullStarter banners={brandProducts} />;
}

async function BeautySkinQuizFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautySkinQuizections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <SkinQuizBanner banners={brandProducts} />;
}



async function BeautyCareRoutineFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyCareRoutinetions();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <BeautyCareSection shopByCategories={brandProducts} />;
}
async function ProductGridFetchTopPicks() {
  const products = await productQueries.getBeautyTopPicks();
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGrid products={products} />;
}

async function ProductGridFetchNewArrivals() {
  const products = await productQueries.getBeautyNewArrivals();
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGridNewArrivals products={products} />;
}




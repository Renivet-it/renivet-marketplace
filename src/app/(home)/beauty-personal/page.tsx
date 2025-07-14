import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
import { Landing } from "@/components/home/home-and-living/banner";
import { NewCollection } from "@/components/home/home-and-living/new-collection";
import { ExploreCategories } from "@/components/home/home-and-living/explore-categories";
import { MiddleBannerSection } from "@/components/home/home-and-living/middle-banner";
import { EcoBannerSection as EcoBannerSectionComponent } from "@/components/home/home-and-living/eco-banner";
import { BrandSection } from "@/components/home/home-and-living/brand-section";
import { ProductGrid } from "@/components/home/home-and-living/product-grid";
import { ProductGridNewArrivals } from "@/components/home/home-and-living/product-new-arrival";
import { FeaturesSection as ElavateLooksPage } from "@/components/home/home-and-living/icons-section";
import { CurateConcious } from "@/components/home/home-and-living/curate-concious";


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

                                      {/* <Suspense>
                <ProductGridFetchTopPicks />
              </Suspense>
                                     <Suspense>
                <ProductGridFetchNewArrivals />
              </Suspense> */}
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
        await WomenHomeSectionQueries.getBeautyExploreCategorySections()
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
    return <NewCollection banners={brandProducts} />;
}
async function NurtureBannerFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyNurtureSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <MiddleBannerSection banners={brandProducts} />;
}
async function BeautyDiscountFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyDiscountSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <EcoBannerSectionComponent banners={brandProducts} />;
}

async function BestSellerBannnerFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyBestSellerSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <EcoBannerSectionComponent banners={brandProducts} />;
}

async function BeautyMindFulFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyMindFulSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <EcoBannerSectionComponent banners={brandProducts} />;
}

async function BeautySkinQuizFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautySkinQuizections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <EcoBannerSectionComponent banners={brandProducts} />;
}


async function BrandSectionFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingBrandSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <BrandSection banners={brandProducts} />;
}
async function BeautyCareRoutineFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getBeautyCareRoutinetions();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <CurateConcious banners={brandProducts} />;
}
async function ProductGridFetchTopPicks() {
  const products = await productQueries.getHomeAndLivingTopPicks();
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGrid products={products} />;
}

async function ProductGridFetchNewArrivals() {
  const products = await productQueries.getHomeAndLivingNewArrivals();
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGridNewArrivals products={products} />;
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



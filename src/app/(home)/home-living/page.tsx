export const revalidate = 60;


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
                <NewCollectionSection />
            </Suspense>

                        <Suspense>
                <CurateSectionFetch />
            </Suspense>

                                          <Suspense>
                <SustanableBatchFetch />
            </Suspense>
                                      <Suspense>
                <ProductGridFetchTopPicks />
              </Suspense>
                                     <Suspense>
                <ProductGridFetchNewArrivals />
              </Suspense>
                                                           <Suspense>
                <MiddleBannerFetch />
            </Suspense>
                              <Suspense>
                    <EcoBannerSection />
                  </Suspense>

<div className="pb-10">
                                                <Suspense>
                    <BrandSectionFetch />
                  </Suspense>
                  </div>
                       {/* <Suspense>
                <TopCollectionBannerFecth />
            </Suspense> */}


            <div className="block md:hidden"> {/* Hidden on md and larger screens */}

            </div>
            {/* <Suspense>
                <BlogsFetch />
            </Suspense> */}
        </>
    );
}

async function BannersFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingSections();
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
        WomenHomeSectionQueries.gethomeAndLivingCategoryExploreSections()
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore
    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function NewCollectionSection() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingNewCollectionSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <NewCollection banners={brandProducts} />;
}
async function MiddleBannerFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingBannerMiddleSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <MiddleBannerSection banners={brandProducts} />;
}
async function EcoBannerSection() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingEcoBanners();
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
async function CurateSectionFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.gethomeAndLivingCurateConciousSections();
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
        WomenHomeSectionQueries.getMenExploreCategorySections()
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore
    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}



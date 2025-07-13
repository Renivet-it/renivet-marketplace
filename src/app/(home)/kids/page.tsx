import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
import { Landing } from "@/components/home/kids/banner";
import { DiscountOffer } from "@/components/home/kids/discount-offer";
import { ExploreCategories } from "@/components/home/kids/explore-categories";
import { SpecialCare } from "@/components/home/kids/special-care";
import { DollBanner } from "@/components/home/kids/doll-banner";
import { TwiningSection } from "@/components/home/kids/twining-section";
import { ProductGrid } from "@/components/home/kids/product-grid";
import { Page as ElavateLooksPage } from "@/components/home/kids/elavate-looks";

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
                <SpecialCareSection />
            </Suspense>
                                          <Suspense>
                <SustanableBatchFetch />
            </Suspense>
                              <Suspense>
                    <DollBannerSection />
                  </Suspense>
                                               <Suspense>
                <DiscountOfferSectionFetch />
            </Suspense>
                          <Suspense>
                <ProductGridFetch />
              </Suspense>

                                                <Suspense>
                    <KidTwiningFetch />
                  </Suspense>

        </>
    );
}

async function BannersFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getKidsBannerSections();
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
        await WomenHomeSectionQueries.getKidsExploreCategorySections()
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore
    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function SpecialCareSection() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getKidsCareSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <SpecialCare banners={brandProducts} />;
}
async function DiscountOfferSectionFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getkidDiscountOfferSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <DiscountOffer advertisements={brandProducts} />;
}
async function DollBannerSection() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getkidDollBuyingSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <DollBanner banners={brandProducts} />;
}
async function KidTwiningFetch() {
    //@ts-ignore
    const brandProducts = await WomenHomeSectionQueries.getkidDolllTwiningSections();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <TwiningSection banners={brandProducts} />;
}
async function ProductGridFetch() {
  const products = await productQueries.getKidsPageFeaturedProducts();
  if (!products.length) return null;
    //@ts-ignore
  return <ProductGrid products={products} />;
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



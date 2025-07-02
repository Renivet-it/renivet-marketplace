import { AdvertisementPage, Blogs, MarketingStrip, ShopByCategories } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, productQueries, homeShopByCategoryTitleQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
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
                <TopCollectionBannerFecth />
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

async function ElevateYourLooksFetch() {
    //@ts-ignore

    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

        WomenHomeSectionQueries.getMenelevateLooksections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <ElevateYourLooks shopByCategories={sbc} titleData={sbcT} />;
}
async function BlogsFetch() {
    const blogs = await blogQueries.getBlogs({
        isPublished: true,
        limit: 6,
        page: 1,
    });
    return <Blogs blogs={blogs.data} />;
}


async function MiddleAnimationSectionFetch() {

        const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getMenOutFitVarientSections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <MiddleAnimationSection banners={brandProducts} />;

}

async function TopCollectionBannerFecth() {
      const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getMenTopcollections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <TopCollectionBanner advertisements={brandProducts} />;
}

async function NewCollectionMiddleFetch() {
      const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getMenNewCollections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <NewCollection banners={brandProducts} />;
}
async function SpecialOfferFetch() {
     const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getWomenSummerSaleSections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <SpecialOffer banners={brandProducts} />;
}


async function StyleDirectoryFetch() {
    //@ts-ignore

    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

        WomenHomeSectionQueries.getStyleDirectorySections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <StyleDirectory shopByCategories={sbc} titleData={sbcT} />;
}

async function SuggestedLookFetch() {
     const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getSuggestedLooksForYous();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <SuggestedLook banners={brandProducts} />;
}



async function DiscountPage() {
    const advertisements = await WomenHomeSectionQueries.getDiscountOfferSections({
    //@ts-ignore

        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;
    //@ts-ignore

    return <DiscountOffer advertisements={advertisements} />;
}

async function TopCollectionFetch() {
    //@ts-ignore

    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

              WomenHomeSectionQueries.getTopCollectionSections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <TopCollection collections={sbc} titleData={sbcT} />;
}
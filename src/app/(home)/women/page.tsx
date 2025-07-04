import { AdvertisementPage, Blogs, MarketingStrip } from "@/components/home";
import { DealofTheMonthStrip } from "@/components/home/new-home-page/deal-of-month";
import { ShopByNewCategories } from "@/components/home/new-home-page/shop-by-new-category";
import { AdvertisementDiscountPage } from "@/components/home/new-home-page/discount-section";
import { advertisementQueries, blogQueries, homeBrandProductQueries, WomenHomeSectionQueries, homeShopByCategoryQueries, homeShopByCategoryTitleQueries, productQueries } from "@/lib/db/queries";
import { bannerCache, marketingStripCache } from "@/lib/redis/methods";
import { Suspense } from "react";
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
                <MoodBoardFetch />
            </Suspense>
                   <Suspense>
                <DiscountPage />
            </Suspense>
                  <Suspense>
        <StyleWithSubstanceFetch />
      </Suspense>
                                   <Suspense>
                <TopCollectionFetch />
            </Suspense>



                        <Suspense>
                            {/* festive styl;e */}
                <SpecialOfferFetch />
            </Suspense>
                                                <Suspense>
                <SuggestedLookFetch />
            </Suspense>
                     <Suspense>
                <NewCollectionMiddleFetch />
            </Suspense>
                  <Suspense>
                <newCollectionDiscountFetch />
            </Suspense>
                        <Suspense>
                <getReadyFetch />
            </Suspense>
                        <Suspense>
                <BrandStoryTellingFetch />
            </Suspense>
                                                          <Suspense>
                <FindYourStyleFetch />
            </Suspense>
                                    <Suspense>
                <BrandProductsFetch />
            </Suspense>
            <Suspense>
                <WomenSkincareFetch />
            </Suspense>
<div className="block md:hidden"> {/* Hidden on md and larger screens */}
  <Suspense>
    <ProductGridFetch />
  </Suspense>
</div>
        </>
    );
}

async function BannersFetch() {
    const brandProducts =
    //@ts-ignore
        await WomenHomeSectionQueries.getAllHomeShopByCategories();
    if (!brandProducts.length) return null;
    //@ts-ignore
    return <Landing banners={brandProducts} />;
}
async function StyleWithSubstanceFetch() {
  const products = await WomenHomeSectionQueries.getWomenStyleWithSubstanceMiddleSection();
  if (!products.length) return null;
  console.log("ProductsProductsProducts:", products);
    //@ts-ignore
  return <StyleWithSubstance products={products} />;
}
async function ProductGridFetch() {
  const products = await productQueries.getWomenPageFeaturedProducts();
  console.log("Products:", products);
  if (!products.length) return null;
    //@ts-ignore

  return <ProductGrid products={products} />;
}
async function ShopByCategoriesFetch() {
    const [sbc, sbcT] = await Promise.all([
        homeShopByCategoryQueries.getAllHomeShopByCategories(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!sbc.length) return null;

    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function ShopByNewCategoriesFetch() {

    //@ts-ignore
    const [sbc, sbcT] = await Promise.all([
        // homeShopByCategoryQueries.getAllHomeShopByCategories(),
    //@ts-ignore

        await WomenHomeSectionQueries.getAllexploreCategories()
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <ExploreCategories shopByCategories={sbc} titleData={sbcT} />;
}

async function ElevateYourLooksFetch() {
    //@ts-ignore

    const [sbc, sbcT] = await Promise.all([

    //@ts-ignore
        WomenHomeSectionQueries.getAllelavateLooks(),
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

// async function BannersFetch() {
//     const cachedBanners = await bannerCache.getAll();
//     if (!cachedBanners.length) return null;

//     const sorted = cachedBanners.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <Landing banners={sorted} />;
// }

async function BrandProductsFetch() {
    const brandProducts =
        await homeBrandProductQueries.getAllHomeBrandProducts();
    if (!brandProducts.length) return null;

    return <WomenBrandProducts brandProducts={brandProducts} />;
}


async function WomenSkincareFetch() {
        const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getwomenBrandSkinCareSections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <WomenSkincare banners={brandProducts} />;
}

async function MiddleAnimationSectionFetch() {

        const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getAlloutfitVarients();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <MiddleAnimationSection banners={brandProducts} />;

}

async function BrandStoryTellingFetch() {
        const brandProducts =
    //@ts-ignore

        await WomenHomeSectionQueries.getwomenBranStoryTellingSections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <BrandStoryTelling banners={brandProducts} />;
}


async function NewCollectionMiddleFetch() {
      const brandProducts =
    //@ts-ignore

      await WomenHomeSectionQueries.getNewCollections();
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

async function FindYourStyleFetch() {
     const brandProducts =
    //@ts-ignore

     await WomenHomeSectionQueries.getWomenFindYourStyleSections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <FindYourStyle advertisements={brandProducts} />;
}

async function getReadyFetch() {
     const brandProducts =
    //@ts-ignore

     await WomenHomeSectionQueries.getWomenGetReadySection();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <GetReadySection advertisements={brandProducts} />;
}


async function newCollectionDiscountFetch() {
     const brandProducts =
    //@ts-ignore

     await WomenHomeSectionQueries.getnewCollectionDiscountSection();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <GetNewDiscountCollection advertisements={brandProducts} />;
}

// async function StyleDirectoryFetch() {
//     const cachedBanners = await bannerCache.getAll();
//     if (!cachedBanners.length) return null;

//     const sorted = cachedBanners.sort(
//         (a, b) =>
//             new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     );

//     return <StyleDirectory banners={sorted} />;
// }

async function StyleDirectoryFetch() {
    //@ts-ignore

    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

        WomenHomeSectionQueries.getAllstyleDirectory(),
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

     await WomenHomeSectionQueries.getSuggestedLookSections();
    if (!brandProducts.length) return null;
    //@ts-ignore

    return <SuggestedLook banners={brandProducts} />;
}

async function MarketingStripFetch() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;

    const sorted = cachedMarktingStrip.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <MarketingStrip marketingStrip={sorted} />;
}

async function DealMarketingStripFetch() {
    const cachedMarktingStrip = await marketingStripCache.getAll();
    if (!cachedMarktingStrip.length) return null;

    const sorted = cachedMarktingStrip.sort(
        (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return <DealofTheMonthStrip marketingStrip={sorted} />;
}

async function AdvertisementsFetch() {
    const advertisements = await advertisementQueries.getAllAdvertisements({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;

    return <AdvertisementPage advertisements={advertisements} />;
}

async function NewAdvertisementsFetch() {
    const advertisements = await advertisementQueries.getAllAdvertisements({
        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;

    return <AdvertisementDiscountPage advertisements={advertisements} />;
}

async function DiscountPage() {
    const advertisements = await WomenHomeSectionQueries.getNewOfferSections({
    //@ts-ignore

        isPublished: true,
        orderBy: "position",
    });
    if (!advertisements.length) return null;

    //@ts-ignore

    return <DiscountOffer advertisements={advertisements} />;
}


async function MoodBoardFetch() {
    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

        WomenHomeSectionQueries.getWomenMoodBoards(),
        homeShopByCategoryTitleQueries.getHomeShopByCategoryTitle(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <MoodboardItem moodboardItems={sbc} titleData={sbcT} />;
}

async function TopCollectionFetch() {

    //@ts-ignore
    const [sbc, sbcT] = await Promise.all([
    //@ts-ignore

        WomenHomeSectionQueries.getWomenStyleSubstanceSections(),
    ]);
    if (!Array.isArray(sbc) || !sbc.length) {
        return null;
    }
    //@ts-ignore

    return <TopCollection collections={sbc} titleData={sbcT} />;
}
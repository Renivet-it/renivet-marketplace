import { SearchableProductTypes } from "@/app/(marketing)/shop/search-component";
import { GeneralShell } from "@/components/globals/layouts";
import {
    BreadcrumbSegment,
    buildBreadcrumbJsonLd,
    StorefrontBreadcrumbs,
} from "@/components/globals/layouts/shop/StorefrontBreadcrumbs";
import { Label } from "@/components/ui/label";
import { ProductSearch } from "@/components/ui/product-search";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productQueries, recommendationQueries } from "@/lib/db/queries";
import {
    categoryCache,
    productTypeCache,
    subCategoryCache,
    userWishlistCache,
} from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import { cache, Suspense, type ReactNode } from "react";
import { MobileFilterLoadingButton } from "./mobile-filter-loading-button";
import { SHOP_PRICE_FILTER_MAX } from "./price-filter-config";
import { ShopFilters, ShopSortByWithDefault } from "./shop-filters";
import { ShopMobileActions } from "./shop-mobile-actions";
import { ShopProducts } from "./shop-products";

export interface StorefrontSearchParams {
    page?: string;
    shopPage?: string;
    limit?: string;
    search?: string;
    brandIds?: string;
    colors?: string;
    minPrice?: string;
    maxPrice?: string;
    categoryId?: string;
    subCategoryId?: string;
    subcategoryId?: string;
    productTypeId?: string;
    sortBy?: "price" | "createdAt" | "recommended" | "best-sellers";
    sortOrder?: "asc" | "desc";
    sizes?: string;
    minDiscount?: string;
}

interface StorefrontCatalogPageProps {
    searchParams: Promise<StorefrontSearchParams>;
    basePath: string;
    breadcrumbBaseItems: BreadcrumbSegment[];
    hero?: ReactNode;
    lockedBrandId?: string;
    hideBrandFilter?: boolean;
    defaultSortBy?: "price" | "createdAt" | "recommended" | "best-sellers";
    defaultSortOrder?: "asc" | "desc";
    prioritizeNewProducts?: boolean;
    hideRecommendationSorts?: boolean;
}

const DESKTOP_CATALOG_STICKY_TOP_CLASS = "md:top-5";

export async function StorefrontCatalogPage({
    searchParams,
    basePath,
    breadcrumbBaseItems,
    hero,
    lockedBrandId,
    hideBrandFilter = false,
    defaultSortBy = "recommended",
    defaultSortOrder = "desc",
    prioritizeNewProducts = false,
    hideRecommendationSorts = false,
}: StorefrontCatalogPageProps) {
    const params = await searchParams;
    const subCategoryId = params.subCategoryId || params.subcategoryId;
    const [productTypes, categories, subCategories] = await Promise.all([
        productTypeCache.getAll(),
        categoryCache.getAll(),
        subCategoryCache.getAll(),
    ]);

    const selectedCategory = categories.find(
        (category) => category.id === params.categoryId
    );
    const selectedSubCategory = subCategories.find(
        (subcategory) => subcategory.id === subCategoryId
    );
    const selectedProductType = productTypes.find(
        (productType) => productType.id === params.productTypeId
    );

    const breadcrumbItems = [
        ...breadcrumbBaseItems,
        ...(selectedCategory
            ? [
                  {
                      label: selectedCategory.name,
                      href: `${basePath}?categoryId=${selectedCategory.id}`,
                  },
              ]
            : []),
        ...(selectedSubCategory
            ? [
                  {
                      label: selectedSubCategory.name,
                      href: `${basePath}?categoryId=${selectedSubCategory.categoryId}&subCategoryId=${selectedSubCategory.id}`,
                  },
              ]
            : []),
        ...(selectedProductType
            ? [
                  {
                      label: selectedProductType.name,
                      href: `${basePath}?categoryId=${selectedCategory?.id ?? ""}&subCategoryId=${selectedSubCategory?.id ?? ""}&productTypeId=${selectedProductType.id}`,
                  },
              ]
            : []),
    ];

    const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);

    return (
        <GeneralShell>
            <div className="space-y-4 md:space-y-6">
                <StorefrontBreadcrumbs items={breadcrumbItems} />
                {hero}
            </div>

            <div
                id="brand-shop-catalog"
                className="mt-6 flex flex-col gap-6 md:mt-8 md:flex-row md:items-start md:gap-8"
            >
                <aside className="hidden md:sticky md:top-5 md:z-30 md:block md:max-h-[calc(100vh-2.5rem)] md:w-[335px] md:flex-shrink-0 md:self-start md:overflow-y-auto">
                    <Suspense fallback={<ShopFiltersSkeleton />}>
                        <StorefrontFiltersFetch
                            displayMode="desktop"
                            brandIds={params.brandIds}
                            categoryId={params.categoryId}
                            subCategoryId={subCategoryId}
                            productTypeId={params.productTypeId}
                            search={params.search}
                            minPrice={params.minPrice}
                            maxPrice={params.maxPrice}
                            colors={params.colors}
                            sizes={params.sizes}
                            minDiscount={params.minDiscount}
                            lockedBrandId={lockedBrandId}
                            hideBrandFilter={hideBrandFilter}
                        />
                    </Suspense>
                </aside>

                <main className="w-full space-y-4 pb-40 md:flex-1 md:space-y-5 md:pb-0">
                    <div className="md:hidden">
                        <ProductSearch className="h-14 rounded-[22px] border-[#e3d6c3] bg-[#fffdf8] px-5 text-base shadow-[0_14px_34px_rgba(64,54,36,0.09)]" />
                    </div>

                    <ShopMobileActions
                        defaultSortBy={defaultSortBy}
                        defaultSortOrder={defaultSortOrder}
                        hideRecommendationSorts={hideRecommendationSorts}
                        filters={
                            <Suspense
                                fallback={
                                    <MobileFilterLoadingButton className="h-full w-full rounded-none border-0 border-r border-[#e7dece] bg-transparent text-[15px] font-semibold text-[#25321d] shadow-none hover:bg-[#faf7f1] active:bg-[#f6f0e7]" />
                                }
                            >
                                <StorefrontFiltersFetch
                                    displayMode="mobile"
                                    className="h-full w-full rounded-none border-0 border-r border-[#e7dece] bg-transparent text-[15px] font-semibold text-[#25321d] shadow-none hover:bg-[#faf7f1] active:bg-[#f6f0e7]"
                                    brandIds={params.brandIds}
                                    categoryId={params.categoryId}
                                    subCategoryId={subCategoryId}
                                    productTypeId={params.productTypeId}
                                    search={params.search}
                                    minPrice={params.minPrice}
                                    maxPrice={params.maxPrice}
                                    colors={params.colors}
                                    sizes={params.sizes}
                                    minDiscount={params.minDiscount}
                                    lockedBrandId={lockedBrandId}
                                    hideBrandFilter={hideBrandFilter}
                                />
                            </Suspense>
                        }
                    />

                    <Suspense fallback={<ShopProductsSkeleton />}>
                        <StorefrontProductsFetch
                            searchParams={searchParams}
                            productTypes={productTypes}
                            basePath={basePath}
                            lockedBrandId={lockedBrandId}
                            defaultSortBy={defaultSortBy}
                            defaultSortOrder={defaultSortOrder}
                            prioritizeNewProducts={prioritizeNewProducts}
                            desktopCatalogHeader={
                                <div className="hidden items-center justify-between rounded-2xl border border-[#dce5ee] bg-[#f9fbfd] px-5 py-3.5 md:flex">
                                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5f7897]">
                                        Refine By Category, Color, Size And Fit
                                    </p>
                                    <ShopSortByWithDefault
                                        defaultSortBy={defaultSortBy}
                                        defaultSortOrder={defaultSortOrder}
                                        hideRecommendationSorts={
                                            hideRecommendationSorts
                                        }
                                    />
                                </div>
                            }
                        />
                    </Suspense>
                </main>
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbJsonLd),
                }}
            />
        </GeneralShell>
    );
}

interface GenericProps {
    className?: string;
    [key: string]: any;
}

interface StorefrontFilterQueryInput {
    brandIds?: string;
    categoryId?: string;
    subCategoryId?: string;
    productTypeId?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    colors?: string;
    sizes?: string;
    minDiscount?: string;
    lockedBrandId?: string;
    hideBrandFilter?: boolean;
}

const getStorefrontFilterData = cache(async (serializedInput: string) => {
    const input = JSON.parse(serializedInput) as StorefrontFilterQueryInput;
    const {
        brandIds,
        categoryId,
        subCategoryId,
        productTypeId,
        search,
        minPrice,
        maxPrice,
        colors: colorsParam,
        sizes,
        minDiscount,
        lockedBrandId,
        hideBrandFilter,
    } = input;

    const minPriceValue =
        minPrice && !isNaN(parseInt(minPrice, 10))
            ? parseInt(minPrice, 10)
            : undefined;
    const maxPriceValue =
        maxPrice && !isNaN(parseInt(maxPrice, 10))
            ? parseInt(maxPrice, 10) >= SHOP_PRICE_FILTER_MAX
                ? undefined
                : parseInt(maxPrice, 10)
            : undefined;
    const rawBrandIdsValue = brandIds?.length ? brandIds.split(",") : undefined;
    const brandIdsValue = lockedBrandId ? [lockedBrandId] : rawBrandIdsValue;
    const colorsValue = colorsParam?.length
        ? colorsParam.split(",")
        : undefined;
    const sizesValue = sizes?.length ? sizes.split(",") : undefined;
    const minDiscountValue =
        minDiscount && !isNaN(parseInt(minDiscount, 10))
            ? parseInt(minDiscount, 10)
            : undefined;

    const brandMetaPromise = hideBrandFilter
        ? Promise.resolve([])
        : productQueries.getUniqueBrands({
              categoryId,
              subcategoryId: subCategoryId,
              productTypeId,
              search: search?.trim() || undefined,
              minPrice: minPriceValue,
              maxPrice: maxPriceValue,
              colors: colorsValue,
              sizes: sizesValue,
              minDiscount: minDiscountValue,
          });

    const [
        categories,
        subCategories,
        productTypes,
        brandsMeta,
        filteredCategoryCounts,
        filteredSubCategoryCounts,
        colors,
        alphaSize,
        numSize,
    ] = await Promise.all([
        categoryCache.getAll(),
        subCategoryCache.getAll(),
        productTypeCache.getAll(),
        brandMetaPromise,
        productQueries.getFilteredCategoryCounts({
            brandIds: brandIdsValue,
            search: search?.trim() || undefined,
            minPrice: minPriceValue,
            maxPrice: maxPriceValue,
            colors: colorsValue,
            sizes: sizesValue,
            minDiscount: minDiscountValue,
        }),
        productQueries.getFilteredSubCategoryCounts({
            categoryId,
            brandIds: brandIdsValue,
            search: search?.trim() || undefined,
            minPrice: minPriceValue,
            maxPrice: maxPriceValue,
            colors: colorsValue,
            sizes: sizesValue,
            minDiscount: minDiscountValue,
        }),
        productQueries.getUniqueColors({
            categoryId,
            subcategoryId: subCategoryId,
            productTypeId,
            brandIds: brandIdsValue,
        }),
        productQueries.getAlphaSizes({
            categoryId,
            subcategoryId: subCategoryId,
            productTypeId,
            brandIds: brandIdsValue,
        }),
        productQueries.getNumericSizes({
            categoryId,
            subcategoryId: subCategoryId,
            productTypeId,
            brandIds: brandIdsValue,
        }),
    ]);

    return {
        categories: categories.map((category) => ({
            ...category,
            productCount: filteredCategoryCounts.get(String(category.id)) ?? 0,
        })),
        subCategories: subCategories.map((subCategory) => ({
            ...subCategory,
            productCount:
                filteredSubCategoryCounts.get(String(subCategory.id)) ?? 0,
        })),
        productTypes,
        brandsMeta,
        colors,
        alphaSize,
        numSize,
    };
});

async function StorefrontFiltersFetch(
    props: GenericProps & StorefrontFilterQueryInput
) {
    const {
        brandIds,
        categoryId,
        subCategoryId,
        productTypeId,
        search,
        minPrice,
        maxPrice,
        colors: colorsParam,
        sizes,
        minDiscount,
        lockedBrandId,
        hideBrandFilter,
        ...rest
    } = props;
    const filterData = await getStorefrontFilterData(
        JSON.stringify({
            brandIds,
            categoryId,
            subCategoryId,
            productTypeId,
            search,
            minPrice,
            maxPrice,
            colors: colorsParam,
            sizes,
            minDiscount,
            lockedBrandId,
            hideBrandFilter,
        } satisfies StorefrontFilterQueryInput)
    );

    return (
        <ShopFilters
            sizes={[]}
            categories={filterData.categories}
            subCategories={filterData.subCategories}
            productTypes={filterData.productTypes}
            brandsMeta={filterData.brandsMeta}
            colors={filterData.colors}
            alphaSize={filterData.alphaSize}
            numSize={filterData.numSize}
            hideBrandFilter={hideBrandFilter}
            {...rest}
        />
    );
}

const getCachedDefaultProducts = unstable_cache(
    async () => {
        return await productQueries.getProducts({
            page: 1,
            limit: 28,
            isAvailable: true,
            isActive: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
            minPrice: 0,
            prioritizeBestSellers: true,
            requireMedia: true,
        });
    },
    ["default-shop-products-cache-v1"],
    { revalidate: 60 }
);

const getCachedNewArrivalProducts = unstable_cache(
    async () => {
        return await productQueries.getProducts({
            page: 1,
            limit: 28,
            isAvailable: true,
            isActive: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
            minPrice: 0,
            sortBy: "createdAt",
            sortOrder: "desc",
            prioritizeNewProducts: true,
            requireMedia: true,
        });
    },
    ["new-arrivals-products-cache-v1"],
    { revalidate: 60 }
);

async function StorefrontProductsFetch({
    searchParams,
    productTypes,
    basePath,
    lockedBrandId,
    defaultSortBy = "recommended",
    defaultSortOrder = "desc",
    prioritizeNewProducts = false,
    desktopCatalogHeader,
}: {
    searchParams: Promise<StorefrontSearchParams>;
    productTypes: any[];
    basePath: string;
    lockedBrandId?: string;
    defaultSortBy?: "price" | "createdAt" | "recommended" | "best-sellers";
    defaultSortOrder?: "asc" | "desc";
    prioritizeNewProducts?: boolean;
    desktopCatalogHeader?: ReactNode;
}) {
    const { userId } = await auth();

    const {
        page: pageRaw,
        shopPage: shopPageRaw,
        limit: limitRaw,
        search: searchRaw,
        brandIds: brandIdsRaw,
        minPrice: minPriceRaw,
        maxPrice: maxPriceRaw,
        categoryId: categoryIdRaw,
        subCategoryId: subCategoryIdRaw,
        subcategoryId: subcategoryIdRaw,
        productTypeId: productTypeIdRaw,
        sortBy: sortByRaw,
        sortOrder: sortOrderRaw,
        colors: colorsRaw,
        sizes: sizesRaw,
        minDiscount: minDiscountRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw, 10))
            ? parseInt(limitRaw, 10)
            : 28;
    const pageCandidate = shopPageRaw ?? pageRaw;
    const page =
        pageCandidate && !isNaN(parseInt(pageCandidate, 10))
            ? parseInt(pageCandidate, 10)
            : 1;
    const search = !!searchRaw?.length ? searchRaw : undefined;
    const parsedBrandIds = !!brandIdsRaw?.length
        ? brandIdsRaw.split(",")
        : undefined;
    const brandIds = lockedBrandId ? [lockedBrandId] : parsedBrandIds;
    const minPrice =
        minPriceRaw && !isNaN(parseInt(minPriceRaw, 10))
            ? parseInt(minPriceRaw, 10) < 0
                ? 0
                : parseInt(minPriceRaw, 10)
            : 0;
    const maxPrice =
        maxPriceRaw && !isNaN(parseInt(maxPriceRaw, 10))
            ? parseInt(maxPriceRaw, 10)
            : SHOP_PRICE_FILTER_MAX;
    const effectiveMaxPrice =
        maxPrice >= SHOP_PRICE_FILTER_MAX ? undefined : maxPrice;
    const categoryId = !!categoryIdRaw?.length ? categoryIdRaw : undefined;
    const subCategoryId =
        (subCategoryIdRaw && subCategoryIdRaw.length > 0
            ? subCategoryIdRaw
            : undefined) ||
        (subcategoryIdRaw && subcategoryIdRaw.length > 0
            ? subcategoryIdRaw
            : undefined);
    const productTypeId = !!productTypeIdRaw?.length
        ? productTypeIdRaw
        : undefined;
    const sortBy =
        !!sortByRaw?.length && sortByRaw !== "recommended"
            ? sortByRaw
            : defaultSortBy === "recommended"
              ? undefined
              : defaultSortBy;
    const sortOrder =
        !!sortOrderRaw?.length && sortByRaw !== "recommended"
            ? sortOrderRaw
            : defaultSortBy === "recommended"
              ? undefined
              : defaultSortOrder;
    const colors = !!colorsRaw?.length ? colorsRaw.split(",") : undefined;
    const sizes = !!sizesRaw?.length ? sizesRaw.split(",") : undefined;
    const minDiscount =
        minDiscountRaw && !isNaN(parseInt(minDiscountRaw, 10))
            ? parseInt(minDiscountRaw, 10)
            : undefined;

    const shouldUseRecommendations =
        page === 1 &&
        !search &&
        !categoryId &&
        !subCategoryId &&
        !productTypeId &&
        !brandIds?.length &&
        minPrice === 0 &&
        maxPrice >= SHOP_PRICE_FILTER_MAX &&
        !minDiscount &&
        defaultSortBy === "recommended" &&
        (!sortByRaw || sortByRaw === "recommended") &&
        !!userId;

    let finalData;

    if (shouldUseRecommendations) {
        const recommendations =
            await recommendationQueries.getPersonalizedRecommendations({
                userId,
                limit,
                excludeProductIds: [],
            });

        if (recommendations.products.length >= 5) {
            finalData = await productQueries.getProducts({
                page,
                limit,
                isAvailable: true,
                isActive: true,
                isPublished: true,
                isDeleted: false,
                verificationStatus: "approved",
                minPrice: 0,
                prioritizeBestSellers: true,
                priorityProductIds: recommendations.products.map(
                    (product) => product.id
                ),
                requireMedia: true,
            });
        } else {
            finalData = await getCachedDefaultProducts();
        }
    } else {
        const isDefaultView =
            page === 1 &&
            limit === 28 &&
            !search &&
            !brandIds &&
            minPrice === 0 &&
            maxPrice >= SHOP_PRICE_FILTER_MAX &&
            !categoryId &&
            !subCategoryId &&
            !productTypeId &&
            defaultSortBy === "recommended" &&
            (!sortByRaw || sortByRaw === "recommended") &&
            !sortOrder &&
            !colors &&
            !sizes &&
            !minDiscount;

        const isDefaultNewArrivalsView =
            page === 1 &&
            limit === 28 &&
            !search &&
            !brandIds &&
            minPrice === 0 &&
            maxPrice >= SHOP_PRICE_FILTER_MAX &&
            !categoryId &&
            !subCategoryId &&
            !productTypeId &&
            prioritizeNewProducts &&
            defaultSortBy === "createdAt" &&
            (!sortByRaw || sortByRaw === "createdAt") &&
            (!sortOrderRaw || sortOrderRaw === "desc") &&
            !colors &&
            !sizes &&
            !minDiscount;

        if (isDefaultNewArrivalsView) {
            finalData = await getCachedNewArrivalProducts();
        } else if (isDefaultView) {
            finalData = await getCachedDefaultProducts();
        } else {
            finalData = await productQueries.getProducts({
                page,
                limit,
                search,
                isAvailable: true,
                isActive: true,
                isPublished: true,
                isDeleted: false,
                verificationStatus: "approved",
                brandIds,
                minPrice,
                maxPrice: effectiveMaxPrice,
                categoryId: !!categoryId?.length ? categoryId : undefined,
                subcategoryId: !!subCategoryId?.length
                    ? subCategoryId
                    : undefined,
                productTypeId: !!productTypeId?.length
                    ? productTypeId
                    : undefined,
                sortBy,
                sortOrder,
                colors,
                sizes,
                minDiscount,
                prioritizeBestSellers:
                    !search &&
                    defaultSortBy === "recommended" &&
                    (!sortByRaw || sortByRaw === "recommended"),
                prioritizeNewProducts,
                requireMedia: true,
            });
        }
    }

    const userWishlist = userId
        ? await userWishlistCache.get(userId)
        : undefined;

    const productTypeById = new Map(
        productTypes.map((type: any) => [String(type.id), type])
    );
    const productTypesForPillsMap = new Map<
        string,
        {
            id: string;
            name: string;
            subCategory?: { name: string };
        }
    >();

    for (const product of finalData?.data ?? []) {
        const typeId = String(
            product?.productType?.id ?? product?.productTypeId ?? ""
        );
        if (!typeId) continue;

        const fallbackType = productTypeById.get(typeId);
        const typeName = product?.productType?.name ?? fallbackType?.name;
        const typeSubCategoryName =
            product?.productType?.subCategory?.name ??
            product?.subcategory?.name ??
            fallbackType?.subCategory?.name;

        if (!typeName) continue;

        productTypesForPillsMap.set(typeId, {
            id: typeId,
            name: String(typeName),
            subCategory: typeSubCategoryName
                ? { name: String(typeSubCategoryName) }
                : undefined,
        });
    }

    const productTypesForPills = Array.from(productTypesForPillsMap.values());

    return (
        <div className="space-y-4 md:space-y-3">
            <div className="block md:hidden">
                <SearchableProductTypes
                    productTypes={productTypesForPills}
                    productTypeId={productTypeIdRaw ?? ""}
                    initialProducts={finalData?.data ?? []}
                    basePath={basePath}
                />
            </div>

            <div
                className={`hidden md:sticky ${DESKTOP_CATALOG_STICKY_TOP_CLASS} md:z-40 md:block md:space-y-3 md:bg-[#ffffff] md:pb-2 md:shadow-[0_10px_18px_-18px_rgba(36,55,84,0.55)]`}
            >
                {desktopCatalogHeader}

                <SearchableProductTypes
                    productTypes={productTypesForPills}
                    productTypeId={productTypeIdRaw ?? ""}
                    initialProducts={finalData?.data ?? []}
                    isDesktop
                    basePath={basePath}
                />

                <div className="border-b border-[#e4e9ef]" />
            </div>

            <ShopProducts
                initialData={{
                    ...finalData,
                    data:
                        finalData?.data?.filter((p: any) => !p.isDeleted) ?? [],
                }}
                initialWishlist={userWishlist}
                userId={userId ?? undefined}
                initialPage={page}
                lockedBrandId={lockedBrandId}
                defaultSortBy={defaultSortBy}
                defaultSortOrder={defaultSortOrder}
                prioritizeNewProducts={prioritizeNewProducts}
            />
        </div>
    );
}

function ShopFiltersSkeleton() {
    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Filters</h4>
                <Skeleton className="h-8 w-16" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                    Category
                </Label>
                <Skeleton className="h-10" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                    Brand
                </Label>
                <Skeleton className="h-10" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                    Price Range
                </Label>
                <div className="space-y-2">
                    <Skeleton className="h-6" />
                    <div className="flex gap-2">
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                    Colors
                </Label>
                <Skeleton className="h-20" />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                    Sizes
                </Label>
                <Skeleton className="h-24" />
            </div>
        </div>
    );
}

function ShopProductsSkeleton() {
    return (
        <div className="space-y-5">
            <div className="scrollbar-hide flex gap-2 overflow-hidden pb-2">
                <Skeleton className="h-10 w-24 shrink-0 rounded-lg" />
                <Skeleton className="h-10 w-24 shrink-0 rounded-lg" />
                <Skeleton className="h-10 w-24 shrink-0 rounded-lg" />
                <Skeleton className="h-10 w-24 shrink-0 rounded-lg" />
                <Skeleton className="hidden h-10 w-24 shrink-0 rounded-lg md:block" />
                <Skeleton className="hidden h-10 w-24 shrink-0 rounded-lg md:block" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-5 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>

            <Separator />

            <div className="flex w-full items-center justify-center py-4">
                <Skeleton className="h-10 w-40 rounded-md" />
            </div>
        </div>
    );
}

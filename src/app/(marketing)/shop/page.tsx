import { GeneralShell } from "@/components/globals/layouts";
import {
    buildBreadcrumbJsonLd,
    StorefrontBreadcrumbs,
} from "@/components/globals/layouts/shop/StorefrontBreadcrumbs";
import { ShopFilters, ShopProducts, ShopSortBy } from "@/components/shop";
import { SHOP_PRICE_FILTER_MAX } from "@/components/shop/price-filter-config";
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
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { SearchableProductTypes } from "./search-component";
import { ShopMobileActions } from "./shop-mobile-actions";

interface PageProps {
    searchParams: Promise<{
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
    }>;
}

export default async function Page({ searchParams }: PageProps) {
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
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        ...(selectedCategory
            ? [
                  {
                      label: selectedCategory.name,
                      href: `/shop?categoryId=${selectedCategory.id}`,
                  },
              ]
            : []),
        ...(selectedSubCategory
            ? [
                  {
                      label: selectedSubCategory.name,
                      href: `/shop?categoryId=${selectedSubCategory.categoryId}&subCategoryId=${selectedSubCategory.id}`,
                  },
              ]
            : []),
        ...(selectedProductType
            ? [
                  {
                      label: selectedProductType.name,
                      href: `/shop?categoryId=${selectedCategory?.id ?? ""}&subCategoryId=${selectedSubCategory?.id ?? ""}&productTypeId=${selectedProductType.id}`,
                  },
              ]
            : []),
    ];
    const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);

    return (
        <GeneralShell>
            <div className="mb-4">
                <StorefrontBreadcrumbs items={breadcrumbItems} />
            </div>
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
                <aside className="hidden md:sticky md:top-5 md:block md:max-h-[calc(100vh-2.5rem)] md:w-[335px] md:flex-shrink-0 md:overflow-y-auto">
                    <Suspense fallback={<ShopFiltersSkeleton />}>
                        <ShopFiltersFetch
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
                        />
                    </Suspense>
                </aside>

                <main className="w-full space-y-4 pb-40 md:flex-1 md:space-y-5 md:pb-0">
                    <div className="md:hidden">
                        <ProductSearch className="h-14 rounded-[22px] border-[#e3d6c3] bg-[#fffdf8] px-5 text-base shadow-[0_14px_34px_rgba(64,54,36,0.09)]" />
                    </div>

                    <ShopMobileActions
                        filters={
                            <Suspense
                                fallback={
                                    <button
                                        type="button"
                                        disabled
                                        className="flex h-full w-full items-center justify-center gap-2 border-r border-[#e7dece] bg-transparent text-[15px] font-semibold text-[#25321d]"
                                    >
                                        <span className="relative h-4 w-4">
                                            <span className="absolute left-1 top-0 h-4 w-2 border-x-2 border-t-2 border-[#25321d]" />
                                            <span className="absolute bottom-0 left-[7px] h-1.5 w-0.5 bg-[#25321d]" />
                                        </span>
                                        Filters
                                    </button>
                                }
                            >
                                <ShopFiltersFetch
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
                                />
                            </Suspense>
                        }
                    />

                    <div className="hidden items-center justify-between rounded-2xl border border-[#dce5ee] bg-[#f9fbfd] px-5 py-3.5 md:flex">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#5f7897]">
                            Refine By Category, Color, Size And Fit
                        </p>
                        <ShopSortBy />
                    </div>

                    <Suspense fallback={<ShopProductsSkeleton />}>
                        <ShopProductsFetch
                            searchParams={searchParams}
                            productTypes={productTypes}
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

function ProductTypesRowDesktop({
    productTypes,
    productTypeId,
}: {
    productTypes: { id: string; name: string }[];
    productTypeId?: string;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            <a
                href="?productTypeId="
                className={cn(
                    "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50",
                    productTypeId === "" &&
                        "border-black bg-black text-white hover:bg-gray-900"
                )}
            >
                All Items
            </a>

            {productTypes.map((type) => (
                <a
                    key={type.id}
                    href={`?productTypeId=${type.id}`}
                    className={cn(
                        "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50",
                        productTypeId === type.id &&
                            "border-black bg-black text-white hover:bg-gray-900"
                    )}
                >
                    {type.name}
                </a>
            ))}
        </div>
    );
}

function ProductTypesRow({
    productTypes,
    productTypeId,
}: {
    productTypes: { id: string; name: string }[];
    productTypeId?: string;
}) {
    return (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
            <a
                href="?productTypeId="
                className={cn(
                    "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors active:scale-95",
                    productTypeId === "" && "border-black bg-black text-white"
                )}
            >
                All Items
            </a>

            {productTypes.map((type) => (
                <a
                    key={type.id}
                    href={`?productTypeId=${type.id}`}
                    className={cn(
                        "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors active:scale-95",
                        productTypeId === type.id &&
                            "border-black bg-black text-white"
                    )}
                >
                    {type.name}
                </a>
            ))}
        </div>
    );
}

// --- MODIFIED SECTION ---
interface GenericProps {
    className?: string;
    isMobileFullWidth?: boolean; // New prop
    [key: string]: any;
}

async function ShopFiltersFetch(
    props: GenericProps & {
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
    }
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
        ...rest
    } = props;

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
    const brandIdsValue = brandIds?.length ? brandIds.split(",") : undefined;
    const colorsValue = colorsParam?.length
        ? colorsParam.split(",")
        : undefined;
    const sizesValue = sizes?.length ? sizes.split(",") : undefined;
    const minDiscountValue =
        minDiscount && !isNaN(parseInt(minDiscount, 10))
            ? parseInt(minDiscount, 10)
            : undefined;
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
        productQueries.getUniqueBrands({
            categoryId,
            subcategoryId: subCategoryId,
            productTypeId,
            search: search?.trim() || undefined,
            minPrice: minPriceValue,
            maxPrice: maxPriceValue,
            colors: colorsValue,
            sizes: sizesValue,
            minDiscount: minDiscountValue,
        }),
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
        }),
        productQueries.getAlphaSizes({
            categoryId,
            subcategoryId: subCategoryId,
            productTypeId,
        }),
        productQueries.getNumericSizes({
            categoryId,
            subcategoryId: subCategoryId,
            productTypeId,
        }),
    ]);

    const hasBrandFilter = !!brandIdsValue?.length;

    const subCategoriesWithFilteredCounts = subCategories.map(
        (subCategory) => ({
            ...subCategory,
            productCount: hasBrandFilter
                ? (filteredSubCategoryCounts.get(String(subCategory.id)) ?? 0)
                : (subCategory.productCount ?? 0),
        })
    );

    const categoryCountMapFromSubCategories = new Map<string, number>();
    if (hasBrandFilter) {
        subCategoriesWithFilteredCounts.forEach((subCategory) => {
            const key = String(subCategory.categoryId);
            const current = categoryCountMapFromSubCategories.get(key) ?? 0;
            categoryCountMapFromSubCategories.set(
                key,
                current + Math.max(subCategory.productCount ?? 0, 0)
            );
        });
    }

    const categoriesWithFilteredCounts = categories.map((category) => ({
        ...category,
        productCount: hasBrandFilter
            ? (categoryCountMapFromSubCategories.get(String(category.id)) ?? 0)
            : category.productCount,
    }));

    return (
        <ShopFilters
            sizes={[]}
            categories={categoriesWithFilteredCounts}
            subCategories={subCategoriesWithFilteredCounts}
            productTypes={productTypes}
            brandsMeta={brandsMeta}
            colors={colors}
            alphaSize={alphaSize}
            numSize={numSize}
            {...rest}
        />
    );
}
// --- END MODIFICATION ---

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

async function ShopProductsFetch({
    searchParams,
    productTypes,
}: {
    searchParams: PageProps["searchParams"];
    productTypes: any[];
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
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 28;
    const pageCandidate = shopPageRaw ?? pageRaw;
    const page =
        pageCandidate && !isNaN(parseInt(pageCandidate))
            ? parseInt(pageCandidate)
            : 1;
    const search = !!searchRaw?.length ? searchRaw : undefined;
    const brandIds = !!brandIdsRaw?.length ? brandIdsRaw.split(",") : undefined;
    const minPrice =
        minPriceRaw && !isNaN(parseInt(minPriceRaw))
            ? parseInt(minPriceRaw) < 0
                ? 0
                : parseInt(minPriceRaw)
            : 0;
    const maxPrice =
        maxPriceRaw && !isNaN(parseInt(maxPriceRaw))
            ? parseInt(maxPriceRaw)
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
            : undefined;
    const sortOrder =
        !!sortOrderRaw?.length && sortByRaw !== "recommended"
            ? sortOrderRaw
            : undefined;
    const colors = !!colorsRaw?.length ? colorsRaw.split(",") : undefined;
    const sizes = !!sizesRaw?.length ? sizesRaw.split(",") : undefined;
    const minDiscount =
        minDiscountRaw && !isNaN(parseInt(minDiscountRaw))
            ? parseInt(minDiscountRaw)
            : undefined;

    // Check if we should use personalized recommendations
    // Only apply on first page with no specific filters
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
        (!sortByRaw || sortByRaw === "recommended") &&
        !!userId;

    let finalData;

    if (shouldUseRecommendations) {
        // Get personalized recommendations
        const recommendations =
            await recommendationQueries.getPersonalizedRecommendations({
                userId,
                limit,
                excludeProductIds: [],
            });

        if (recommendations.products.length >= 5) {
            // Get regular products for count and remaining products
            const regularData = await getCachedDefaultProducts();

            // Combine personalized first, then regular (exclude duplicates)
            const recommendedIds = new Set(
                recommendations.products.map((p) => p.id)
            );
            const regularProducts = regularData.data.filter(
                (p) => !recommendedIds.has(p.id)
            );
            const combinedProducts = [
                ...recommendations.products,
                ...regularProducts,
            ].slice(0, limit);

            finalData = {
                data: combinedProducts,
                count: regularData.count,
            };
        } else {
            // Not enough personalized recommendations, use regular
            finalData = await getCachedDefaultProducts();
        }
    } else {
        // Regular products query
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
            (!sortByRaw || sortByRaw === "recommended") &&
            !sortOrder &&
            !colors &&
            !sizes &&
            !minDiscount;

        if (isDefaultView) {
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
                    !search && (!sortByRaw || sortByRaw === "recommended"),
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
    const productTypesForPills = Array.from(
        new Map(
            (finalData?.data ?? [])
                .map((product: any) => {
                    const typeId = String(
                        product?.productType?.id ?? product?.productTypeId ?? ""
                    );
                    if (!typeId) return null;

                    const fallbackType = productTypeById.get(typeId);
                    const typeName =
                        product?.productType?.name ?? fallbackType?.name;
                    const typeSubCategoryName =
                        product?.productType?.subCategory?.name ??
                        product?.subcategory?.name ??
                        fallbackType?.subCategory?.name;

                    if (!typeName) return null;

                    return [
                        typeId,
                        {
                            id: typeId,
                            name: String(typeName),
                            subCategory: typeSubCategoryName
                                ? { name: String(typeSubCategoryName) }
                                : undefined,
                        },
                    ] as const;
                })
                .filter(
                    (
                        item
                    ): item is readonly [
                        string,
                        {
                            id: string;
                            name: string;
                            subCategory?: { name: string };
                        },
                    ] => item !== null
                )
        ).values()
    );

    return (
        <div className="space-y-5">
            {/* Mobile Product Types */}
            <div className="block md:hidden">
                <SearchableProductTypes
                    productTypes={productTypesForPills}
                    productTypeId={productTypeIdRaw ?? ""}
                    initialProducts={finalData?.data ?? []}
                />
            </div>

            {/* Desktop Product Types */}
            <div className="hidden md:block">
                <SearchableProductTypes
                    productTypes={productTypesForPills}
                    productTypeId={productTypeIdRaw ?? ""}
                    initialProducts={finalData?.data ?? []}
                    isDesktop
                />
            </div>

            <Separator />

            <ShopProducts
                initialData={{
                    ...finalData,
                    data:
                        finalData?.data?.filter((p: any) => !p.isDeleted) ?? [],
                }}
                initialWishlist={userWishlist}
                userId={userId ?? undefined}
                initialPage={page}
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

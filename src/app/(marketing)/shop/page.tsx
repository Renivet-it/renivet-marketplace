import { GeneralShell } from "@/components/globals/layouts";
import { ShopFilters, ShopProducts, ShopSortBy } from "@/components/shop";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
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

interface PageProps {
    searchParams: Promise<{
        page?: string;
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
    }>;
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const subCategoryId = params.subCategoryId || params.subcategoryId;
    const productTypes = await productTypeCache.getAll();

    return (
        <GeneralShell>
            <div className="flex flex-col gap-5 md:flex-row">
                {/* Desktop filters - Fixed sidebar */}
                <aside className="hidden md:sticky md:top-4 md:block md:max-h-[calc(100vh-2rem)] md:basis-1/5 md:self-start md:overflow-y-auto">
                    <Suspense fallback={<ShopFiltersSkeleton />}>
                        <ShopFiltersFetch
                            className="space-y-4 pr-2"
                            categoryId={params.categoryId}
                            subCategoryId={subCategoryId}
                            productTypeId={params.productTypeId}
                        />
                    </Suspense>
                </aside>

                {/* Divider */}
                <div className="hidden w-px bg-border md:inline-block" />

                {/* Main content */}
                <main className="w-full space-y-5 md:basis-4/5">
                    {/* Mobile search, filters, and sort */}
                    <div className="block space-y-4 md:hidden">
                        <SearchInput
                            type="search"
                            placeholder="Search for a product..."
                            className="h-12 text-base"
                        />
                        {/* --- MODIFIED SECTION --- */}
                        <div className="grid grid-cols-2 gap-2">
                            <Suspense
                                fallback={<Skeleton className="h-10 w-full" />}
                            >
                                <ShopFiltersFetch
                                    isMobileFullWidth={true}
                                    categoryId={params.categoryId}
                                    subCategoryId={subCategoryId}
                                    productTypeId={params.productTypeId}
                                />
                            </Suspense>
                            <ShopSortBy />
                        </div>
                        {/* --- END MODIFICATION --- */}
                    </div>

                    {/* Desktop search and sort */}
                    <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
                        {/* This div will now take up all available space */}
                        <div className="flex-1">
                            {/* Your Search Input component would go here */}
                            {/* e.g., <ShopSearch /> */}
                        </div>

                        {/* This component will be pushed to the right */}
                        <ShopSortBy />
                    </div>

                    <Suspense fallback={<ShopProductsSkeleton />}>
                        <ShopProductsFetch searchParams={searchParams} productTypes={productTypes} />
                    </Suspense>
                </main>
            </div>
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
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
    }
) {
    const { categoryId, subCategoryId, productTypeId, ...rest } = props;
    const [
        categories,
        subCategories,
        productTypes,
        brandsMeta,
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

    return (
        <ShopFilters
            sizes={[]}
            categories={categories}
            subCategories={subCategories}
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
            maxPrice: 1000000,
            prioritizeBestSellers: true,
            requireMedia: true,
        });
    },
    ["default-shop-products-cache-v1"],
    { revalidate: 60 }
);

async function ShopProductsFetch({ searchParams, productTypes }: { searchParams: PageProps["searchParams"], productTypes: any[] }) {
    const { userId } = await auth();

    const {
        page: pageRaw,
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
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 28;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
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
            : 1000000;
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

    // Check if we should use personalized recommendations
    // Only apply on first page with no specific filters
    const shouldUseRecommendations =
        page === 1 &&
        !search &&
        !categoryId &&
        !subCategoryId &&
        !productTypeId &&
        !brandIds?.length &&
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
        const isDefaultView = page === 1 && limit === 28 &&
                              !search && !brandIds && minPrice === 0 && maxPrice === 1000000 &&
                              !categoryId && !subCategoryId && !productTypeId &&
                              (!sortByRaw || sortByRaw === "recommended") && !sortOrder && !colors && !sizes;
                              
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
                maxPrice,
                categoryId: !!categoryId?.length ? categoryId : undefined,
                subcategoryId: !!subCategoryId?.length ? subCategoryId : undefined,
                productTypeId: !!productTypeId?.length ? productTypeId : undefined,
                sortBy,
                sortOrder,
                colors,
                sizes,
                prioritizeBestSellers:
                    !search && (!sortByRaw || sortByRaw === "recommended"),
                requireMedia: true,
            });
        }
    }

    const userWishlist = userId
        ? await userWishlistCache.get(userId)
        : undefined;

    // console.log(finalData.data, "data");
    
    return (
        <div className="space-y-5">
            {/* Mobile Product Types */}
            <div className="block md:hidden">
                <SearchableProductTypes
                    productTypes={productTypes}
                    productTypeId={productTypeIdRaw ?? ""}
                    initialProducts={finalData?.data ?? []}
                />
            </div>

            {/* Desktop Product Types */}
            <div className="hidden md:block">
                <SearchableProductTypes
                    productTypes={productTypes.slice(0, 10)}
                    productTypeId={productTypeIdRaw ?? ""}
                    initialProducts={finalData?.data ?? []}
                    isDesktop
                />
            </div>

            <Separator />

            <ShopProducts
                initialData={{
                    ...finalData,
                    data: finalData?.data?.filter((p: any) => !p.isDeleted) ?? [],
                }}
                initialWishlist={userWishlist}
                userId={userId ?? undefined}
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
            <div className="flex gap-2 overflow-hidden scrollbar-hide pb-2">
                <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
                <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
                <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
                <Skeleton className="h-10 w-24 rounded-lg shrink-0" />
                <Skeleton className="h-10 w-24 rounded-lg shrink-0 hidden md:block" />
                <Skeleton className="h-10 w-24 rounded-lg shrink-0 hidden md:block" />
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

import { GeneralShell } from "@/components/globals/layouts";
import { ShopFilters, ShopProducts, ShopSortBy } from "@/components/shop";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productQueries } from "@/lib/db/queries";
import {
    brandCache,
    categoryCache,
    productTypeCache,
    subCategoryCache,
    userWishlistCache,
} from "@/lib/redis/methods";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import AutoRefresher from "./AutoRefresher";
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
        productTypeId?: string;
        sortBy?: "price" | "createdAt";
        sortOrder?: "asc" | "desc";
        sizes?: string;
    }>;
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;

    const [allCategories, allSubCategories, allProductTypes, allBrands] =
        await Promise.all([
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
            brandCache.getAll(),
        ]);

    const activeCategory = allCategories.find(
        (c) => c.slug === params.categoryId
    );
    const activeSubCategory = allSubCategories.find(
        (s) => s.slug === params.subCategoryId
    );
    const activeProductType = allProductTypes.find(
        (t) => t.slug === params.productTypeId
    );

    const categoryId = activeCategory?.id;
    const subcategoryId = activeSubCategory?.id;
    const productTypeId = activeProductType?.id;

    const brandIds = params.brandIds
        ?.split(",")
        .map((slug) => allBrands.find((b) => b.slug === slug)?.id)
        .filter(Boolean) as string[];

    const data = await productQueries.getProducts({
        page: parseInt(params.page || "1"),
        limit: parseInt(params.limit || "28"),
        search: params.search,
        isAvailable: true,
        isActive: true,
        isPublished: true,
        isDeleted: false,
        verificationStatus: "approved",
        brandIds: brandIds.length > 0 ? brandIds : undefined,
        minPrice: params.minPrice ? parseInt(params.minPrice) : 0,
        maxPrice: params.maxPrice ? parseInt(params.maxPrice) : 10000,
        categoryId,
        subcategoryId,
        productTypeId,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        colors: params.colors?.split(","),
        sizes: params.sizes?.split(","),
    });

    return (
        <GeneralShell>
            <AutoRefresher />

            <div className="flex flex-col gap-5 md:flex-row">
                {/* Desktop filters - Fixed sidebar */}
                <aside className="hidden md:sticky md:top-4 md:block md:max-h-[calc(100vh-2rem)] md:basis-1/5 md:self-start md:overflow-y-auto">
                    <Suspense fallback={<ShopFiltersSkeleton />}>
                        <ShopFiltersFetch
                            className="space-y-4 pr-2"
                            categoryId={params.categoryId}
                            subCategoryId={params.subCategoryId}
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
                                    subCategoryId={params.subCategoryId}
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

                    {/* Mobile Product Types */}
                    <div className="block md:hidden">
                        <SearchableProductTypes
                            productTypes={allProductTypes}
                            productTypeId={params.productTypeId ?? ""}
                            initialProducts={data?.data ?? []}
                        />
                    </div>

                    {/* Desktop Product Types */}
                    <div className="hidden md:block">
                        <SearchableProductTypes
                            productTypes={allProductTypes.slice(0, 10)}
                            productTypeId={params.productTypeId ?? ""}
                            initialProducts={data?.data ?? []}
                            isDesktop
                        />
                    </div>

                    <Separator />

                    <Suspense fallback={<ShopProductsSkeleton />}>
                        <ShopProductsFetch searchParams={searchParams} />
                    </Suspense>
                </main>
            </div>
        </GeneralShell>
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
        allCategories,
        allSubCategories,
        allProductTypes,
        // brandsMeta, // will fetch specifically based on IDs
    ] = await Promise.all([
        categoryCache.getAll(),
        subCategoryCache.getAll(),
        productTypeCache.getAll(),
    ]);

    const activeCategory = allCategories.find((c) => c.slug === categoryId);
    const activeSubCategory = allSubCategories.find(
        (s) => s.slug === subCategoryId
    );
    const activeProductType = allProductTypes.find(
        (t) => t.slug === productTypeId
    );

    const resolvedCategoryId = activeCategory?.id;
    const resolvedSubCategoryId = activeSubCategory?.id;
    const resolvedProductTypeId = activeProductType?.id;

    const [brandsMeta, colors, alphaSize, numSize] = await Promise.all([
        productQueries.getUniqueBrands({
            categoryId: resolvedCategoryId,
            subcategoryId: resolvedSubCategoryId,
            productTypeId: resolvedProductTypeId,
        }),
        productQueries.getUniqueColors({
            categoryId: resolvedCategoryId,
            subcategoryId: resolvedSubCategoryId,
            productTypeId: resolvedProductTypeId,
        }),
        productQueries.getAlphaSizes({
            categoryId: resolvedCategoryId,
            subcategoryId: resolvedSubCategoryId,
            productTypeId: resolvedProductTypeId,
        }),
        productQueries.getNumericSizes({
            categoryId: resolvedCategoryId,
            subcategoryId: resolvedSubCategoryId,
            productTypeId: resolvedProductTypeId,
        }),
    ]);

    return (
        <ShopFilters
            sizes={[]}
            categories={allCategories}
            subCategories={allSubCategories}
            productTypes={allProductTypes}
            brandsMeta={brandsMeta}
            colors={colors}
            alphaSize={alphaSize}
            numSize={numSize}
            {...rest}
        />
    );
}
// --- END MODIFICATION ---

async function ShopProductsFetch({ searchParams }: PageProps) {
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
            ? parseInt(maxPriceRaw) > 10000
                ? 10000
                : parseInt(maxPriceRaw)
            : 10000;
    const [allCategories, allSubCategories, allProductTypes, allBrands] =
        await Promise.all([
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
            brandCache.getAll(),
        ]);

    const activeCategory = allCategories.find((c) => c.slug === categoryIdRaw);
    const activeSubCategory = allSubCategories.find(
        (s) => s.slug === subCategoryIdRaw
    );
    const activeProductType = allProductTypes.find(
        (t) => t.slug === productTypeIdRaw
    );

    const categoryId = activeCategory?.id;
    const subCategoryId = activeSubCategory?.id;
    const productTypeId = activeProductType?.id;

    const brandIds = !!brandIdsRaw?.length
        ? (brandIdsRaw
              .split(",")
              .map((slug) => allBrands.find((b) => b.slug === slug)?.id)
              .filter(Boolean) as string[])
        : undefined;

    const [data, userWishlist] = await Promise.all([
        productQueries.getProducts({
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
            categoryId,
            subcategoryId: subCategoryId,
            productTypeId,
            sortBy,
            sortOrder,
            colors,
            sizes,
        }),
        userId ? userWishlistCache.get(userId) : undefined,
    ]);
    console.log(data.data, "data");
    return (
        <ShopProducts
            initialData={{
                ...data,
                data: data?.data?.filter((p: any) => !p.isDeleted) ?? [],
            }}
            initialWishlist={userWishlist}
            userId={userId ?? undefined}
        />
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
        <>
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

            <div className="flex w-full items-center justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn("size-10 rounded", {
                            "w-20": i === 0 || i === 4,
                            "hidden md:inline-block": i === 1 || i === 3,
                        })}
                    />
                ))}
            </div>
        </>
    );
}

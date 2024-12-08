import { GeneralShell } from "@/components/globals/layouts";
import { ShopPage } from "@/components/shop";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { brandQueries, productQueries } from "@/lib/db/queries";
import {
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        brandIds?: string;
        minPrice?: string;
        maxPrice?: string;
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
        sortBy?: "price" | "createdAt";
        sortOrder?: "asc" | "desc";
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <GeneralShell>
            <Suspense fallback={<ShopSkeleton />}>
                <ShopFetch searchParams={searchParams} />
            </Suspense>
        </GeneralShell>
    );
}

async function ShopFetch({ searchParams }: PageProps) {
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
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 30;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = !!searchRaw?.length ? searchRaw : undefined;
    const brandIds = !!brandIdsRaw?.length ? brandIdsRaw.split(",") : undefined;
    const minPrice =
        minPriceRaw && !isNaN(parseInt(minPriceRaw))
            ? parseInt(minPriceRaw) < 0
                ? 0
                : parseInt(minPriceRaw)
            : undefined;
    const maxPrice =
        maxPriceRaw && !isNaN(parseInt(maxPriceRaw))
            ? parseInt(maxPriceRaw) > 10000
                ? 10000
                : parseInt(maxPriceRaw)
            : undefined;
    const categoryId = !!categoryIdRaw?.length ? categoryIdRaw : undefined;
    const subCategoryId = !!subCategoryIdRaw?.length
        ? subCategoryIdRaw
        : undefined;
    const productTypeId = !!productTypeIdRaw?.length
        ? productTypeIdRaw
        : undefined;
    const sortBy = !!sortByRaw?.length ? sortByRaw : undefined;
    const sortOrder = !!sortOrderRaw?.length ? sortOrderRaw : undefined;

    const [data, brandsMeta, categories, subCategories, productTypes] =
        await Promise.all([
            productQueries.getProducts({
                page,
                limit,
                search,
                isAvailable: true,
                isPublished: true,
                brandIds,
                minPrice,
                maxPrice,
                categoryId,
                subCategoryId,
                productTypeId,
                sortBy,
                sortOrder,
            }),
            brandQueries.getBrandsMeta(),
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
        ]);

    return (
        <ShopPage
            initialData={data}
            brandsMeta={brandsMeta}
            categories={categories}
            subCategories={subCategories}
            productTypes={productTypes}
        />
    );
}

function ShopSkeleton() {
    return (
        <div className="flex flex-col gap-5 md:flex-row">
            <div className="w-full basis-1/6 space-y-4">
                <h4 className="text-lg">Filters</h4>

                <Separator />

                <div className="space-y-1">
                    <Label className="font-semibold uppercase">Category</Label>
                    <Skeleton className="h-10" />
                </div>

                <Separator />

                <div className="space-y-1">
                    <Label className="font-semibold uppercase">Brand</Label>
                    <Skeleton className="h-10" />
                </div>

                <Separator />

                <div className="space-y-1">
                    <div className="space-y-2">
                        <Label className="font-semibold uppercase">Price</Label>

                        <Skeleton className="h-7" />
                    </div>

                    <Skeleton className="h-4 w-1/2" />
                </div>

                <Separator />

                <div className="space-y-1">
                    <Label className="font-semibold uppercase">Sort By</Label>
                    <Skeleton className="h-10" />
                </div>
            </div>

            <div className="hidden w-px bg-border md:inline-block" />

            <div className="w-full basis-5/6 space-y-5">
                <Skeleton className="h-12" />
                <Separator />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
                    {[...Array(8)].map((_, i) => (
                        <div key={i}>
                            <div>
                                <Skeleton className="aspect-[3/4] size-full" />
                            </div>

                            <div className="space-y-2 py-2">
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>

                                <Skeleton className="h-5 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="flex w-full items-center justify-center gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className={cn("size-10", {
                                "w-20": i === 0 || i === 3,
                                "hidden md:inline-block": i === 1 || i === 2,
                            })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

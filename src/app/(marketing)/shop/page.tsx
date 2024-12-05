import { GeneralShell } from "@/components/globals/layouts";
import { ShopPage } from "@/components/shop";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { brandQueries, productQueries } from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        brandIds?: string;
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
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 30;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;
    const brandIds = brandIdsRaw?.length ? brandIdsRaw.split(",") : undefined;

    const [data, brandsMeta] = await Promise.all([
        productQueries.getProducts({
            page,
            limit,
            search,
            isAvailable: true,
            isPublished: true,
            brandIds,
        }),
        brandQueries.getBrandsMeta(),
    ]);

    return <ShopPage initialData={data} brandsMeta={brandsMeta} />;
}

function ShopSkeleton() {
    return (
        <div className="flex flex-col gap-5 md:flex-row">
            <div className="w-full basis-1/6 space-y-4">
                <h4 className="text-lg">Filters</h4>

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
                    <Label className="font-semibold uppercase">Color</Label>
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

import { ProductManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { SIZES } from "@/config/sizes";
import { brandCache } from "@/lib/redis/methods";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string }>;
}

export const metadata: Metadata = {
    title: "Create New Product",
    description: "Create a new product for the brand",
};

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Create New Product</div>
                <p className="text-sm text-muted-foreground">
                    Create a new product for the brand
                </p>
            </div>

            <Suspense fallback={<ProductManageSkeleton />}>
                <ProductManageFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ProductManageFetch({ params }: PageProps) {
    const { bId } = await params;
    const cachedBrand = await brandCache.get(bId);
    if (!cachedBrand) notFound();

    return <ProductManageForm brandId={bId} />;
}

function ProductManageSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton
                        className={cn("h-4 w-20 rounded-md", {
                            "w-24": i === 1,
                        })}
                    />
                    <Skeleton
                        className={cn(
                            "h-10 w-full rounded-md",
                            i === 1 && "h-80"
                        )}
                    />
                </div>
            ))}

            <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <div className="flex flex-wrap gap-2">
                    {SIZES.map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-10 min-w-[90px] rounded-md"
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
            </div>

            <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <div className="flex w-full flex-col gap-2 md:flex-row">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton
                            key={i}
                            className="aspect-square basis-1/5 rounded-md"
                        />
                    ))}
                </div>
            </div>

            <Skeleton className="h-9 w-1/4 rounded-md" />

            <Skeleton className="h-10 w-full rounded-md" />
        </div>
    );
}

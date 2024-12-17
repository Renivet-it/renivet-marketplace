import { ProductManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { SIZES } from "@/config/sizes";
import { productQueries } from "@/lib/db/queries";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        bId: string;
        pId: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { bId, pId } = await params;

    const existingProduct = await productQueries.getProduct(pId);
    if (!existingProduct)
        return {
            title: "Product not found",
            description: "The requested product was not found",
        };

    if (existingProduct.brand.id !== bId)
        return {
            title: "Product not found",
            description: "The requested product was not found",
        };

    return {
        title: `Edit "${existingProduct.name}"`,
        description: existingProduct.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Edit Product</h1>
                <p className="text-sm text-muted-foreground">
                    Edit the product and update it on the platform
                </p>
            </div>

            <Suspense fallback={<ProductManageSkeleton />}>
                <ProductEditFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ProductEditFetch({ params }: PageProps) {
    const { bId, pId } = await params;

    const existingProduct = await productQueries.getProduct(pId);
    if (!existingProduct) notFound();

    if (existingProduct.brand.id !== bId) notFound();

    return <ProductManageForm brandId={bId} product={existingProduct} />;
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

import { ProductCategorizePage } from "@/components/dashboard/brands/products/categorize";
import { DashShell } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productQueries } from "@/lib/db/queries";
import {
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
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
        title: `Category "${existingProduct.name}"`,
        description: existingProduct.description,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <div className="space-y-1">
                <div className="text-2xl font-semibold">Categorize Product</div>
                <p className="text-sm text-muted-foreground">
                    Categorize the product for better organization
                </p>
            </div>

            <Suspense fallback={<ProductCategorizeSkeleton />}>
                <ProductCategorizeFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ProductCategorizeFetch({ params }: PageProps) {
    const { bId, pId } = await params;

    const [existingProduct, categories, subCategories, productTypes] =
        await Promise.all([
            productQueries.getProduct(pId),
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
        ]);

    if (!existingProduct) notFound();
    if (existingProduct.brand.id !== bId) notFound();

    return (
        <ProductCategorizePage
            product={existingProduct}
            categories={categories}
            subCategories={subCategories}
            productTypes={productTypes}
        />
    );
}

function ProductCategorizeSkeleton() {
    return (
        <div className="space-y-5">
            <Skeleton className="h-96 rounded-md" />
            <Separator className="bg-foreground/20" />

            <div className="space-y-6">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-20 rounded-md" />

                    <div className="flex flex-wrap gap-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton
                                key={i}
                                className="h-10 w-28 rounded-md"
                            />
                        ))}
                    </div>
                </div>

                <Separator />

                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        </div>
    );
}

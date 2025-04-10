// import { ProductManageForm } from "@/components/globals/forms";
// import { DashShell } from "@/components/globals/layouts";
// import { Separator } from "@/components/ui/separator";
// import { Skeleton } from "@/components/ui/skeleton";
// import { productQueries } from "@/lib/db/queries";
// import {
//     brandCache,
//     categoryCache,
//     mediaCache,
//     productTypeCache,
//     subCategoryCache,
// } from "@/lib/redis/methods";
// import { cn } from "@/lib/utils";
// import { Metadata } from "next";
// import { notFound } from "next/navigation";
// import { Suspense } from "react";

// interface PageProps {
//     params: Promise<{
//         bId: string;
//         id: string;
//     }>;
// }

// export async function generateMetadata({
//     params,
// }: PageProps): Promise<Metadata> {
//     const { bId, id } = await params;

//     const existingProduct = await productQueries.getProduct({ productId: id });
//     if (!existingProduct)
//         return {
//             title: "Product not found",
//             description: "The requested product was not found",
//         };

//     if (existingProduct.brand.id !== bId)
//         return {
//             title: "Product not found",
//             description: "The requested product was not found",
//         };

//     return {
//         title: `Edit "${existingProduct.title}"`,
//         description: existingProduct.description,
//     };
// }

// export default function Page({ params }: PageProps) {
//     return (
//         <DashShell>
//             <div className="space-y-1">
//                 <h1 className="text-2xl font-bold">Edit Product</h1>
//                 <p className="text-sm text-muted-foreground">
//                     Edit the product and update it on the platform
//                 </p>
//             </div>

//             <Suspense fallback={<ProductManageSkeleton />}>
//                 <ProductEditFetch params={params} />
//             </Suspense>
//         </DashShell>
//     );
// }

// async function ProductEditFetch({ params }: PageProps) {
//     const { bId, id } = await params;

//     const [
//         existingProduct,
//         cachedBrand,
//         categories,
//         subCategories,
//         productTypes,
//         media,
//     ] = await Promise.all([
//         productQueries.getProduct({ productId: id }),
//         brandCache.get(bId),
//         categoryCache.getAll(),
//         subCategoryCache.getAll(),
//         productTypeCache.getAll(),
//         mediaCache.getAll(bId),
//     ]);
//     if (!cachedBrand) notFound();
//     if (!existingProduct) notFound();
//     if (existingProduct.brand.id !== bId) notFound();

//     return (
//         <ProductManageForm
//             brandId={bId}
//             brand={cachedBrand}
//             allCategories={categories}
//             allSubCategories={subCategories}
//             allProductTypes={productTypes}
//             allMedia={media.data}
//             product={existingProduct}
//         />
//     );
// }

// function ProductManageSkeleton() {
//     return (
//         <div className="space-y-6">
//             {Array.from({ length: 3 }).map((_, i) => (
//                 <div key={i} className="space-y-2">
//                     <Skeleton
//                         className={cn("h-4 w-20 rounded-md", {
//                             "w-24": i === 1,
//                         })}
//                     />
//                     <Skeleton
//                         className={cn(
//                             "h-10 w-full rounded-md",
//                             i === 1 && "h-80"
//                         )}
//                     />
//                 </div>
//             ))}

//             <div className="space-y-2">
//                 <Skeleton className="h-4 w-20 rounded-md" />
//                 <div className="flex w-full flex-col gap-2 md:flex-row">
//                     {[...Array(5)].map((_, i) => (
//                         <Skeleton
//                             key={i}
//                             className="aspect-square basis-1/5 rounded-md"
//                         />
//                     ))}
//                 </div>
//             </div>

//             <div className="space-y-2">
//                 <Skeleton className="h-4 w-24 rounded-md" />
//                 <Skeleton className="h-80 w-full rounded-md" />
//             </div>

//             <div className="space-y-4">
//                 <div className="flex items-center justify-between gap-2">
//                     <Skeleton className="h-8 w-36 rounded-md" />
//                     <Skeleton className="h-9 w-40 rounded-md" />
//                 </div>

//                 <Skeleton className="h-40 w-full rounded-md" />

//                 <div className="relative">
//                     <Separator />
//                     <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm">
//                         OR
//                     </span>
//                 </div>

//                 <Skeleton className="h-44 w-full rounded-md" />

//                 <Skeleton className="h-9 w-full rounded-md" />
//             </div>

//             <Skeleton className="h-10 w-full rounded-md" />
//         </div>
//     );
// }

import { ProductManageForm } from "@/components/globals/forms";
import { DashShell } from "@/components/globals/layouts";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productQueries } from "@/lib/db/queries";
import {
    brandCache,
    categoryCache,
    mediaCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    // params: {
    //     id: string;
    // };
        params: Promise<{
        id: string;
    }>;
}
export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;
    const existingProduct = await productQueries.getProduct({ productId: id });
    if (!existingProduct) {
        return {
            title: "Product not found",
            description: "The requested product was not found",
        };
    }

    return {
        title: `Edit "${existingProduct.title}"`,
        description: existingProduct.description,
    };
}

export default async function Page({ params }: PageProps) {
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
    const { id } = await params;
    const existingProduct = await productQueries.getProduct({ productId: id });
    if (!existingProduct) notFound();

    const brandId = existingProduct.brand.id;

    const [
        cachedBrand,
        categories,
        subCategories,
        productTypes,
        media,
    ] = await Promise.all([
        brandCache.get(brandId),
        categoryCache.getAll(),
        subCategoryCache.getAll(),
        productTypeCache.getAll(),
        mediaCache.getAll(brandId),
    ]);

    if (!cachedBrand) notFound();

    return (
        <ProductManageForm
            brandId={brandId}
            brand={cachedBrand}
            allCategories={categories}
            allSubCategories={subCategories}
            allProductTypes={productTypes}
            allMedia={media.data}
            product={existingProduct}
        />
    );
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
                <div className="flex w-full flex-col gap-2 md:flex-row">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton
                            key={i}
                            className="aspect-square basis-1/5 rounded-md"
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-80 w-full rounded-md" />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-8 w-36 rounded-md" />
                    <Skeleton className="h-9 w-40 rounded-md" />
                </div>

                <Skeleton className="h-40 w-full rounded-md" />

                <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm">
                        OR
                    </span>
                </div>

                <Skeleton className="h-44 w-full rounded-md" />

                <Skeleton className="h-9 w-full rounded-md" />
            </div>

            <Skeleton className="h-10 w-full rounded-md" />
        </div>
    );
}

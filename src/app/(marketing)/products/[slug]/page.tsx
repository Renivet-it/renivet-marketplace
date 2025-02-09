import { GeneralShell } from "@/components/globals/layouts";
import { ProductPage, ProductPassport } from "@/components/products/product";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND_EVENTS } from "@/config/brand";
import { siteConfig } from "@/config/site";
import { productQueries } from "@/lib/db/queries";
import {
    analytics,
    userCartCache,
    userWishlistCache,
} from "@/lib/redis/methods";
import { cn, getAbsoluteURL } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { slug } = await params;

    const existingProduct = await productQueries.getProductBySlug({
        slug,
        verificationStatus: "approved",
        isPublished: true,
    });
    if (!existingProduct)
        return {
            title: "Product not found",
            description: "The requested product was not found.",
        };

    return {
        title: !!existingProduct.metaTitle?.length
            ? existingProduct.metaTitle
            : `${existingProduct.title} by ${existingProduct.brand.name}`,
        description: !!existingProduct.metaDescription?.length
            ? existingProduct.metaDescription
            : existingProduct.description,
        authors: [
            {
                name: existingProduct.brand.name,
                url: getAbsoluteURL(`/brands/${existingProduct.brand.id}`),
            },
        ],
        openGraph: {
            type: "website",
            locale: "en_US",
            url: getAbsoluteURL(`/products/${slug}`),
            title: !!existingProduct.metaTitle?.length
                ? existingProduct.metaTitle
                : `${existingProduct.title} by ${existingProduct.brand.name}`,
            description:
                (!!existingProduct.metaDescription?.length
                    ? existingProduct.metaDescription
                    : existingProduct.description) ?? "",
            siteName: siteConfig.name,
            images: [
                {
                    url: existingProduct.media?.[0].mediaItem?.url ?? "",
                    alt:
                        existingProduct.media?.[0].mediaItem?.alt ??
                        existingProduct.title,
                    height: 1000,
                    width: 1000,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: !!existingProduct.metaTitle?.length
                ? existingProduct.metaTitle
                : `${existingProduct.title} by ${existingProduct.brand.name}`,
            description:
                (!!existingProduct.metaDescription?.length
                    ? existingProduct.metaDescription
                    : existingProduct.description) ?? "",
            images: [
                {
                    url: existingProduct.media?.[0].mediaItem?.url ?? "",
                    alt:
                        existingProduct.media?.[0].mediaItem?.alt ??
                        existingProduct.title,
                    height: 1000,
                    width: 1000,
                },
            ],
        },
    };
}

export default function Page({ params }: PageProps) {
    return (
        <GeneralShell>
            <Suspense fallback={<ProductSkeleton />}>
                <ProductFetch params={params} />
            </Suspense>
        </GeneralShell>
    );
}

async function ProductFetch({ params }: PageProps) {
    const { slug } = await params;
    const { userId } = await auth();

    const [existingProduct, userWishlist, userCart] = await Promise.all([
        productQueries.getProductBySlug({
            slug,
            verificationStatus: "approved",
            isPublished: true,
        }),
        userId ? userWishlistCache.get(userId) : undefined,
        userId ? userCartCache.get(userId) : undefined,
    ]);
    if (!existingProduct) notFound();

    await analytics.track({
        namespace: BRAND_EVENTS.PRODUCT.VIEWED,
        brandId: existingProduct.brand.id,
        event: {
            userId: userId ?? "Unknown",
            productId: existingProduct.id,
            productName: existingProduct.title,
            url: getAbsoluteURL(`/products/${slug}`),
        },
    });

    return (
        <>
            <ProductPage
                product={existingProduct}
                initialWishlist={userWishlist}
                initialCart={userCart}
                userId={userId ?? undefined}
            />

            <Separator />

            <ProductPassport product={existingProduct} />
        </>
    );
}

function ProductSkeleton() {
    return (
        <div className="flex flex-col gap-5 md:flex-row">
            <div className="grid basis-3/5 grid-cols-1 gap-5 md:grid-cols-2">
                {[...Array(5)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="aspect-[3/4] overflow-hidden"
                    />
                ))}
            </div>

            <div className="w-px bg-border" />

            <div className="basis-2/5 space-y-3 md:space-y-5">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex w-full flex-col gap-1">
                            {[...Array(2)].map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className={cn(
                                        "h-10 w-1/3",
                                        i === 0 && "w-full"
                                    )}
                                />
                            ))}
                        </div>

                        <div>
                            <Skeleton className="size-8" />
                        </div>
                    </div>

                    <Skeleton className="h-7 w-24" />
                </div>

                <Separator />

                <div className="w-full space-y-1">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-5 w-32" />
                </div>

                <div className="space-y-4">
                    <Skeleton className="h-6 w-28" />

                    <div className="flex flex-wrap gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center gap-2"
                            >
                                <Skeleton className="size-12 rounded-full" />

                                <Skeleton className="h-4 w-10" />
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />

                    <div className="flex flex-wrap gap-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton
                                key={i}
                                className="size-12 rounded-full"
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                    <Skeleton className="h-11 w-full md:h-12 md:basis-2/3" />
                    <Skeleton className="h-11 w-full md:h-12 md:basis-1/3" />
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="space-y-1">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton
                                key={i}
                                className={cn("h-5 w-full", i === 2 && "w-1/2")}
                            />
                        ))}
                    </div>

                    <div className="space-y-1">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton
                                key={i}
                                className={cn("h-5 w-full", i === 3 && "w-1/3")}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

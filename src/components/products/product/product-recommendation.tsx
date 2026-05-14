"use client";

import { ProductCard as HomeProductCard } from "@/components/home/new-home-page/new-arrivals";
import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React from "react";

type YouMayAlsoLikeProps = React.HTMLAttributes<HTMLDivElement> & {
    brandId: string;
    categoryId: string;
    excludeProductId: string;
    userId?: string;
};

const FALLBACK_QUERY_LIMIT = 12;
const FINAL_RECOMMENDATION_LIMIT = 8;

type RecommendationProduct = {
    id: string;
    slug?: string;
    title: string;
    price?: number;
    compareAtPrice?: number;
    compare_at_price?: number;
    brand?: string | { name?: string };
    media?: Array<{ url?: string; mediaItem?: { url?: string } }>;
    variants?: unknown[];
    options?: unknown[];
    specifications?: unknown[];
    [key: string]: unknown;
};

const adaptRecommendationProduct = (product: RecommendationProduct) => {
    const media =
        product?.media?.map((item) => {
            const url = item?.mediaItem?.url ?? item?.url;
            return url ? { mediaItem: { url } } : null;
        })?.filter(Boolean) ?? [];

    const brandName =
        typeof product?.brand === "string"
            ? product.brand
            : product?.brand?.name;

    return {
        ...product,
        compareAtPrice: product?.compareAtPrice ?? product?.compare_at_price,
        brand: brandName ? { name: brandName } : undefined,
        media,
        variants: product?.variants ?? [],
        options: product?.options ?? [],
        specifications: product?.specifications ?? [],
    };
};

const RecommendationCarousel = ({
    products,
    userId,
}: {
    products: RecommendationProduct[];
    userId?: string;
}) => {
    const [api, setApi] = React.useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    React.useEffect(() => {
        if (!api) return;
        const onSelect = () => {
            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        };
        onSelect();
        api.on("select", onSelect);
        api.on("reInit", onSelect);
        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api]);

    return (
        <div className="relative">
            <div className="mb-4 hidden justify-end gap-2 md:flex">
                <button
                    type="button"
                    onClick={() => api?.scrollPrev()}
                    disabled={!canScrollPrev}
                    className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-black shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous products"
                >
                    <ArrowLeft className="size-4" />
                </button>
                <button
                    type="button"
                    onClick={() => api?.scrollNext()}
                    disabled={!canScrollNext}
                    className="flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-black shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next products"
                >
                    <ArrowRight className="size-4" />
                </button>
            </div>

            <Carousel
                setApi={setApi}
                opts={{ align: "start", containScroll: "trimSnaps" }}
                className="w-full"
            >
                <CarouselContent className="-ml-3 md:-ml-5">
                    {products.map((product) => (
                        <CarouselItem
                            key={product.id}
                            className="basis-1/2 pl-3 sm:basis-1/3 md:basis-1/4 md:pl-5 lg:basis-1/5 xl:basis-1/6"
                        >
                            <HomeProductCard
                                product={adaptRecommendationProduct(product)}
                                userId={userId}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-5 flex flex-col items-start">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-xs">
            Our Recommendations
        </span>
        <h2 className="mt-2 font-playfair text-[24px] font-normal uppercase leading-[1.3] text-gray-900 md:text-[32px]">
            {title}
        </h2>
    </div>
);

const YouMayAlsoLike = ({
    className,
    brandId,
    categoryId,
    excludeProductId,
    userId,
    ...props
}: YouMayAlsoLikeProps) => {
    const {
        data: primaryProducts = [],
        status: primaryStatus,
    } = trpc.brands.products.getRecommendations.useQuery(
        {
            productId: excludeProductId,
        },
        {
            retry: false,
            refetchOnWindowFocus: false,
        }
    );

    const normalizedPrimaryProducts = React.useMemo(
        () =>
            primaryProducts.filter(
                (product): product is RecommendationProduct =>
                    !!product?.id && product.id !== excludeProductId
            ),
        [excludeProductId, primaryProducts]
    );

    const shouldLoadSameBrand =
        primaryStatus !== "pending" && normalizedPrimaryProducts.length === 0;

    const {
        data: sameBrandData,
        status: sameBrandStatus,
    } = trpc.brands.products.getProducts.useQuery(
        {
            limit: FALLBACK_QUERY_LIMIT,
            page: 1,
            brandIds: [brandId],
            isPublished: true,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            verificationStatus: "approved",
            sortBy: "best-sellers",
            sortOrder: "desc",
            requireMedia: true,
        },
        {
            enabled: shouldLoadSameBrand,
            retry: false,
            refetchOnWindowFocus: false,
        }
    );

    const sameBrandProducts = React.useMemo(
        () =>
            (sameBrandData?.data ?? []).filter(
                (product): product is RecommendationProduct =>
                    !!product?.id && product.id !== excludeProductId
            ),
        [excludeProductId, sameBrandData?.data]
    );

    const shouldLoadSameCategory =
        shouldLoadSameBrand &&
        sameBrandStatus !== "pending" &&
        sameBrandProducts.length === 0;

    const {
        data: sameCategoryData,
        status: sameCategoryStatus,
    } = trpc.brands.products.getProducts.useQuery(
        {
            limit: FALLBACK_QUERY_LIMIT,
            page: 1,
            categoryId,
            isPublished: true,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            verificationStatus: "approved",
            sortBy: "best-sellers",
            sortOrder: "desc",
            requireMedia: true,
        },
        {
            enabled: shouldLoadSameCategory,
            retry: false,
            refetchOnWindowFocus: false,
        }
    );

    const sameCategoryProducts = React.useMemo(
        () =>
            (sameCategoryData?.data ?? []).filter(
                (product): product is RecommendationProduct =>
                    !!product?.id && product.id !== excludeProductId
            ),
        [excludeProductId, sameCategoryData?.data]
    );

    const shouldLoadBestSellers =
        shouldLoadSameCategory &&
        sameCategoryStatus !== "pending" &&
        sameCategoryProducts.length === 0;

    const {
        data: bestSellerData,
        status: bestSellerStatus,
    } = trpc.brands.products.getProducts.useQuery(
        {
            limit: FALLBACK_QUERY_LIMIT,
            page: 1,
            isPublished: true,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            verificationStatus: "approved",
            sortBy: "best-sellers",
            sortOrder: "desc",
            requireMedia: true,
        },
        {
            enabled: shouldLoadBestSellers,
            retry: false,
            refetchOnWindowFocus: false,
        }
    );

    const bestSellerProducts = React.useMemo(
        () =>
            (bestSellerData?.data ?? []).filter(
                (product): product is RecommendationProduct =>
                    !!product?.id && product.id !== excludeProductId
            ),
        [bestSellerData?.data, excludeProductId]
    );

    const finalProducts = React.useMemo(() => {
        const seen = new Set<string>();
        const merged = [
            ...normalizedPrimaryProducts,
            ...sameBrandProducts,
            ...sameCategoryProducts,
            ...bestSellerProducts,
        ].filter((product) => {
            if (!product?.id || seen.has(product.id)) return false;
            seen.add(product.id);
            return true;
        });

        return merged.slice(0, FINAL_RECOMMENDATION_LIMIT);
    }, [
        bestSellerProducts,
        normalizedPrimaryProducts,
        sameBrandProducts,
        sameCategoryProducts,
    ]);

    const isResolvingFallbacks =
        primaryStatus === "pending" ||
        (shouldLoadSameBrand && sameBrandStatus === "pending") ||
        (shouldLoadSameCategory && sameCategoryStatus === "pending") ||
        (shouldLoadBestSellers && bestSellerStatus === "pending");

    if (isResolvingFallbacks) {
        return (
            <div
                className={cn(
                    "w-full px-4 py-8",
                    className
                )}
                {...props}
            >
                <div className="mx-auto w-full max-w-screen-3xl grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-lg border border-neutral-100 bg-white"
                        >
                            <div className="aspect-[3/4] animate-pulse bg-neutral-100" />
                            <div className="space-y-2 p-3">
                                <div className="h-3 animate-pulse rounded bg-neutral-100" />
                                <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!finalProducts.length) return null;

    return (
        <div
            className={cn(
                "w-full bg-white py-5 md:py-7",
                className
            )}
            {...props}
        >
            <section>
                <div className="max-w-screen-3xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <SectionHeader title="You May Like" />
                    <RecommendationCarousel
                        products={finalProducts}
                        userId={userId}
                    />
                </div>
            </section>
        </div>
    );
};

export default YouMayAlsoLike;

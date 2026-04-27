"use client";

import { ProductCard as HomeProductCard } from "@/components/home/new-home-page/new-arrivals";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import React from "react";

type YouMayAlsoLikeProps = React.HTMLAttributes<HTMLDivElement> & {
    categoryId: string;
    excludeProductId: string;
    userId?: string;
};

const YOU_MAY_LIKE_COUNT = 14;
const PEOPLE_ALSO_LIKED_COUNT = 14;

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

const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-8 flex flex-col items-start">
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
    categoryId,
    excludeProductId,
    userId,
    ...props
}: YouMayAlsoLikeProps) => {
    void categoryId;
    const {
        data: allProducts = [],
        isLoading,
        error,
    } = trpc.brands.products.getRecommendations.useQuery({
        productId: excludeProductId,
    });

    if (isLoading) {
        return (
            <div
                className={cn(
                    "w-full px-4 py-10 text-center text-sm text-stone-400",
                    className
                )}
                {...props}
            >
                Loading recommendations...
            </div>
        );
    }

    if (error || !allProducts.length) return null;

    const youMayLike = allProducts.slice(0, YOU_MAY_LIKE_COUNT);
    // Get next batch for "People Also Liked"
    const peopleAlsoLikedTotal = allProducts.slice(
        YOU_MAY_LIKE_COUNT,
        YOU_MAY_LIKE_COUNT + PEOPLE_ALSO_LIKED_COUNT
    );

    return (
        <div
            className={cn(
                "w-full space-y-10 bg-white py-10 md:space-y-14 md:py-14",
                className
            )}
            {...props}
        >
            {/* Section 1: You May Like (Always 14 - 2 rows of 7) */}
            {youMayLike.length > 0 && (
                <section>
                    <div className="max-w-screen-3xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                        <SectionHeader title="You May Like" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-7">
                            {youMayLike.map((product) => (
                                <HomeProductCard
                                    key={product.id}
                                    product={adaptRecommendationProduct(product)}
                                    userId={userId}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Section 2: People Also Liked (7 -> 14) */}
            {peopleAlsoLikedTotal.length > 0 && (
                <section>
                    <div className="max-w-screen-3xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                        <SectionHeader title="People Also Liked" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-7">
                            {peopleAlsoLikedTotal.map((product) => (
                                <HomeProductCard
                                    key={product.id}
                                    product={adaptRecommendationProduct(product)}
                                    userId={userId}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default YouMayAlsoLike;

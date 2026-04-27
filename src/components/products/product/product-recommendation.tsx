"use client";

import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

type YouMayAlsoLikeProps = React.HTMLAttributes<HTMLDivElement> & {
    categoryId: string;
    excludeProductId: string;
};

const YOU_MAY_LIKE_COUNT = 14;
const PEOPLE_ALSO_LIKED_COUNT = 14;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProductCard = ({ product }: { product: any }) => {
    const sellingPricePaise = product.price ?? 0;
    const mrpPaise = product.compare_at_price ?? product.compareAtPrice ?? 0;

    const sellingPrice = convertPaiseToRupees(sellingPricePaise);
    const mrp = mrpPaise ? convertPaiseToRupees(mrpPaise) : null;

    const discountPercent =
        mrpPaise && mrpPaise > sellingPricePaise
            ? Math.round(((mrpPaise - sellingPricePaise) / mrpPaise) * 100)
            : 0;

    return (
        <Link
            href={`/products/${product.slug ?? product.id}`}
            className="group block"
        >
            {/* Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-[#F5F5F5]">
                {product?.media?.[0]?.url ? (
                    <Image
                        src={product.media[0].url}
                        alt={product?.title ?? "Product Image"}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <ShoppingBag className="size-8 text-stone-300" />
                    </div>
                )}

                {discountPercent > 0 && (
                    <span className="absolute left-0 top-2 rounded-r-sm bg-[#E95123] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                        -{discountPercent}%
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="mt-2 space-y-0.5">
                {product.brand && (
                    <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                        {product.brand}
                    </p>
                )}

                <h3 className="line-clamp-1 text-xs font-normal text-gray-800 transition-colors group-hover:text-gray-600 sm:text-sm">
                    {product.title}
                </h3>

                <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-sm font-semibold text-gray-900">
                        Rs. {sellingPrice.toLocaleString("en-IN")}
                    </span>
                    {mrp && mrpPaise > sellingPricePaise && (
                        <>
                            <span className="text-xs text-gray-400 line-through">
                                Rs. {mrp.toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs font-medium text-green-600">
                                ({discountPercent}% off)
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
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
                                <ProductCard key={product.id} product={product} />
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
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default YouMayAlsoLike;

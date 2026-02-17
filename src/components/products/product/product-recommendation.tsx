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
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-stone-100">
                {product?.media?.[0]?.url ? (
                    <Image
                        src={product.media[0].url}
                        alt={product?.title ?? "Product Image"}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <ShoppingBag className="size-8 text-stone-300" />
                    </div>
                )}

                {discountPercent > 0 && (
                    <span className="absolute left-2 top-2 rounded-sm bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {discountPercent}% off
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="mt-2.5 space-y-0.5">
                {product.brand && (
                    <p className="truncate text-[10px] font-medium uppercase tracking-wider text-stone-400">
                        {product.brand}
                    </p>
                )}

                <h3 className="line-clamp-1 text-[13px] font-medium text-stone-800 transition-colors group-hover:text-stone-600">
                    {product.title}
                </h3>

                <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-sm font-semibold text-stone-900">
                        ₹{sellingPrice.toLocaleString("en-IN")}
                    </span>
                    {mrp && mrpPaise > sellingPricePaise && (
                        <>
                            <span className="text-xs text-stone-400 line-through">
                                ₹{mrp.toLocaleString("en-IN")}
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
    <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-stone-800">
            {title}
        </h2>
        <div className="h-px flex-1 bg-stone-200" />
    </div>
);

const YouMayAlsoLike = ({
    className,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    categoryId: _categoryId,
    excludeProductId,
    ...props
}: YouMayAlsoLikeProps) => {
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
                Loading recommendations…
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
        <div className={cn("w-full space-y-12 py-10", className)} {...props}>
            {/* Section 1: You May Like (Always 14 - 2 rows of 7) */}
            {youMayLike.length > 0 && (
                <section className="px-4 md:px-6">
                    <SectionHeader title="You May Like" />
                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                        {youMayLike.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Section 2: People Also Liked (7 -> 14) */}
            {peopleAlsoLikedTotal.length > 0 && (
                <section className="px-4 md:px-6">
                    <SectionHeader title="People Also Liked" />
                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                        {peopleAlsoLikedTotal.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default YouMayAlsoLike;

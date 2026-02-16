"use client";

import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

type YouMayAlsoLikeProps = React.HTMLAttributes<HTMLDivElement> & {
    categoryId: string;
    excludeProductId: string;
    limit?: number;
};

// 🔑 Show 30 products on first render
const INITIAL_VISIBLE = 30;
const BATCH_SIZE = 20;

const YouMayAlsoLike = ({
    className,
    categoryId,
    excludeProductId,
    limit = 500,
    ...props
}: YouMayAlsoLikeProps) => {
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    // ✅ useQuery handles fetching, loading, and error
    const {
        data: allProducts = [],
        isLoading,
        error,
    } = trpc.brands.products.getRecommendations.useQuery({
        productId: excludeProductId,
    });

    // Infinite scroll
    useEffect(() => {
        if (!loaderRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) =>
                        Math.min(prev + BATCH_SIZE, allProducts.length)
                    );
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [allProducts.length]);

    // Loading state
    if (isLoading) {
        return (
            <div
                className={cn("w-full px-4 py-8 text-center", className)}
                {...props}
            >
                Loading recommendations…
            </div>
        );
    }

    // Error or no products
    if (error || !allProducts.length) return null;

    // Limit products
    const limitedProducts = allProducts.slice(0, limit);
    const visibleProducts = limitedProducts.slice(0, visibleCount);

    return (
        <div className={cn("w-full px-4 py-8", className)} {...props}>
            <h2 className="mb-8 text-2xl font-medium text-gray-900">
                You May Also Like
            </h2>

            {/* ✅ Responsive grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-6">
                {visibleProducts.map((product) => {
                    const sellingPricePaise = product.price ?? 0;
                    const mrpPaise =
                        product.compare_at_price ?? product.compareAtPrice ?? 0;

                    const sellingPrice =
                        convertPaiseToRupees(sellingPricePaise);
                    const mrp = mrpPaise
                        ? convertPaiseToRupees(mrpPaise)
                        : null;

                    return (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug ?? product.id}`}
                            className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50 shadow-sm transition-shadow duration-200 hover:shadow-md"
                        >
                            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-white">
                                {product?.media?.[0]?.url ? (
                                    <Image
                                        src={product.media[0].url}
                                        alt={product?.title ?? "Product Image"}
                                        width={400}
                                        height={400}
                                        className="max-h-full max-w-full object-contain p-4"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <ShoppingBag className="h-10 w-10 text-gray-300" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 p-4">
                                {product.brand && (
                                    <p className="inline-block rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
                                        {product.brand}
                                    </p>
                                )}

                                <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium text-gray-900">
                                    {product.title}
                                </h3>

                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-semibold text-gray-900">
                                        ₹{sellingPrice}
                                    </span>
                                    {mrp && mrp > sellingPrice && (
                                        <span className="text-sm text-gray-500 line-through">
                                            ₹{mrp}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Infinite loader */}
            {visibleCount < limitedProducts.length && (
                <div ref={loaderRef} className="py-8 text-center text-gray-500">
                    Loading more…
                </div>
            )}
        </div>
    );
};

export default YouMayAlsoLike;

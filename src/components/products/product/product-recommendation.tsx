"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

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
  const { data: allProducts = [], isLoading, error } =
    trpc.brands.products.getRecommendations.useQuery({
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
      <div className={cn("w-full px-4 py-8 text-center", className)} {...props}>
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
      <h2 className="text-2xl font-medium text-gray-900 mb-8">
        You May Also Like
      </h2>

      {/* ✅ Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
        {visibleProducts.map((product) => {
          const sellingPricePaise = product.cost_per_item ?? product.price ?? 0;
          const mrpPaise =
            product.compare_at_price ?? product.compareAtPrice ?? 0;

          const sellingPrice = convertPaiseToRupees(sellingPricePaise);
          const mrp = mrpPaise ? convertPaiseToRupees(mrpPaise) : null;

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug ?? product.id}`}
              className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                <Image
                  src={
                    product?.media?.[0]?.url ??
                    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                  }
                  alt={product?.title ?? "Product Image"}
                  width={400}
                  height={400}
                  className="max-h-full max-w-full object-contain p-4"
                />
              </div>

              <div className="p-4 space-y-2">
                {/* 🌟 Brand */}
                {product.brand && (
                  <p className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-2 py-0.5 rounded">
                    {product.brand}
                  </p>
                )}

                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">
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

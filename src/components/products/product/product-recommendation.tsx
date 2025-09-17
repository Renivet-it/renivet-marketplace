"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

type YouMayAlsoLikeProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Current product's category to fetch similar products */
  categoryId: string;
  /** Optionally exclude the current product */
  excludeProductId?: string;
  /** How many products to show (defaults to 6) */
  limit?: number;
};

const YouMayAlsoLike = ({
  className,
  categoryId,
  excludeProductId,
  limit = 6,
  ...props
}: YouMayAlsoLikeProps) => {
  // 🔌 Fetch related products from tRPC
  const { data: products, isLoading, isError } =
    trpc.brands.products.getRecommendations.useQuery({
      categoryId,
      excludeProductId,
      limit,
    });

  if (isLoading) {
    return (
      <div className={cn("w-full px-4 py-8 text-center", className)} {...props}>
        Loading recommendations…
      </div>
    );
  }

  if (isError || !products?.length) {
    return null; // Hide section if nothing to show
  }

  return (
    <div className={cn("w-full px-4 py-8", className)} {...props}>
      {/* Section Title */}
      <h2 className="text-2xl font-medium text-gray-900 mb-8">
        You May Also Like
      </h2>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug ?? product.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <Image
                src={product.media?.[0]?.url ?? "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"}
                alt={product.title}
                width={300}
                height={300}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              {/* Product Name */}
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">
                {product.title}
              </h3>

              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  ₹{product.price}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    ₹{product.compareAtPrice}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default YouMayAlsoLike;

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { getAdvancedRecommendations } from "@/lib/python/product-recommendation";

type YouMayAlsoLikeProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Current product's category (not used in API, but kept for compatibility) */
  categoryId: string;
  /** Use this as productId for recommendations */
  excludeProductId: string;
  /** How many products to show (defaults to 16) */
  limit?: number;
};

const YouMayAlsoLike = ({
  className,
  categoryId, // kept for props compatibility
  excludeProductId,
  limit = 16,
  ...props
}: YouMayAlsoLikeProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!excludeProductId) return;

    setLoading(true);
    getAdvancedRecommendations(excludeProductId)
      .then((res) => {
        setProducts(res.slice(0, limit));
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load recommendations");
      })
      .finally(() => setLoading(false));
  }, [excludeProductId, limit]);

  if (loading) {
    return (
      <div className={cn("w-full px-4 py-8 text-center", className)} {...props}>
        Loading recommendations…
      </div>
    );
  }

  if (error || !products.length) {
    return null;
  }

  return (
    <div className={cn("w-full px-4 py-8", className)} {...props}>
      <h2 className="text-2xl font-medium text-gray-900 mb-8">
        You May Also Like
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {products.map((product) => {
          // Safely get prices in paise and convert
          const sellingPricePaise =
            product.cost_per_item ??
            product.price ??
            0; // cost_per_item preferred, fallback to price
          const mrpPaise = product.compare_at_price ?? product.compareAtPrice ?? 0;

          const sellingPrice = convertPaiseToRupees(sellingPricePaise);
          const mrp = mrpPaise ? convertPaiseToRupees(mrpPaise) : null;

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug ?? product.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                <Image
                  src={
                    product?.media?.[0]?.url ??
                    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                  }
                  alt={product?.title ?? "Product Image"}
                  width={300}
                  height={300}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
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
    </div>
  );
};

export default YouMayAlsoLike;

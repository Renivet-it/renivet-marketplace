// components/products/you-may-also-like.tsx
"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type YouMayAlsoLikeProps = React.HTMLAttributes<HTMLDivElement>

const YouMayAlsoLike = ({ className, ...props }: YouMayAlsoLikeProps) => {
  // Static data for now - replace with dynamic data later
  const products = [
    {
      id: 1,
      name: "Organic cotton tote bag",
      price: "50 Rs.",
      originalPrice: "70 Rs.",
      reviews: "235 Reviews",
      image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
    },
    {
      id: 2,
      name: "Hemp backpack",
      price: "999 Rs.",
      originalPrice: "1199 Rs.",
      reviews: "729 Reviews",
      image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
    },
    {
      id: 3,
      name: "Organic cotton T-shirts",
      price: "499 Rs.",
      originalPrice: "699 Rs.",
      reviews: "825 Reviews",
      image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
    },
    {
      id: 4,
      name: "Organic cotton tote bag",
      price: "50 Rs.",
      originalPrice: "70 Rs.",
      reviews: "235 Reviews",
      image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
    },
    {
      id: 5,
      name: "Hemp backpack",
      price: "999 Rs.",
      originalPrice: "1199 Rs.",
      reviews: "729 Reviews",
      image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
    },
    {
      id: 6,
      name: "Organic cotton T-shirts",
      price: "499 Rs.",
      originalPrice: "699 Rs.",
      reviews: "825 Reviews",
      image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
    }
  ];

  return (
    <div className={cn("w-full px-4 py-8", className)} {...props}>
      {/* Section Title */}
      <h2 className="text-2xl font-medium text-gray-900 mb-8">
        You May Also Like
      </h2>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-3">
              {/* Product Name */}
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">
                {product.name}
              </h3>

              {/* Price */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  {product.price}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {product.originalPrice}
                </span>
              </div>

              {/* Reviews */}
              <p className="text-xs text-gray-600">{product.reviews}</p>

              {/* Buy Now Button */}
              <button className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded transition-colors duration-200">
                BUY NOW
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouMayAlsoLike;
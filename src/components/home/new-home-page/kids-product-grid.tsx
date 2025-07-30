"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  brand: { name: string };
  title: string;
  variants?: {
    price: number;
    compareAtPrice?: number;
  }[];
  price?: number;
  compareAtPrice?: number;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGrid({ className, products, title = "Kids", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products)) return null;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-sm ${index < rating ? "text-orange-400" : "text-gray-300"}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className={cn("bg-[#F4F0EC] py-8", className)} {...props}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="border-b-2 border-blue-500 inline-block">
            <h1 className="text-2xl font-semibold text-gray-800 pb-2">{title}</h1>
          </div>
        </div>

        {/* Horizontal scroll for mobile */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex space-x-4 w-max">
            {products.slice(0, 5).map(({ product }, index) => {
              const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);
              const originalPrice = product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
              const convertedOriginalPrice = originalPrice ? convertPaiseToRupees(originalPrice) : null;

              return (
                <div key={product.id} className="w-[253px] flex-shrink-0">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                    {/* Product Image Container - Fills inner container */}
                    <div className="w-full h-64 bg-white p-4">
                      <div className="border border-gray-200 w-full h-full relative">
                        <Link href={`/products/${product.slug}`} className="block w-full h-full">
                          <Image
                            src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                            alt={product.title}
                            fill
                            className="object-cover"
                            style={{ objectFit: "cover" }}
                          />
                        </Link>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-medium text-gray-800 mb-1">
                        {product.title}
                      </h3>
                      <span className="text-xs text-gray-500 mb-2">{product.brand.name}</span>

                      <div className="mt-auto">
                        <span className="text-lg font-semibold text-gray-800">₹{price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Grid - 5 columns */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.slice(0, 5).map(({ product }, index) => {
            const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);
            const originalPrice = product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
            const convertedOriginalPrice = originalPrice ? convertPaiseToRupees(originalPrice) : null;

            return (
              <div key={product.id} className="w-full">
                <div className="bg-[#dcddd7] rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                  {/* Product Image Container - Fills inner container */}
                  <div className="w-full h-64 bg-[#dcddd7] p-4">
                    <div className="border border-gray-200 w-full h-full relative">
                      <Link href={`/products/${product.slug}`} className="block w-full h-full">
                        <Image
                          src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                          alt={product.title}
                          fill
                          className="object-cover"
                          style={{ objectFit: "cover" }}
                        />
                      </Link>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                      {product.title}
                    </h3>
                    <span className="text-xs text-gray-500 mb-2">{product.brand.name}</span>

                    <div className="mt-auto">
                      <span className="text-lg font-semibold text-gray-800">₹{price}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
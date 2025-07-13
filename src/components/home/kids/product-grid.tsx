"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button-general";
import { Star } from "lucide-react";

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
  rating?: number;
  reviewCount?: number;
  status?: string;
  tags?: string[];
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGrid({ className, products, title = "Little Reinivet", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const getProductData = (product: Product) => {
    const priceInPaise = product.variants?.[0]?.price || product.price || 0;
    const originalPriceInPaise = product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
    const price = convertPaiseToRupees(priceInPaise);
    const originalPrice = originalPriceInPaise ? convertPaiseToRupees(originalPriceInPaise) : undefined;

    return {
      price,
      originalPrice,
      rating: product.rating,
      reviews: product.reviewCount,
      status: product.status,
      isBestSeller: product.tags?.includes("Best Seller"),
      isSolo: product.tags?.includes("Solo")
    };
  };

  return (
    <section className={cn("w-full px-4 py-6 bg-[#d0d7cf]", className)} {...props}>
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <Link href="/products" className="text-xs font-medium text-gray-600 hover:text-gray-900 underline">
            View all
          </Link>
        </div>

        {/* Mobile: Horizontal scroll with 3 cards in view */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex space-x-3 w-max">
            {products.slice(0, 3).map(({ product }) => {
              const {
                price,
                originalPrice,
                rating,
                reviews,
                status,
                isBestSeller,
                isSolo
              } = getProductData(product);

              return (
                <div key={product.id} className="w-[140px] flex-shrink-0">
                  <Card className="border border-gray-200 rounded-lg shadow-xs h-full flex flex-col">
                    <CardHeader className="p-0 relative aspect-square">
                      <Link href={`/products/${product.slug}`} className="block h-full">
                        <div className="relative w-full h-full">
                          <Image
                            src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="140px"
                          />
                        </div>
                      </Link>
                      {isSolo && (
                        <div className="absolute top-1 left-1 bg-white text-[8px] font-bold px-1 py-0.5 rounded-xs">
                          SOLO
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="p-2 flex-grow flex flex-col">
                      <div className="mb-1">
                        <p className="text-[10px] text-gray-500 truncate">{product.brand.name}</p>
                        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
                          {product.title}
                        </h3>
                      </div>

                      <div className="mt-auto">
                        <div className="text-xs font-bold text-gray-900">
            {/* @ts-ignore */}

                          ₹{typeof price === "number" ? price.toFixed(0) : price}
                        </div>
                        {originalPrice && (
                          <div className="text-[10px] text-gray-500 line-through">
            {/* @ts-ignore */}

                            ₹{typeof originalPrice === "number" ? originalPrice.toFixed(0) : originalPrice}
                          </div>
                        )}

                        <Button className="w-full mt-1 bg-black text-white rounded-sm py-1 text-[10px] font-medium">
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop: Normal grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.slice(0, 3).map(({ product }) => {
            const {
              price,
              originalPrice,
              rating,
              reviews,
              status,
              isBestSeller,
              isSolo
            } = getProductData(product);

            return (
              <div key={product.id} className="w-full">
                <Card className="border border-gray-200 rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                  <CardHeader className="p-0 relative group aspect-square">
                    <Link href={`/products/${product.slug}`} className="block h-full">
                      <div className="relative w-full h-full">
                        <Image
                          src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    </Link>

                    <div className="absolute top-2 left-2 space-y-1">
                      {isSolo && (
                        <div className="bg-white text-xs font-bold px-2 py-1 rounded-sm">
                          SOLO 50%
                        </div>
                      )}
                      {isBestSeller && (
                        <div className="bg-black text-white text-xs font-bold px-2 py-1 rounded-sm">
                          BEST SELLER
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{product.title}</h3>
                        <p className="text-xs text-gray-500">{product.brand.name}</p>
                      </div>
                      {rating && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                          {rating}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto">
                      <div className="text-base font-bold text-gray-900">
            {/* @ts-ignore */}
                        ₹{typeof price === "number" ? price.toFixed(2) : price}
                      </div>
                      {originalPrice && (
                        <div className="text-xs text-gray-500 line-through">
            {/* @ts-ignore */}
                          ₹{typeof originalPrice === "number" ? originalPrice.toFixed(2) : originalPrice}
                        </div>
                      )}

                      <Button className="w-full mt-3 bg-black hover:bg-gray-800 text-white rounded-md py-2 text-sm font-medium">
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
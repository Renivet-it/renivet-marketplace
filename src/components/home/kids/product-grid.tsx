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
    <section className={cn("w-full px-4 py-8 bg-[#d0d7cf]", className)} {...props}>
      <div className="max-w-[1280px] mx-auto"> {/* Increased max-width to accommodate 3 cards */}
        <div className="flex justify-between items-center mb-8 px-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Show all
          </Link>
        </div>

        <div className="flex gap-4 px-4 pb-4 justify-between"> {/* Removed overflow-x-auto, added justify-between */}
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
              <div key={product.id} className="flex-shrink-0 w-[393px]"> {/* Kept card width */}
                <Card className="border border-gray-200 rounded-none shadow-none p-0 h-[604px]">
                  <CardHeader className="p-0 relative group h-[393px]">
                    <Link href={`/products/${product.slug}`} className="block h-full">
                      <div className="relative w-full h-full overflow-hidden">
                        <Image
                          src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:opacity-90 transition-opacity"
                          sizes="393px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    </Link>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 space-y-2">
                      {isSolo && (
                        <div className="bg-white text-xs font-bold px-3 py-1 rounded-sm">
                          SOLO 50%
                        </div>
                      )}
                      {isBestSeller && (
                        <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded-sm">
                          BEST SOLO
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 h-[211px] flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-[15px] font-medium text-gray-900 mb-1">
                          {product.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {product.brand.name}
                        </p>
                      </div>
                      {rating && reviews && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                          {rating} ({reviews})
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="text-base font-bold text-gray-900">
                          {/* @ts-ignore */}
                        ₹{typeof price === "number" ? price.toFixed(2) : price}
                      </div>
                      {originalPrice && originalPrice > price && (
                        <div className="text-xs text-gray-500 line-through mt-1">
                          {/* @ts-ignore */}
                          ₹{typeof originalPrice === "number" ? originalPrice.toFixed(2) : (originalPrice ?? "")}
                        </div>
                      )}
                    </div>

                    {status && (
                      <div className="text-xs text-red-500 mt-2">
                        {status}
                      </div>
                    )}

                    <Button className="w-full mt-auto bg-black hover:bg-gray-900 text-white rounded-none py-3 text-sm font-medium">
                      ADD TO CART
                    </Button>
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
"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  variants?: {
    price: number;
    compareAtPrice?: number;
  }[];
  price?: number;
  compareAtPrice?: number;
  tags?: string[];
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGrid({ className, products, title = "top picks for you", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -339, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 339, behavior: "smooth" });
    }
  };

  const getProductData = (product: Product) => {
    const priceInPaise = product.variants?.[0]?.price || product.price || 0;
    const originalPriceInPaise = product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
    const price = convertPaiseToRupees(priceInPaise);
    const originalPrice = originalPriceInPaise ? convertPaiseToRupees(originalPriceInPaise) : undefined;
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice * 100)) : undefined;

    return {
      price,
      originalPrice,
      discount,
      category: product.tags?.find((tag) => ["STAND", "CANDLE", "PLANT"].includes(tag))
    };
  };

  return (
    <section className={cn("w-full px-4 py-12 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-medium text-gray-900 mb-4">{title}</h2>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Bibendum quis facilisi aliquet massa in pharetra nisi etiam ornare. Tellus
            feugiat egestas nulla sem vel mi dictum nisi.Vivamus sem eget vestibul...
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Carousel Navigation Buttons */}
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-8 px-4 py-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
          >
            {products.map(({ product }) => {
              const {
                price,
                originalPrice,
                discount,
                category
              } = getProductData(product);

              return (
                <div 
                  key={product.id} 
                  className="flex-shrink-0 w-[339px] snap-start"
                >
                  <Card className="border-0 shadow-none p-0 h-[494px] bg-transparent">
                    <CardHeader className="p-0 relative h-[339px]">
                      <Link href={`/products/${product.slug}`} className="block h-full">
                        <div className="relative w-full h-full overflow-hidden">
                          <Image
                            src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="339px"
                          />
                        </div>
                      </Link>

                      {discount && (
                        <div className="absolute top-4 right-4 bg-white text-black text-lg font-bold px-3 py-1">
                          -{discount}%
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="p-0 pt-6 h-[155px]">
                      {category && (
                        <p className="text-sm text-gray-500 mb-1 uppercase">
                          {category}
                        </p>
                      )}
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        {product.title}
                      </h3>
                      <div className="text-xl font-medium text-gray-900">
                        ₹{typeof price === "number" ? price.toFixed(2) : price}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
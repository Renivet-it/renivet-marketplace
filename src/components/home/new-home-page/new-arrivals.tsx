"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  variants?: { price: number }[];
  price?: number;
  rating?: number;
  reviewCount?: number;
  stockStatus?: string;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGridNewArrivals({
  className,
  products,
  title = "Renivet Favorites",
  ...props
}: ProductGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });

      const newSlide =
        direction === "left"
          ? Math.max(0, currentSlide - 1)
          : Math.min(products.length - 1, currentSlide + 1);
      setCurrentSlide(newSlide);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  return (
    <section
      className={cn(
        "w-full bg-[#F4F0EC] sm:py-16 py-4 px-2 sm:px-6",
        className
      )}
      {...props}
    >
      <div className="max-w-screen-2xl mx-auto">
        {/* ---------------------------- DESKTOP TITLE ---------------------------- */}
        <div className="hidden sm:block text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-base text-gray-600">
            Beautifully Functional. Purposefully Designed. Consciously Crafted.
          </p>
        </div>

        {/* ---------------------------- MOBILE TITLE ---------------------------- */}
        <div className="sm:hidden text-center mb-2">
          <h2 className="text-lg font-normal text-gray-900 leading-tight">
            {title}
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Beautifully Functional. Purposefully Designed. Consciously Crafted.
          </p>
        </div>

        {/* ---------------------------- DESKTOP VIEW ---------------------------- */}
        <div className="hidden sm:block relative">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="arrow-button absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300"
            style={{ marginLeft: "-24px" }}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="arrow-button absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300"
            style={{ marginRight: "-24px" }}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="scrollable-container flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          >
            {products.map(({ product }) => (
              <div key={product.id} className="product-card flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Desktop Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: Math.min(products.length, 5) }).map(
              (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide % 5 ? "bg-gray-800" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              )
            )}
          </div>
        </div>

        {/* ---------------------------- MOBILE HORIZONTAL SCROLL ---------------------------- */}
        <div className="sm:hidden relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          >
            {products.map(({ product }) => (
              <div key={product.id} className="flex-shrink-0 w-[140px]">
                <ProductCardMobile product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------- MOBILE VIEW CSS ---------------------------- */}
      <style jsx>{`
        @media (max-width: 640px) {
          .product-card h3 {
            font-size: 11px;
            line-height: 1.2;
          }
          .product-card p {
            font-size: 9px;
          }
        }
      `}</style>
    </section>
  );
}

/* ---------------------------- DESKTOP CARD ---------------------------- */
function ProductCard({ product }: { product: Product }) {
  const price = convertPaiseToRupees(
    product.variants?.[0]?.price || product.price || 0
  );

  return (
    <Link href={`/products/${product.slug}`} className="block">
      <div
        className="relative bg-gray-50 rounded-lg overflow-hidden mb-4 group-hover:shadow-md transition-shadow duration-300"
        style={{ width: "262px", height: "421px" }}
      >
        <Image
          src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="262px"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {product.title}
        </h3>
        <p className="text-xs text-gray-500">
          {product.stockStatus || "Available"}
        </p>
        <p className="text-lg font-semibold text-gray-900">
          {typeof price === "number" ? price.toFixed(0) : price}
        </p>
      </div>
    </Link>
  );
}

/* ---------------------------- MOBILE IMAGE + TEXT ---------------------------- */

function ProductCardMobile({ product }: { product: Product }) {
  const price = convertPaiseToRupees(
    product.variants?.[0]?.price || product.price || 0
  );

  const images = product.media?.map((m) => m.mediaItem?.url) || [];

  return (
    <Link href={`/products/${product.slug}`} className="block">
      {/* Horizontal Scroll Images */}
      <div className="flex overflow-x-auto space-x-2 snap-x snap-mandatory">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`relative flex-shrink-0 snap-start rounded-md overflow-hidden ${
              idx === 0 ? "w-full pt-[130%]" : "w-1/2 pt-[65%]"
            }`}
          >
            <Image
              src={img || "/placeholder-product.jpg"}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Text */}
      <div className="mt-2 text-center">
        <h3 className="text-xs font-normal line-clamp-2">{product.title}</h3>
        <p className="text-[11px] text-gray-500">
          {product.stockStatus || "Available"}
        </p>
        <p className="text-xs font-semibold text-gray-900">
          {typeof price === "number" ? price.toFixed(0) : price}
        </p>
      </div>
    </Link>
  );
}

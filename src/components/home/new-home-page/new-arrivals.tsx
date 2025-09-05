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
  variants?: {
    price: number;
  }[];
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
      const scrollAmount = 280; // Card width + gap
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
    <section className={cn("w-full py-16 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-base text-gray-600">
            Beautifully Functional. Purposefully Designed. Consciously Crafted.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="arrow-button absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300"
            style={{ marginLeft: "-24px" }}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="arrow-button absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300"
            style={{ marginRight: "-24px" }}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Scrollable Products Container */}
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

          {/* Dots Indicator */}
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
      </div>

      <style jsx>{`
  @media (max-width: 640px) {
    .scrollable-container {
      gap: 16px; /* space between products */
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-bottom: 8px;
    }

    .product-card {
      flex: 0 0 auto;
      width: 140px;  /* small card width */
      height: 220px; /* small card height */
      scroll-snap-align: start;
    }

    .product-card + .product-card {
      margin-left: 12px; /* additional spacing between cards */
    }

    .arrow-button {
      display: none; /* hide arrows on mobile */
    }

    .product-card h3 {
      font-size: 12px;
    }

    .product-card p {
      font-size: 10px;
    }

    .product-card div.relative {
      height: 140px !important; /* smaller image */
    }
  }
`}</style>

    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const price = convertPaiseToRupees(
    product.variants?.[0]?.price || product.price || 0
  );

  return (
    <Link href={`/products/${product.slug}`} className="block">
      {/* Product Image */}
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

      {/* Product Info */}
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

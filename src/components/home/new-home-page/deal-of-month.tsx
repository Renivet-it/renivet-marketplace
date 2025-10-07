"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { MarketingStrip as TypeMarketingStrip } from "@/lib/validations";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps extends GenericProps {
  marketingStrip: TypeMarketingStrip[];
}

export function DealofTheMonthStrip({
  className,
  marketingStrip,
  ...props
}: PageProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
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
      className={cn("w-full bg-[#F4F0EC] py-10 relative overflow-hidden", className)}
      {...props}
    >
      <div className="max-w-screen-3xl mx-auto px-6 relative">
        {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300 ${
              canScrollLeft
                ? "hover:bg-gray-100 cursor-pointer"
                : "opacity-40 cursor-not-allowed"
            }`}
            style={{ marginLeft: "-24px" }}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300 ${
              canScrollRight
                ? "hover:bg-gray-100 cursor-pointer"
                : "opacity-40 cursor-not-allowed"
            }`}
            style={{ marginRight: "-24px" }}
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Scrollable Full-Image Cards */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {marketingStrip.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 relative rounded-2xl overflow-hidden group cursor-pointer"
                style={{ width: "230px", height: "230px" }}
              >
                {/* Full Image */}
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="230px"
                />

                {/* Clickable Overlay */}
                <Link href={item.href || "/shop"} className="absolute inset-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

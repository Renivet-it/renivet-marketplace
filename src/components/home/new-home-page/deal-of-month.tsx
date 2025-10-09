"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
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
  // --- DESKTOP SCROLL LOGIC ---
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
      // Use a small buffer to ensure it reaches the end
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Effect to handle scroll state on mount and resize for desktop
  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      handleScroll(); // Initial check
      const checkScroll = () => handleScroll();
      window.addEventListener("resize", checkScroll);
      return () => window.removeEventListener("resize", checkScroll);
    }
  }, [marketingStrip]);

  // --- MOBILE DATA PREPARATION ---
  // Split the items into two rows for the mobile carousel
  const midIndex = Math.ceil(marketingStrip.length / 2);
  const firstRowItems = marketingStrip.slice(0, midIndex);
  const secondRowItems = marketingStrip.slice(midIndex);

  return (
    <section
      className={cn("w-full bg-[#F4F0EC] py-10", className)}
      {...props}
    >
      <div className="max-w-screen-3xl mx-auto px-4 sm:px-6">
        
        {/* --- MOBILE VERSION (Two-Row Carousel, 88x88 items) --- */}
        <div className="md:hidden flex flex-col gap-4">
          {/* First Row */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
            {firstRowItems.map((item, index) => (
              <Link
                key={`row1-${index}`}
                href={item.href || "/shop"}
                className="flex-shrink-0 relative rounded-xl overflow-hidden"
                style={{ width: "88px", height: "88px" }}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="88px"
                />
              </Link>
            ))}
          </div>
          {/* Second Row */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth">
            {secondRowItems.map((item, index) => (
              <Link
                key={`row2-${index}`}
                href={item.href || "/shop"}
                className="flex-shrink-0 relative rounded-xl overflow-hidden"
                style={{ width: "88px", height: "88px" }}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="88px"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* --- DESKTOP VERSION (Single-Row Carousel) --- */}
        <div className="hidden md:block relative">
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

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          >
            {marketingStrip.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 relative rounded-2xl overflow-hidden group cursor-pointer"
                style={{ width: "230px", height: "230px" }}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="230px"
                />
                <Link href={item.href || "/shop"} className="absolute inset-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

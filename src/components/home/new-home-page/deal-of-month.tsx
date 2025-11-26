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
      const scrollAmount = 400;
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

  useEffect(() => {
    const ref = scrollRef.current;
    if (ref) {
      handleScroll();
      window.addEventListener("resize", handleScroll);
      return () => window.removeEventListener("resize", handleScroll);
    }
  }, [marketingStrip]);

  // --- MOBILE SPLIT ---
  const midIndex = Math.ceil(marketingStrip.length / 2);
  const firstRowItems = marketingStrip.slice(0, midIndex);
  const secondRowItems = marketingStrip.slice(midIndex);

  return (
    <section
      className={cn("w-full bg-[#F4F0EC] py-10", className)}
      {...props}
    >
      <div className="max-w-screen-3xl mx-auto px-4 sm:px-6">

        {/* ---------------- MOBILE VERSION (UNCHANGED) ---------------- */}
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

        {/* ---------------- DESKTOP VERSION (UPDATED!) ---------------- */}
        <div className="hidden md:block relative">
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

          {/* Scroll Container */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          >
            {marketingStrip.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden"
                style={{ width: "372px", height: "566px" }}
              >
                {/* Image */}
                <div className="relative w-full" style={{ height: "486px" }}>
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="372px"
                  />
                </div>

                {/* Text Section */}
                <div className="px-4 pt-4">
                  <h3 className="text-[18px] font-medium text-gray-900 capitalize">
                    {item.title}
                  </h3>
                  <p className="text-[15px] text-gray-600 italic">
                    {item.description}
                  </p>
                </div>

                <Link href={item.href || "/shop"} className="absolute inset-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

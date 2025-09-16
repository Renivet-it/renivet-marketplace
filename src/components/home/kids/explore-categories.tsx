"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps extends GenericProps {
  shopByCategories: HomeShopByCategory[];
  titleData?: { title: string };
}

export function ExploreCategories({
  className,
  shopByCategories,
  titleData,
  ...props
}: PageProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setIsAtStart(scrollLeft === 0);
    setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className={cn("w-full bg-[#F4F0EC] py-6 sm:py-12", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto w-full relative px-4">
        {/* -------- Title -------- */}
        <h2 className="text-center text-lg sm:text-3xl font-semibold text-gray-900 mb-4 sm:mb-8">
          {titleData?.title || "Explore Categories"}
        </h2>

        {/* ================= DESKTOP VIEW ================= */}
        <div className="hidden sm:block relative">
          {/* Navigation arrows */}
          {!isAtStart && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {!isAtEnd && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}

          {/* Scrollable row */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            className="flex overflow-x-auto gap-6 pl-4 pb-4 scrollbar-hide"
          >
            {shopByCategories.map((category, index) => (
              <Link
                key={index}
                href={category.url || "/shop"}
                className="flex-shrink-0 group text-center w-[240px]"
              >
                <div className="w-full h-[240px] overflow-hidden border border-gray-200 rounded-lg transition-transform group-hover:scale-[1.02] hover:shadow-md">
                  <Image
                    src={category.imageUrl}
                    alt={category.title || "Category"}
                    width={240}
                    height={240}
                    quality={90}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-4 font-bold text-gray-900 text-lg uppercase tracking-wider">
                  {category.title || "CATEGORY"}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* ================= MOBILE VIEW ================= */}
        <div className="sm:hidden px-2">
          <div className="flex overflow-x-auto gap-4 scrollbar-hide">
            {shopByCategories.map((category, index) => (
              <Link
                key={index}
                href={category.url || "/shop"}
                className="flex-shrink-0 group text-center w-[120px]"
              >
                <div className="relative h-[130px] w-full overflow-hidden rounded-lg">
                  <Image
                    src={category.imageUrl}
                    alt={category.title || "Category"}
                    width={120}
                    height={130}
                    quality={90}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 font-normal text-gray-900 text-xs uppercase tracking-wide">
                  {category.title || "CATEGORY"}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

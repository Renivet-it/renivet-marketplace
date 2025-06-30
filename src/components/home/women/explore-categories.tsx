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
console.log(titleData, "titleData");
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setIsAtStart(scrollLeft === 0);
      setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      className={cn("flex w-full justify-center py-6", className)}
      {...props}
    >
      <div className="max-w-screen-xl mx-auto px-0 sm:px-4 w-full relative">
        {/* Title */}
        <h2 className="text-center text-3xl font-semibold text-gray-900 mb-8">
          {titleData?.title || "Explore Categories"}
        </h2>

        {/* Navigation Arrows */}
        {!isAtStart && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 hidden sm:block"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {!isAtEnd && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 hidden sm:block"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Scrollable Categories Row */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="flex overflow-x-auto space-x-4 sm:space-x-6 px-4 scrollbar-hide relative"
        >
          {shopByCategories.map((category, index) => (
            <Link
              key={index}
              href={category.url || "/shop"}
              className="flex-shrink-0 group text-center"
            >
              <div
                className="
                  w-[160px] h-[160px]
                  sm:w-[180px] sm:h-[180px]
                  md:w-[200px] md:h-[200px]
                  rounded-[24px] overflow-hidden
                  border border-gray-200 shadow-md
                  transition-transform group-hover:scale-105
                  hover:bg-gray-50
                "
              >
                <Image
                  src={category.imageUrl}
                  alt={"Category"}
                  width={200}
                  height={200}
                  quality={90}
                  className="w-full h-full object-cover"
                />
              </div>
              <p
                className="
                  mt-2 font-semibold text-gray-900
                  text-base truncate
                  w-[160px] sm:w-[180px] md:w-[200px]
                "
              >
                {/* //@ts-ignore// */}
                {category.title || "Category Title"}
              </p>
            </Link>
          ))}
        </div>

        {/* Mobile indicators */}
        <div className="flex justify-center mt-4 sm:hidden">
          {shopByCategories.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300 mx-1"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
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
      className={cn("flex w-full justify-center py-12 bg-[#F4F0EC]", className)}
      {...props}
    >
      <div className="max-w-screen-2xl mx-auto w-full relative">
        {/* Title */}
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-8 px-4">
          {titleData?.title || "Explore Categories"}
        </h2>

        {/* Navigation Arrows */}
        {!isAtStart && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 hidden sm:block"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {!isAtEnd && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 hidden sm:block"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Scrollable Categories Row */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="flex overflow-x-auto gap-6 pl-4 scrollbar-hide relative"
        >
          {shopByCategories.map((category, index) => (
            <Link
              key={index}
              href={category.url || "/shop"}
              className={cn(
                "flex-shrink-0 group text-center",
                index === 0 ? "ml-0" : ""
              )}
            >
              <div className="w-[240px] h-[300px] flex flex-col bg-[#F4F0EC] border border-gray-300">
                {/* Image Container */}
                <div className="relative h-[240px] w-full overflow-hidden border-b border-black-300">
                  <Image
                    src={category.imageUrl}
                    alt={category.title || "Category"}
                    width={240}
                    height={240}
                    quality={90}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Text Container */}
                <div className="h-[60px] w-full bg-[#F4F0EC] flex items-center justify-center px-2">
                  <p className="font-bold text-gray-900 text-lg text-center uppercase tracking-wider">
                    {category.title || "CATEGORY"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile indicators */}
        <div className="flex justify-center mt-4 sm:hidden px-4">
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
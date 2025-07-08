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
      className={cn("w-full bg-[#F4F0EC] pt-24 pb-12", className)}
      {...props}
    >
      <div className="max-w-screen-xl mx-auto w-full relative px-4">
        {/* Title with proper spacing */}
        <div className="mb-8">
          <h2 className="text-center text-3xl font-semibold text-gray-900">
            {titleData?.title || "Explore Categories"}
          </h2>
          <div className="w-20 h-1 bg-gray-300 mx-auto mt-4"></div>
        </div>

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
          className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide relative"
        >
          {shopByCategories.map((category, index) => (
            <Link
              key={index}
              href={category.url || "/shop"}
              className="flex-shrink-0 group text-center w-[200px] sm:w-[240px]"
            >
              <div
                className="
                  w-full h-[200px] sm:h-[240px]
                  overflow-hidden
                  border border-gray-200
                  transition-transform group-hover:scale-[1.02]
                  hover:shadow-md
                  rounded-lg
                "
              >
                <Image
                  src={category.imageUrl}
                  alt={"Category"}
                  width={240}
                  height={240}
                  quality={90}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <p
                className="
                  mt-4 font-medium text-gray-900
                  text-base
                  px-2
                "
              >
                {/* //@ts-ignore// */}
                {category.title || "Category Title"}
              </p>
            </Link>
          ))}
        </div>

        {/* Mobile indicators - removed since we have proper scrolling */}
      </div>
    </section>
  );
}
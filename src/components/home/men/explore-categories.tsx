"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps extends React.HTMLAttributes<HTMLElement> {
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
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section
      className={cn(
        "flex w-full justify-center py-2 sm:py-12 bg-[#FCFBFA] sm:bg-[#F4F0EC]",
        className
      )}
      {...props}
    >
      <div className="max-w-screen-2xl mx-auto w-full relative">
        {/* ---------- Title ---------- */}
        <h2
          className="text-center text-lg sm:text-3xl font-normal sm:font-bold text-gray-900 mb-2 sm:mb-8 px-1
                     font-serif sm:font-sans"
        >
          {titleData?.title || "Explore Categories"}
        </h2>

        {/* ---------- DESKTOP VIEW ---------- */}
        <div className="hidden sm:block relative">
          {/* Navigation Arrows */}
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

          {/* Scrollable Categories Row (Desktop) */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            className="flex overflow-x-auto gap-6 pl-4 scrollbar-hide"
          >
            {shopByCategories.map((category, index) => (
              <Link
                key={index}
                href={category.url || "/shop"}
                className="flex-shrink-0 group text-center"
              >
                <div className="w-[240px] h-[300px] flex flex-col bg-white border border-gray-300 rounded-lg overflow-hidden">
                  {/* Image Container */}
                  <div className="relative h-[240px] w-full overflow-hidden border-b border-gray-300">
                    <Image
                      src={category.imageUrl}
                      alt={category.title || "Category"}
                      width={120}
                      height={110}
                      quality={90}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text Container */}
                  <div className="h-[60px] w-full bg-white flex items-center justify-center px-2">
                    <p className="font-bold text-gray-900 text-lg text-center uppercase tracking-wider">
                      {category.title || "CATEGORY"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ---------- MOBILE VIEW ---------- */}
        <div className="sm:hidden px-4">
          <div className="flex overflow-x-auto gap-4 scrollbar-hide">
            {shopByCategories.map((category, index) => (
              <Link
                key={index}
                href={category.url || "/shop"}
                className="flex-shrink-0 group text-center"
              >
                 <div className="flex flex-col w-[120px] border border-gray-200 p-2 bg-white">
          {/* Image */}
          <div className="relative h-[130px] w-full overflow-hidden rounded-md">
            <Image
              src={category.imageUrl}
              alt={category.title || "Category"}
              width={120}
              height={110}
              quality={90}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Name */}
          <div className="w-full bg-[#FCFBFA]">
          <p className="mt-2 font-normal text-gray-600 text-[11px] text-center uppercase tracking-wide">
            {category.title || "CATEGORY"}
          </p>
          </div>
        </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

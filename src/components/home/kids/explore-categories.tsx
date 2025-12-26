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
    const { scrollLeft, scrollWidth, clientWidth } =
      scrollContainerRef.current;

    setIsAtStart(scrollLeft <= 0);
    setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    scrollContainerRef.current?.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  return (
    <section
      className={cn("w-full bg-[#F4F0EC] py-4 pt-4", className)}
      {...props}
    >
      <div className="max-w-screen-2xl mx-auto relative">

        {/* TITLE */}

<h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-6">
  {titleData?.title || "Explore Categories"}
</h2>
        {/* DESKTOP ARROWS */}
        {!isAtStart && (
          <button
            onClick={() => scroll("left")}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {!isAtEnd && (
          <button
            onClick={() => scroll("right")}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* SCROLL CONTAINER */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="
            flex gap-3 sm:gap-6
            overflow-x-auto
            px-3 sm:px-6
            scrollbar-hide
            scroll-smooth
          "
        >
          {shopByCategories.map((category, index) => (
            <Link
              key={index}
              href={category.url || "/shop"}
              className="flex-shrink-0"
            >
              {/* CARD */}
              <div
                className="
                  bg-[#F4F0EC]
                  border border-gray-300
                  flex flex-col
                  w-[110px] h-[150px]
                  sm:w-[200px] sm:h-[260px]
                  md:w-[240px] md:h-[300px]
                "
              >
                {/* IMAGE */}
                <div
                  className="
                    relative
                    w-full
                    h-[110px]
                    sm:h-[200px]
                    md:h-[240px]
                    border-b border-gray-300
                  "
                >
                  <Image
                    src={category.imageUrl}
                    alt={category.title || "Category"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 110px, 240px"
                  />
                </div>

                {/* TEXT */}
                <div
                  className="
                    flex items-center justify-center
                    h-[40px]
                    sm:h-[60px]
                    px-2
                  "
                >
                  <p
                    className="
                      text-[10px]
                      sm:text-base
                      font-bold
                      uppercase
                      tracking-wide
                      text-center
                    "
                  >
                    {category.title || "Category"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* MOBILE DOT INDICATORS */}
        <div className="flex justify-center gap-1 mt-4 sm:hidden">
          {shopByCategories.map((_, index) => (
            <span
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";

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
            className={cn("w-full bg-[#FCFBF4] py-4 pt-4", className)}
            {...props}
        >
            <div className="relative mx-auto max-w-screen-2xl">
                {/* TITLE */}

                <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                    {titleData?.title || "Explore Categories"}
                </h2>
                {/* DESKTOP ARROWS */}
                {!isAtStart && (
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow sm:flex"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                )}

                {!isAtEnd && (
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow sm:flex"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                )}

                {/* SCROLL CONTAINER */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScrollPosition}
                    className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth px-3 sm:gap-6 sm:px-6"
                >
                    {shopByCategories.map((category, index) => (
                        <Link
                            key={index}
                            href={category.url || "/shop"}
                            className="flex-shrink-0"
                        >
                            {/* CARD */}
                            <div className="flex h-[150px] w-[110px] flex-col border border-gray-300 bg-[#FCFBF4] sm:h-[260px] sm:w-[200px] md:h-[300px] md:w-[240px]">
                                {/* IMAGE */}
                                <div className="relative h-[110px] w-full border-b border-gray-300 sm:h-[200px] md:h-[240px]">
                                    <Image
                                        src={category.imageUrl}
                                        alt={category.title || "Category"}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 110px, 240px"
                                    />
                                </div>

                                {/* TEXT */}
                                <div className="flex h-[40px] items-center justify-center px-2 sm:h-[60px]">
                                    <p className="text-center text-[10px] font-bold uppercase tracking-wide sm:text-base">
                                        {category.title || "Category"}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* MOBILE DOT INDICATORS */}
                <div className="mt-4 flex justify-center gap-1 sm:hidden">
                    {shopByCategories.map((_, index) => (
                        <span
                            key={index}
                            className="h-1.5 w-1.5 rounded-full bg-gray-400"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

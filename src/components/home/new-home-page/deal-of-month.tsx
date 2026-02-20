"use client";

import { cn } from "@/lib/utils";
import { MarketingStrip as TypeMarketingStrip } from "@/lib/validations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
            className={cn("w-full bg-[#FCFBF4] py-6", className)}
            {...props}
        >
            <div className="max-w-screen-3xl mx-auto px-4 sm:px-6">
                <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                    Build Your Conscious Closet
                </h2>
                {/* ---------------- MOBILE VERSION (UNCHANGED) ---------------- */}
                {/* ---------------- MOBILE VERSION (SINGLE IMAGE CAROUSEL) ---------------- */}
                <div className="scrollbar-hide w-full overflow-x-auto scroll-smooth md:hidden">
                    <div className="flex gap-4">
                        {marketingStrip.map((item, index) => (
                            <Link
                                key={`mobile-${index}`}
                                href={item.url || "/shop"}
                                className="flex-shrink-0 overflow-hidden border border-gray-200 bg-white"
                                style={{ width: "260px" }}
                            >
                                {/* Single clean image */}
                                <div className="relative h-[330px] w-full">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        sizes="(max-width: 768px) 260px, 372px"
                                        className="object-cover"
                                    />
                                </div>

                                {/* Title + Count */}
                                <div className="px-4 py-3">
                                    <h3 className="text-[16px] font-medium capitalize italic text-gray-900">
                                        {item.title}
                                    </h3>
                                    <p className="text-[14px] text-gray-700">
                                        {item.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ---------------- DESKTOP VERSION (UPDATED!) ---------------- */}
                <div className="relative hidden md:block">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className={`absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
                            canScrollLeft
                                ? "cursor-pointer hover:bg-gray-100"
                                : "cursor-not-allowed opacity-40"
                        }`}
                        style={{ marginLeft: "-24px" }}
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-600" />
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={`absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${
                            canScrollRight
                                ? "cursor-pointer hover:bg-gray-100"
                                : "cursor-not-allowed opacity-40"
                        }`}
                        style={{ marginRight: "-24px" }}
                    >
                        <ChevronRight className="h-6 w-6 text-gray-600" />
                    </button>

                    {/* Scroll Container */}
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="scrollbar-hide flex gap-8 overflow-x-auto scroll-smooth pb-4"
                    >
                        {marketingStrip.map((item, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 overflow-hidden border border-gray-200 bg-white"
                                style={{ width: "372px", height: "566px" }}
                            >
                                {/* Image */}
                                <div
                                    className="relative w-full"
                                    style={{ height: "486px" }}
                                >
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
                                    <h3 className="text-[18px] font-medium capitalize text-gray-900">
                                        {item.title}
                                    </h3>
                                    <p className="text-[15px] italic text-gray-600">
                                        {item.description}
                                    </p>
                                </div>

                                <Link
                                    href={item.href || "/shop"}
                                    className="absolute inset-0"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

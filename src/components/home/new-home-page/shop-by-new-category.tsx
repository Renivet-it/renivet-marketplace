"use client";

import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface PageProps extends GenericProps {
    shopByCategories: HomeShopByCategory[];
    titleData?: { title: string };
}

export function ShopByNewCategories({
    className,
    shopByCategories,
    titleData,
    ...props
}: PageProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Split for two-row mobile carousel
    const midIndex = Math.ceil(shopByCategories.length / 2);
    const firstRowItems = shopByCategories.slice(0, midIndex);
    const secondRowItems = shopByCategories.slice(midIndex);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollRef.current.scrollTo({
                left:
                    direction === "left"
                        ? scrollLeft - scrollAmount
                        : scrollLeft + scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <section
            className={cn("w-full bg-white py-8 md:py-10", className)}
            {...props}
        >
            <div className="max-w-screen-3xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                {/* ── Header ── */}
                <div className="mb-8 flex items-end justify-between md:mb-10">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
                            Explore
                        </span>
                        <h2 className="mt-1.5 font-playfair text-[26px] font-normal text-gray-900 md:text-[34px]">
                            {titleData?.title || "Shop by Collection"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Carousel Nav */}
                        <div className="hidden items-center gap-2 md:flex">
                            <button
                                onClick={() => scroll("left")}
                                className="group flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 transition-all hover:border-gray-900"
                                aria-label="Previous categories"
                            >
                                <svg
                                    className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-900"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={() => scroll("right")}
                                className="group flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 transition-all hover:border-gray-900"
                                aria-label="Next categories"
                            >
                                <svg
                                    className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-900"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>

                        <Link
                            href="/shop"
                            className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-gray-900 md:flex"
                        >
                            View All
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* ── MOBILE: two-row horizontal scroll ── */}
                <div className="flex flex-col gap-4 md:hidden">
                    {[firstRowItems, secondRowItems].map((row, ri) => (
                        <div
                            key={ri}
                            className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4"
                        >
                            {row.map((cat, i) => (
                                <Link
                                    key={i}
                                    href={cat.url || "/shop"}
                                    className="group relative block shrink-0 snap-center overflow-hidden rounded-md bg-gray-100 shadow-sm transition-transform active:scale-95"
                                    style={{
                                        width: "140px",
                                        aspectRatio: "2/3",
                                    }}
                                >
                                    <Image
                                        src={
                                            cat.imageUrl ||
                                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                        }
                                        alt={cat.title || "Category"}
                                        fill
                                        sizes="140px"
                                        quality={80}
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-3">
                                        <p className="font-playfair text-[15px] font-normal leading-tight text-white drop-shadow-md">
                                            {cat.title || "Category"}
                                        </p>
                                        <p className="mt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#c8a96e]">
                                            Shop Now
                                            <svg
                                                className="h-2.5 w-2.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                {/* ── DESKTOP: editorial portrait strip ── */}
                <div
                    ref={scrollRef}
                    className="group/container scrollbar-hide -mx-4 hidden overflow-x-auto scroll-smooth px-4 pb-10 pt-4 md:flex md:gap-5 lg:gap-6"
                >
                    {shopByCategories.map((cat, i) => (
                        <Link
                            key={i}
                            href={cat.url || "/shop"}
                            className="group/card ease-[cubic-bezier(0.25,1,0.5,1)] relative block shrink-0 overflow-hidden rounded-xl bg-gray-100 transition-all duration-500 hover:z-20 hover:-translate-y-3 hover:scale-[1.03] hover:!opacity-100 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:!blur-none group-hover/container:opacity-40 group-hover/container:blur-[2px]"
                            style={{ width: "280px", height: "440px" }}
                        >
                            {/* Image */}
                            <Image
                                src={
                                    cat.imageUrl ||
                                    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                }
                                alt={cat.title || "Category"}
                                fill
                                sizes="280px"
                                quality={90}
                                className="object-cover transition-transform duration-1000 ease-out group-hover/card:scale-110"
                            />

                            {/* Gradient overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-500 group-hover/card:h-2/3" />

                            {/* Hover tint */}
                            <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover/card:bg-black/20" />

                            {/* Text */}
                            <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-500 group-hover/card:-translate-y-2">
                                <h3 className="font-playfair text-[22px] font-normal leading-tight text-white md:text-[28px]">
                                    {cat.title || "Category"}
                                </h3>
                                {/* Animated CTA */}
                                <div className="mt-3 flex items-center gap-2 overflow-hidden">
                                    <span className="h-px w-0 bg-[#c8a96e] transition-all duration-500 ease-out group-hover/card:w-8" />
                                    <span className="translate-x-[-8px] text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8a96e]/0 opacity-0 transition-all duration-500 ease-out group-hover/card:translate-x-0 group-hover/card:text-[#c8a96e] group-hover/card:opacity-100">
                                        Explore Collection
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Mobile view-all */}
                <div className="mt-6 flex justify-center md:hidden">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 border border-gray-900 px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-900 transition-all hover:bg-gray-900 hover:text-white"
                    >
                        View All Categories
                    </Link>
                </div>
            </div>
        </section>
    );
}

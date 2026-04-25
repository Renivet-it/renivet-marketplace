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
                left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: "smooth",
            });
        }
    };

    return (
        <section
            className={cn("w-full bg-white py-12 md:py-16", className)}
            {...props}
        >
            <div className="mx-auto w-full max-w-screen-3xl px-4 sm:px-6 lg:px-8">

                {/* ── Header ── */}
                <div className="mb-8 flex items-end justify-between md:mb-10">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
                            Explore
                        </span>
                        <h2 className="mt-1.5 font-playfair text-[26px] font-normal text-gray-900 md:text-[34px]">
                            {titleData?.title || "Shop by Category"}
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
                                <svg className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => scroll("right")}
                                className="group flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 transition-all hover:border-gray-900"
                                aria-label="Next categories"
                            >
                                <svg className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <Link
                            href="/shop"
                            className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition-colors hover:text-gray-900 md:flex"
                        >
                            View All
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* ── MOBILE: two-row horizontal scroll ── */}
                <div className="flex flex-col gap-3 md:hidden">
                    {[firstRowItems, secondRowItems].map((row, ri) => (
                        <div key={ri} className="scrollbar-hide flex gap-3 overflow-x-auto">
                            {row.map((cat, i) => (
                                <Link
                                    key={i}
                                    href={cat.url || "/shop"}
                                    className="group relative block shrink-0 overflow-hidden"
                                    style={{ width: "120px", aspectRatio: "2/3" }}
                                >
                                    <Image
                                        src={cat.imageUrl}
                                        alt={cat.title || "Category"}
                                        fill
                                        sizes="120px"
                                        quality={80}
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-2.5">
                                        <p className="font-playfair text-[13px] font-normal leading-tight text-white">
                                            {cat.title || "Category"}
                                        </p>
                                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-white/60">
                                            Shop
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
                    className="scrollbar-hide hidden md:flex md:gap-4 lg:gap-5 overflow-x-auto pb-4 scroll-smooth"
                >
                    {shopByCategories.map((cat, i) => (
                        <Link
                            key={i}
                            href={cat.url || "/shop"}
                            className="group relative block shrink-0 overflow-hidden bg-gray-100"
                            style={{ width: "260px", height: "420px" }}
                        >
                            {/* Image */}
                            <Image
                                src={cat.imageUrl || "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"}
                                alt={cat.title || "Category"}
                                fill
                                sizes="260px"
                                quality={90}
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />

                            {/* Gradient overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                            {/* Hover tint */}
                            <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/15" />

                            {/* Text */}
                            <div className="absolute inset-x-0 bottom-0 p-5">
                                <h3 className="font-playfair text-[20px] font-normal leading-tight text-white md:text-[22px]">
                                    {cat.title || "Category"}
                                </h3>
                                {/* Animated CTA */}
                                <div className="mt-2 flex items-center gap-2 overflow-hidden">
                                    <span className="h-px w-0 bg-white transition-all duration-500 ease-out group-hover:w-5" />
                                    <span className="translate-x-[-4px] text-[9px] font-bold uppercase tracking-[0.2em] text-white/0 opacity-0 transition-all duration-500 ease-out group-hover:translate-x-0 group-hover:text-white group-hover:opacity-100">
                                        Shop
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

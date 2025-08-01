"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button-general";
import { MarketingStrip as TypeMarketingStrip } from "@/lib/validations";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps extends GenericProps {
    marketingStrip: TypeMarketingStrip[];
}

export function BrandProducts({
    className,
    marketingStrip,
    ...props
}: PageProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth < 768 ? 300 : 420; // Responsive scroll amount
            const newScrollLeft = direction === 'left' 
                ? scrollRef.current.scrollLeft - scrollAmount
                : scrollRef.current.scrollLeft + scrollAmount;
            scrollRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
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

    return (
        <section
            className={cn(
                "w-full bg-[#F4F0EC] py-8 md:py-16",
                className
            )}
            {...props}
        >
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
                {/* Mobile: Stacked layout */}
                <div className="md:hidden flex flex-col gap-6">
                    <div className="w-full">
                        <h2 className="text-2xl font-light text-gray-900 tracking-wide">
                            Casual Inspirations
                        </h2>
                        <p className="mt-2 text-gray-600 text-sm">
                            Our favorite combinations for casual outfit that can inspire you to apply on your daily activity.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="mt-4 border-gray-900 text-gray-900 hover:bg-gray-100 text-xs px-4 py-2 rounded-none font-normal"
                        >
                            <Link href="/shop">BROWSE INSPIRATIONS</Link>
                        </Button>
                    </div>

                    {/* Mobile Carousel */}
                    <div className="relative w-full">
                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            {marketingStrip.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex-shrink-0 relative rounded-2xl overflow-hidden group cursor-pointer"
                                    style={{ width: "300px", height: "300px" }}
                                >
                                    <div className="absolute inset-0">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="300px"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                                    <div className="relative h-full flex flex-col justify-end p-6">
                                        <div className="self-end">
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="border-white/60 text-white hover:bg-white/10 hover:border-white text-xs px-4 py-2 rounded-none font-normal backdrop-blur-sm bg-black/20"
                                            >
                                                <Link href={item.href || "/shop"}>
                                                    → EXPLORE NOW
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop: Original layout (unchanged) */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="w-1/4 px-4">
                        <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-wide">
                            Casual Inspirations
                        </h2>
                        <p className="mt-4 text-gray-600">
                            Our favorite combinations for casual outfit that can inspire you to apply on your daily activity.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="mt-6 border-gray-900 text-gray-900 hover:bg-gray-100 text-sm px-6 py-2 rounded-none font-normal"
                        >
                            <Link href="/shop">BROWSE INSPIRATIONS</Link>
                        </Button>
                    </div>

                    <div className="w-3/4 relative">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${
                                canScrollLeft 
                                    ? "hover:bg-gray-50 cursor-pointer" 
                                    : 'opacity-50 cursor-not-allowed'
                            }`}
                            style={{ marginLeft: '-24px' }}
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </button>

                        <button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${
                                canScrollRight 
                                    ? 'hover:bg-gray-50 cursor-pointer' 
                                    : 'opacity-50 cursor-not-allowed'
                            }`}
                            style={{ marginRight: '-24px' }}
                        >
                            <ChevronRight className="w-6 h-6 text-gray-600" />
                        </button>

                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            {marketingStrip.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex-shrink-0 relative rounded-2xl overflow-hidden group cursor-pointer"
                                    style={{ width: "398px", height: "393px" }}
                                >
                                    <div className="absolute inset-0">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="398px"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
       <div className="relative h-full flex flex-col justify-end p-8">
    <div className="flex justify-between items-end w-full">
        <p className="text-white text-sm">{item.title}</p>
        <Button asChild variant="outline" className="border-white/60 text-white hover:bg-white/10 hover:border-white text-sm px-6 py-2 rounded-none font-normal backdrop-blur-sm bg-black/20">
            <Link href={item.href || "/shop"}>→ EXPLORE NOW</Link>
        </Button>
    </div>
</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
}
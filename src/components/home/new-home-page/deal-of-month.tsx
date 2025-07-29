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

export function DealofTheMonthStrip({
    className,
    marketingStrip,
    ...props
}: PageProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 420; // Card width + gap
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
                "w-full bg-[#F4F0EC] py-16",
                className
            )}
            {...props}
        >
            <div className="max-w-screen-2xl mx-auto px-6">
                {/* Section Title */}
                <div className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-wide">
                        Mindfully Curated Home Essentials
                    </h2>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${
                            canScrollLeft 
                                ? 'hover:bg-gray-50 cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed'
                        }`}
                        style={{ marginLeft: '-24px' }}
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Right Arrow */}
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

                    {/* Scrollable Cards Container */}
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
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="398px"
                                    />
                                </div>
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

                                {/* Content */}
                                <div className="relative h-full flex flex-col justify-end p-8">
                                    {/* Bottom Button - Moved to right */}
                                    <div className="self-end">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="border-white/60 text-white hover:bg-white/10 hover:border-white text-sm px-6 py-2 rounded-none font-normal backdrop-blur-sm bg-black/20"
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

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
}
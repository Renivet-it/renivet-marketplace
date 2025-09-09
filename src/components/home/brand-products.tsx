"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button-general";
import { MarketingStrip as TypeMarketingStrip } from "@/lib/validations";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

interface PageProps {
  marketingStrip: TypeMarketingStrip[];
  title?: string;
  className?: string;
}

export function BrandProducts({ className, marketingStrip, title }: PageProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Clone items for infinite loop
  const clonedItems = [...marketingStrip, ...marketingStrip, ...marketingStrip];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 300 : 420;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
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
    const timer = setInterval(() => {
      if (scrollRef.current && canScrollRight) scroll("right");
      else if (scrollRef.current) scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }, 4000);

    return () => clearInterval(timer);
  }, [canScrollRight]);

  return (
    <section className={cn("w-full bg-[#F4F0EC] py-2 sm:py-16", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
{/* ----------------- MOBILE VIEW (Carousel with smaller cards) ----------------- */}
<div className="sm:hidden px-3 pt-4">
  {/* Title + Subtitle + Button */}
  <div className="text-center mb-4">
    <h2 className="text-sm font-semibold text-gray-900">
      Casual Inspirations
    </h2>
    <p className="text-xs text-gray-600 mt-1">
      Our favorite combinations for casual outfits
    </p>
    <Button
      asChild
      variant="outline"
      className="mt-2 border-gray-900 text-gray-900 hover:bg-gray-100 text-xs px-3 py-1 rounded-none font-normal"
    >
      <Link href="/shop">BROWSE</Link>
    </Button>
  </div>

  {/* Horizontal carousel */}
  <div
    ref={scrollRef}
    onScroll={handleScroll}
    className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
  >
    {marketingStrip.map((item) => (
      <div
        key={item.id}
        className="flex-shrink-0 relative rounded-lg overflow-hidden bg-white shadow-md"
        style={{ width: "180px", height: "220px" }} // 👈 smaller size so 2–3 fit
      >
        <Link href={item.url || "/shop"}>
          <Image
            src={item.imageUrl}
            alt={item.title || "Product image"}
            fill
            className="object-cover rounded-lg"
          />
        </Link>
        {item.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] text-center py-1">
            {item.title}
          </div>
        )}
      </div>
    ))}
  </div>
</div>

        {/* ---------------------------- DESKTOP VIEW ---------------------------- */}
        <div className="hidden md:flex items-center gap-8">
          <div className="w-1/4 px-4">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 tracking-wide">
              Casual Inspirations
            </h2>
            <p className="mt-4 text-gray-600">
              Our favorite combinations for casual outfits that can inspire your daily style.
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
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${
                canScrollLeft ? "hover:bg-gray-50 cursor-pointer" : "opacity-50 cursor-not-allowed"
              }`}
              style={{ marginLeft: "-24px" }}
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 ${
                canScrollRight ? "hover:bg-gray-50 cursor-pointer" : "opacity-50 cursor-not-allowed"
              }`}
              style={{ marginRight: "-24px" }}
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {clonedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 relative rounded-2xl overflow-hidden group cursor-pointer"
                  style={{ width: "398px", height: "393px" }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105 rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 rounded-xl" />
                  <div className="relative h-full flex flex-col justify-end p-8">
                    <div className="flex justify-between items-end w-full text-white">
                      <p className="text-sm">{item.title}</p>
                      <Button
                        asChild
                        variant="outline"
                        className="border-white/60 text-white hover:bg-white/10 hover:border-white text-sm p-3 rounded-none backdrop-blur-sm bg-black/20"
                      >
                        <Link href={item.href || "/shop"}>
                          <ArrowUpRight className="w-5 h-5" />
                        </Link>
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
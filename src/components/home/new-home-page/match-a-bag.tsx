"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { useEffect, useState } from "react";

interface MoodboardItem {
  id: string;
  imageUrl: string;
  title?: string;
  url?: string;
}

interface PageProps {
  moodboardItems: MoodboardItem[];
  title?: string;
  className?: string;
}

export function MatchaBag({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const AUTOPLAY_DELAY = 3000; // 3 seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % moodboardItems.length);
    }, AUTOPLAY_DELAY);
    return () => clearInterval(interval);
  }, [moodboardItems.length]);

  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[F4F0EC]", className)}>
    {/* ---------------------------- Mobile View ---------------------------- */}
<div className="lg:hidden w-full px-3 py-6">
  {/* Floating Card ABOVE */}
  <div className="w-full mb-4">
    <div className="bg-white bg-opacity-80 backdrop-blur-md p-4 text-center rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-2 leading-snug">
        Effortless Elegance,<br />
        Naturally Woven
      </h3>
      <p className="text-gray-600 text-xs leading-relaxed mb-3">
        Explore our latest collections of co-accuracy crafted sarees —
        based in tradition, refined for today.
      </p>
      <Link href="/shop">
        <button className="border-b border-gray-400 text-gray-700 px-1 py-1 text-xs font-medium uppercase tracking-wide hover:border-gray-600 transition-colors rounded-none">
          EXPLORE NOW →
        </button>
      </Link>
    </div>
  </div>

  {/* Small Image Carousel BELOW */}
  <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth">
    {moodboardItems.map((item) => (
      <Link
        key={item.id}
        href={item.url ?? "/shop"}
        className="flex-shrink-0 w-[140px] h-[180px] relative rounded-lg overflow-hidden shadow-md"
      >
        <Image
          src={item.imageUrl}
          alt={item.title ?? "Moodboard item"}
          fill
          className="object-cover rounded-lg"
        />
      </Link>
    ))}
  </div>
</div>

<style jsx>{`
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`}</style>


      {/* Desktop View */}
      <div className="hidden lg:block max-w-screen-2xl mx-auto py-12 px-8 relative">
        <div className="flex flex-row gap-8 items-start">
          <div className="flex-1 w-full">
            <div className="relative w-full" style={{ height: "530px" }}>
              {moodboardItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.url ?? "/shop"}
                  className={cn(
                    "absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out rounded-lg",
                    index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title ?? "Moodboard item"}
                    fill
                    className="object-cover rounded-lg"
                    quality={100}
                    priority={index === 0}
                  />
                </Link>
              ))}
            </div>
          </div>
          {/* Positioned on the right, half inside/half outside */}
          <div className="absolute right-[-20px] top-1/2 transform -translate-y-1/2 max-w-[265px] z-10">
            <div className="bg-white bg-opacity-20 backdrop-blur-md p-4 text-left rounded-lg shadow-md border-2 border-white/30" style={{ height: "335px" }}>
              <h3 className="text-2xl font-light text-gray-900 mb-3 leading-tight tracking-wide">
                Effortless Elegance,<br />
                Naturally Woven
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Explore our latest collections of co-accuracy crafted sarees—based in tradition, refined for today.
              </p>
              <Link href="/shop">
                <button className="border-b border-gray-400 text-gray-700 px-1 py-1 text-sm font-medium uppercase tracking-widest hover:border-gray-600 transition-colors rounded-none">
                  EXPLORE NOW →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
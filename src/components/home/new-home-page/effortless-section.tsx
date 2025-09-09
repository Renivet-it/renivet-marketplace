"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
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

export function EffortlessElegance({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const AUTOPLAY_DELAY = 3000;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % moodboardItems.length);
    }, AUTOPLAY_DELAY);
    return () => clearInterval(interval);
  }, [moodboardItems.length]);

  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC]", className)}>
{/* ---------------- MOBILE VIEW ---------------- */}
<div className="lg:hidden w-full bg-gray-50 py-6 px-4"> {/* Light background for whole mobile section */}
  
  {/* ---------------- INFO PANEL ---------------- */}
  <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 max-w-md mx-auto text-center shadow-sm">
    <h3 className="text-lg font-light text-gray-900 mb-1 leading-snug tracking-wide">
      Effortless Elegance,<br />
      Naturally Woven
    </h3>
    <p className="text-gray-700 text-sm leading-relaxed mb-2">
      Explore our latest collections of co-accuracy crafted sarees—based in
      tradition, refined for today.
    </p>
    <Link href="/shop">
      <button className="border-b border-gray-400 text-gray-800 px-2 py-1 text-sm font-medium uppercase tracking-widest hover:border-gray-600 transition-colors rounded-none">
        EXPLORE NOW →
      </button>
    </Link>
  </div>

  {/* ---------------- HORIZONTAL CAROUSEL ---------------- */}
  <Carousel
    opts={{
      align: "start",
      loop: true,
    }}
    plugins={[Autoplay({ delay: AUTOPLAY_DELAY })]}
    className="w-full"
  >
    <CarouselContent className="flex gap-4 overflow-x-auto">
      {moodboardItems.map((item) => (
        <CarouselItem
          key={item.id}
          className="flex-shrink-0 w-[85%] sm:w-[70%] md:w-[60%]"
        >
          <Link
            href={item.url ?? "/shop"}
            className="block relative rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm"
            style={{ height: "220px" }}
          >
            <Image
              src={item.imageUrl}
              alt={item.title ?? "Moodboard item"}
              fill
              className="object-cover rounded-lg"
              quality={100}
            />
          </Link>

          {item.title && (
            <p className="mt-2 text-sm sm:text-base text-gray-800 font-medium text-center">
              {item.title}
            </p>
          )}
        </CarouselItem>
      ))}
    </CarouselContent>
  </Carousel>
</div>


      {/* ---------------- DESKTOP VIEW ---------------- */}
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

          <div className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 max-w-[265px] z-10">
            <div
              className="bg-white bg-opacity-20 backdrop-blur-md p-4 text-left rounded-lg shadow-md border-2 border-white/30"
              style={{ height: "335px" }}
            >
              <h3 className="text-2xl font-light text-gray-900 mb-3 leading-tight tracking-wide">
                Effortless Elegance,<br />
                Naturally Woven
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Explore our latest collections of co-accuracy crafted sarees—based in
                tradition, refined for today.
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

"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

// Embla imports
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface MoodboardItem {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  url?: string;
}

interface PageProps {
  moodboardItems: MoodboardItem[];
  className?: string;
}

export function EffortlessElegance({
  moodboardItems,
  className,
}: PageProps) {
  const autoplay = Autoplay({ delay: 4000, stopOnInteraction: false });

  // ==========================
  // MOBILE EMBLA CONFIG
  // ==========================
  const [emblaRef, embla] = useEmblaCarousel(
    { loop: true },
    [autoplay]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setActiveIndex(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    onSelect();
  }, [embla, onSelect]);

  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#FCFBF4]", className)}>
      <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===================== DESKTOP (unchanged) ===================== */}
        <div className="relative w-full hidden md:block overflow-hidden" style={{ aspectRatio: "1363/400" }}>
          {moodboardItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              <Link href={item.url ?? "/shop"}>
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Banner"}
                  fill
                  className="object-cover"
                />
              </Link>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                <h2 className="text-3xl font-light mb-2">{item.title}</h2>
                {item.subtitle && <p className="text-xl mb-6">{item.subtitle}</p>}
                <Link
                  href={item.url ?? "/shop"}
                  className="px-6 py-2 bg-white text-gray-800 text-sm rounded-md shadow hover:bg-gray-100 transition"
                >
                  Shop The Edit
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ===================== MOBILE CAROUSEL (NEW) ===================== */}
<div className="md:hidden w-full relative overflow-hidden">

  {/* Embla viewport */}
  <div className="overflow-hidden" ref={emblaRef}>
    <div className="flex">
      {moodboardItems.map((item) => (
        <div
          key={item.id}
          className="flex-shrink-0 w-full h-[365px] relative"
        >
          <Link href={item.url ?? "/shop"} className="block w-full h-full">
            <Image
              src={item.imageUrl}
              alt={item.title || "Banner"}
              fill
              className="object-cover"
            />

            {/* TEXT OVERLAY */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white">
              <h2 className="text-base font-light mb-1">{item.title}</h2>

              {item.subtitle && (
                <p className="text-sm font-light mb-4">{item.subtitle}</p>
              )}

              <span className="px-4 py-1 bg-white text-gray-800 text-xs rounded shadow">
                Shop The Edit
              </span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  </div>

  {/* DOTS */}
  <div className="absolute bottom-3 w-full flex justify-center gap-2">
    {moodboardItems.map((_, idx) => (
      <button
        key={idx}
        onClick={() => embla?.scrollTo(idx)}
        className={cn(
          "w-2 h-2 rounded-full transition",
          idx === activeIndex ? "bg-white" : "bg-white/50"
        )}
      />
    ))}
  </div>
</div>
      </div>
    </section>
  );
}

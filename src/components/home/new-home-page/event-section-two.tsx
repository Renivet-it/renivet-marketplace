"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { useEffect, useState } from "react";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function EventSectionTwoBanner({ className, banners, ...props }: PageProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const AUTOPLAY_DELAY = 3000; // 3 seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, AUTOPLAY_DELAY);

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <section className={cn("w-full bg-white md:bg-[#FAF7F2]", className)} {...props}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full relative"
      >
        <CarouselContent className="ml-0 relative">
          <CarouselItem className="p-0 relative">
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: "1440/400" }}
            >
              {banners.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out",
                    index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                >
                  <video
                    src={item.imageUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  {/* Shop Now Button */}
                  <Link
                    href={item.url || "/shop"}
                    className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
                  >
                    <button className="rounded-full bg-[#61333d] px-8 py-3 text-lg font-medium text-white shadow-lg transition-colors duration-300 hover:bg-[#4d2931]">
                      Shop Now
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </section>
  );
}

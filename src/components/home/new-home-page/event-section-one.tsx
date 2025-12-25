"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { useEffect, useState } from "react";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function EventSectionOneBanner({ className, banners, ...props }: PageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const AUTOPLAY_DELAY = 3000; // 3 seconds

  useEffect(() => {
    // Ensure there's more than one banner before starting the interval
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % banners.length);
      }, AUTOPLAY_DELAY);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  // Don't render if there are no banners
  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <section className={cn("w-full py-2 bg-[#FCFBF4]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Carousel
          opts={{
            align: "start",
            loop: banners.length > 1, // Only loop if there's more than one item
          }}
          className="w-full relative"
        >
          <CarouselContent className="ml-0 relative">
            <CarouselItem className="p-0 relative">
              <div
                className="relative w-full overflow-hidden"
                // Set the aspect ratio based on the new dimensions (1313 / 206)
                style={{ aspectRatio: "1313 / 206" }}
              >
                {banners.map((item, index) => (
                  <Link
                    key={index}
                    href={item.url || "/shop"}
                    className={cn(
                      "absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out",
                      index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    )}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "Promotional Banner"}
                      fill
                      className="object-cover" // Removed rounded-lg
                      priority={index === 0}
                      sizes="(max-width: 1536px) 100vw, 1536px"
                    />
                  </Link>
                ))}
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

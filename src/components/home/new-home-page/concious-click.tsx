"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface PageProps extends GenericProps {
  banners: Banner[];
  className?: string;
}

export function ConciousClick({ className, banners, ...props }: PageProps) {
  if (!banners || banners.length === 0) {
    return null;
  }

  // Split the banners array for the two-row mobile carousel
  const midIndex = Math.ceil(banners.length / 2);
  const firstRowItems = banners.slice(0, midIndex);
  const secondRowItems = banners.slice(midIndex);

  return (
    <section className={cn("w-full py-12 md:py-7 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-normal text-gray-800 tracking-wide">
            This Festive Celebrate With Purpose
          </h2>
          <Link href="/shop" className="text-sm text-cyan-600 hover:underline mt-2 inline-block">
            View All
          </Link>
        </div>

        {/* --- MOBILE VERSION (Two-Row Scrolling Carousel) --- */}
        <div className="md:hidden flex flex-col gap-6">
          {/* First Row */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {firstRowItems.map((item, index) => (
              <Link
                key={`row1-${index}`}
                href={item.url || "/shop"}
                // Set a fixed width and prevent shrinking
                className="block w-[97px] flex-shrink-0 group"
              >
                <div className="relative w-full aspect-[97/166]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Festive Collection"}
                    fill
                    className="object-contain"
                    sizes="33vw"
                  />
                </div>
              </Link>
            ))}
          </div>
          {/* Second Row */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {secondRowItems.map((item, index) => (
              <Link
                key={`row2-${index}`}
                href={item.url || "/shop"}
                className="block w-[97px] flex-shrink-0 group"
              >
                <div className="relative w-full aspect-[97/166]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Festive Collection"}
                    fill
                    className="object-contain"
                    sizes="33vw"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* --- DESKTOP VERSION (Single-Row Carousel) --- */}
        <div className="hidden md:block">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: true,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {banners.map((item, index) => (
                <CarouselItem
                  key={index}
                  className="pl-4 md:pl-6 basis-[50vw] sm:basis-[30vw] md:basis-[22vw] lg:basis-[16vw]"
                >
                  <Link href={item.url || "/shop"} className="block w-full h-full group">
                    <div className="relative w-full aspect-[3/4]">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Festive Collection"}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 16vw"
                      />
                    </div>
                    <div className="mt-2 h-10 text-center">
                      {/* You can add item.title here if needed */}
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}

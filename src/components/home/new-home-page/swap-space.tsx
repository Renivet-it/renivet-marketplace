"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
  banners: Banner[];
  className?: string;
}

export function SwapSpace({ className, banners, ...props }: PageProps) {
  return (
    <section
      className={cn("w-full py-6 md:py-12 bg-[#F4F0EC]", className)}
      {...props}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="flex gap-2 md:gap-4 -ml-2 md:-ml-4">
            {banners.map((item, index) => (
              <CarouselItem
                key={index}
                className={cn(
                  "pl-2 md:pl-4 flex-shrink-0",
                  // Smaller sizes for mobile, larger sizes for tablet & desktop
                  "basis-[140px] sm:basis-[200px] md:basis-1/2 lg:basis-1/3"
                )}
              >
                <div className="relative w-full aspect-[3/4] group rounded-lg overflow-hidden shadow-sm">
                  <Link href={item.url || "/shop"} className="block w-full h-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "New Arrival"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 40vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 flex items-end pb-4 md:pb-8 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="bg-white text-gray-900 px-3 py-1.5 md:px-6 md:py-3 font-medium uppercase tracking-wide text-xs md:text-sm hover:bg-gray-100 transition-colors">
                        Shop Now
                      </button>
                    </div>
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

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

export function ConciousClick({ className, banners, ...props }: PageProps) {
  return (
    <section className={cn("w-full py-2 md:py-12 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-0">
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
                className="pl-2 md:pl-4 basis-[80vw] sm:basis-[40vw] lg:basis-[calc(100%/3-16px)] flex-shrink-0"
              >
                <div className="relative w-full aspect-[9/10] md:h-[553px] group">
                  <Link href={item.url || "/shop"} className="block w-full h-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title || "New Arrival"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 33vw"
                    />
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
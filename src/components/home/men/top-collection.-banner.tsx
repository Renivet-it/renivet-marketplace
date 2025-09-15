"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps {
  advertisements: Banner[];
  className?: string;
}

export function TopCollectionBanner({ className, advertisements }: PageProps) {
  return (
    <section className={cn("w-full pt-2 sm:pt-10 bg-[#F4F0EC]", className)}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {advertisements.map((item, index) => (
            <CarouselItem key={index} className="p-0 w-full">
              <div className="relative w-full aspect-[2.4/1]"> {/* 1440/600 = 2.4 */}
                <Link href={item.url || "/shop"} className="block size-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1440px"
                  />
                </Link>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
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
    <section className={cn("w-full bg-[#F4F0EC]", className)} {...props}>
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
                <Link
                  key={index}
                  href={item.url || "/shop"}
                  className={cn(
                    "absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out",
                    index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1440px"
                  />
                </Link>
              ))}
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </section>
  );
}

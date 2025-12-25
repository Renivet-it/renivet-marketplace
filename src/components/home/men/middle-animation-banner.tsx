"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function MiddleAnimationSection({
  className,
  banners,
  ...props
}: PageProps) {
  return (
    <section className={cn("w-full bg-[#F4F0EC]", className)} {...props}>
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 5000 })]}
        className="
          w-full
          aspect-[16/6]        /* desktop */
          sm:aspect-[16/5]
          md:aspect-[3/1]
        "
      >
        <CarouselContent
          classNames={{
            wrapper: "h-full",
            inner: "h-full ml-0",
          }}
        >
          {banners.map((item, index) => (
            <CarouselItem key={index} className="h-full p-0">
              <Link
                href={item.url || "/shop"}
                className="relative block h-full w-full"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  priority={index === 0}
                  className="
                    object-cover      /* mobile */
                    md:object-contain /* desktop */
                  "
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

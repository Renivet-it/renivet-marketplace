"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps {
  banners: Banner[];
  className?: string;
}

export function GetNewDiscountCollection({ className, banners }: PageProps) {
  return (
    <section
      className={cn("pt-6 md:pt-12 lg:pt-16", className)}
      style={{ backgroundColor: "#f4f0ec" }}
    >
      <div className="max-w-[1440px] mx-auto px-0 sm:px-6">
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
          <CarouselContent
            classNames={{
              wrapper: "size-full",
              inner: "size-full ml-0",
            }}
          >
            {banners.map((item, index) => (
              <CarouselItem key={index} className="h-full p-0">
                <div className="relative w-full h-[70vh] sm:h-auto sm:aspect-[16/9] md:aspect-[3/1] lg:h-[500px] xl:h-[600px] overflow-hidden">
                  <Link href="/shop" className="block size-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-contain sm:object-cover"
                      priority={index === 0}
                      sizes="100vw"
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
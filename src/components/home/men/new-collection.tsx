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

export function NewCollection({ className, banners, ...props }: PageProps) {
  return (
    <section className={cn("pt-2 sm:pt-10 md:pt-16 lg:pt-20 pb-2 sm:pb-4 md:pb-16 lg:pb-20 bg-[FCFBFA] sm:bg-[#F4F0EC]", className)} {...props}>
              <h1 className="text-center text-lg sm:text-4xl font-normal sm:font-bold text-gray-900 sm:mb-10 mb-3
              font-serif sm:font-sans ">
          New Collection
        </h1>
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
              <div className="relative w-full h-full min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden rounded-2xl">
                <Link href={item.url || "/shop"} className="block size-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="100vw"
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
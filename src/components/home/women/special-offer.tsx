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

export function SpecialOffer({ className, banners, ...props }: PageProps) {
  return (
    <section className={cn("w-full py-8 md:py-12 bg-white", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        {/* Header - Mobile responsive */}
        <div className="mb-6 md:mb-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">The Festive Life</h2>
          <p className="text-sm md:text-base text-gray-600">Handwoven pieces to light up every moment</p>
        </div>

        {/* Carousel - Mobile responsive */}
        <Carousel
          opts={{
            align: "start",
            loop: true,
            slidesToScroll: "auto",
            containScroll: "keepSnaps",
          }}
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {banners.map((item, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 basis-[85vw] sm:basis-[70vw] md:basis-[511px]"
              >
                <div className="group relative aspect-[3/4] md:h-[714px] md:w-[511px] rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg">
                  <Link href={item.url || "/shop"} className="block size-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={511}
                      height={714}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      priority={index === 0}
                      sizes="(max-width: 640px) 85vw, (max-width: 768px) 70vw, 511px"
                    />
                  </Link>

                  {/* Overlay Text - Mobile responsive */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">{item.title}</h3>
                    <p className="text-xs md:text-base text-white/90 mb-2 md:mb-4">{item.description}</p>
                    <Link
    //@ts-ignore
                      href={item.url || "/shop"}
                      className="inline-block px-4 py-1 md:px-6 md:py-2 text-sm md:text-base bg-white text-gray-900 font-medium rounded-full hover:bg-gray-100 transition"
                    >
                      {item.ctaText || "Shop Now"}
                    </Link>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

      </div>
    </section>
  );
}
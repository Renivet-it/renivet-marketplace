"use client";

import { Advertisement } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps {
  advertisements: Advertisement[];
}

export function DiscountOffer({ advertisements }: PageProps) {
  if (!advertisements.length) return null;

  return (
    <section className="w-full sm:pb-10 pb-2 bg-[#FAF9F7] sm:bg-[#F4F0EC]">
      {/* ---------- MOBILE VIEW ---------- */}
      <div className="sm:hidden px-2 flex justify-center pt-2">
        <div className="w-full">
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 5000 })]}
            className="w-full aspect-[1440/500]"
          >
            <CarouselContent className="ml-0">
              {advertisements.map((ad, index) => (
                <CarouselItem key={ad.id} className="p-0">
                  <div className="relative w-full h-[180px] rounded-t-xl overflow-hidden shadow-md">
                    {ad.url ? (
                      <Link href={ad.url} target="_blank" className="block size-full">
                        <Image
                          src={ad.imageUrl}
                          alt={ad.title}
                          width={1440}
                          height={305}
                          className="size-full object-cover brightness-100"
                          priority={index === 0}
                        />
                      </Link>
                    ) : (
                      <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        fill
                        className="object-fill z-0"
                        priority={index === 0}
                      />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* ---------- DESKTOP VIEW ---------- */}
      <div className="hidden sm:block">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full aspect-[1440/305] sm:min-h-[305px]"
        >
          <CarouselContent className="ml-0">
            {advertisements.map((ad, index) => (
              <CarouselItem key={ad.id} className="p-0">
                <div className="relative w-full h-full">
                  {ad.url ? (
                    <Link href={ad.url} target="_blank" className="block size-full">
                      <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        width={1440}
                        height={305}
                        className="size-full object-cover brightness-100"
                        priority={index === 0}
                      />
                      {/* Desktop-only button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="bg-white text-gray-900 font-bold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 text-sm md:text-base">
                          Shop Now
                        </button>
                      </div>
                    </Link>
                  ) : (
                    <div className="size-full">
                      <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        width={1440}
                        height={305}
                        className="size-full object-cover brightness-100"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="bg-white text-gray-900 font-bold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 text-sm md:text-base">
                          Shop Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

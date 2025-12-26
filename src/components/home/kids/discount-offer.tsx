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
    <section className="w-full bg-[#F4F0EC]">
                  <h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-2">
Tradition, Tailored for Children
</h2>
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
        className="w-full bg-[#F4F0EC] aspect-[1440/700] sm:min-h-[400px] lg:min-h-[700px]"
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
                      height={700}
                      className="size-full object-cover brightness-100"
                      priority={index === 0}
                    />
                    {/* Shop Now Button */}
                    <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
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
                      height={700}
                      className="size-full object-cover brightness-100"
                      priority={index === 0}
                    />
                    {/* Shop Now Button */}
                    <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
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
    </section>
  );
}
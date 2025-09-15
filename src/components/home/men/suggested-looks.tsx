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

export function SuggestedLook({ className, banners }: PageProps) {
  if (!banners?.length) return null;

  return (
    <section className={cn("w-full", className)}>
      {/* ---------- MOBILE VIEW ---------- */}
      <div className="sm:hidden pt-2 w-full bg-[#FAF9F7]">
        <div className="w-full flex justify-center mb-4">
          <div className="max-w-screen-2xl w-full px-4 text-center">
            <h2 className="text-lg font-normal text-gray-900">
              Suggested Looks
            </h2>
          </div>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {banners.map((item, index) => (
              <CarouselItem key={index} className="h-[180px] p-0">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md">
                  <Link href={item.url || "/shop"} className="block w-full h-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-contain sm:object-cover w-full h-full"
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

      {/* ---------- DESKTOP VIEW ---------- */}
      <div className="hidden sm:block pt-8 w-full bg-[#F4F0EC]">
        <div className="w-full flex justify-center mb-8">
          <div className="max-w-screen-2xl w-full px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Suggested Looks
            </h2>
          </div>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {banners.map((item, index) => (
              <CarouselItem key={index} className="h-[305px] p-0">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md">
                  <Link href={item.url || "/shop"} className="block w-full h-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover w-full h-full"
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

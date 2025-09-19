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
  return (
    <section className={cn("w-full", className)}>
      {/* ---------- MOBILE VIEW ---------- */}
<div className="sm:hidden pt-1 w-full bg-white">
  <div className="w-full flex justify-center mb-1">
    <div className="max-w-screen-2xl w-full px-1 text-center">
      <h2 className="text-lg font-normal text-gray-900 font-serif sm:font-sans">
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
        <CarouselItem key={index} className="h-[180px] p-0 flex flex-col">
          {/* Image */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md">
            <Link href={item.url || "/shop"} className="block w-full h-full">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-fill w-full h-full"
                priority={index === 0}
                sizes="100vw"
              />
            </Link>
          </div>

          {/* Button below image */}
          <div className="mt-2 w-full text-center">
            <Link
              href={item.url || "/shop"}
              className="bg-[#f7f3e1] text-black text-xs font-medium px-2 py-1 rounded transition"
            >
              &gt; Buy This Look
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
            <h2 className="text-3xl font-bold text-gray-900">Suggested Looks</h2>
          </div>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {banners.map((item, index) => (
              <CarouselItem key={index} className="h-[305px] p-0"> {/* Desktop height */}
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

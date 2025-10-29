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

export function CuratedBanner({ className, banners, ...props }: PageProps) {
  return (
    <section
      className={cn(
        "relative w-full pb-7 py-8 md:py-8 overflow-hidden",
        className
      )}
      {...props}
    >
      {/* ✅ Use next/image for the background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxtBXxk1IezOinSmtdvjDw08UlbRkW2MQqNBX"
          alt="Curated banner background"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* Optional gradient overlay (for better text visibility) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 -z-0"></div>

      {/* Content */}
      <div className="relative z-10 mx-auto px-2 md:px-6">
        <h2 className="text-white text-lg md:text-xl font-semibold mb-6 text-center drop-shadow-md">
          Rare & Real <span className="font-normal italic">– Just 12 Created</span>
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
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {banners.map((item, index) => (
              <CarouselItem key={index} className="basis-auto pl-4">
                <div className="relative w-[160px] h-[200px] md:w-[252px] md:h-[315px] overflow-hidden rounded-2xl shadow-md">
                  <Link href={item.url || "/shop"} className="block w-full h-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-105"
                      priority={index === 0}
                      sizes="(max-width: 768px) 160px, 252px"
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

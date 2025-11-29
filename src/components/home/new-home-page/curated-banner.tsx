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
    <>
<h2 className="text-center  bg-[#f4f0ec] font-[400] text-[20px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#6A4F38] font-playfair pb-6 pt-6">
  Under ₹2,000 – Effortless
  <br className="block md:hidden" />  {/* break only on mobile */}
  <span className="italic">Essentials.</span>
</h2>


      <section
        className={cn(
          "relative w-full pb-7 py-8 md:py-8 overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Background Image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNseDlfjon3bApvy2W4lj8UTcEV5GdMa0thXR6"
            alt="Curated banner background"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Optional gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 -z-0"></div>

        {/* Carousel Content */}
        <div className="relative z-10 mx-auto px-2 md:px-6">
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
                  {/* REMOVE rounded corners */}
           <div className="relative w-[160px] h-[200px] md:w-[252px] md:h-[315px] overflow-hidden shadow-md rounded-none">
  <Link href={item.url || "/shop"} className="block w-full h-full">
    <Image
      src={item.imageUrl}
      alt={item.title}
      fill
      className="object-cover rounded-none"
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
    </>
  );
}

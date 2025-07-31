"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
  banners: Banner[];
  className?: string;
}

export function ConciousClick({ className, banners, ...props }: PageProps) {
  return (
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-0">
        {/* Carousel with gaps between cards */}
<Carousel
  opts={{
    align: "start",
    loop: true,
  }}
  className="w-full"
>
  <CarouselContent className="flex gap-4">
    {banners.map((item, index) => (
      <CarouselItem
        key={index}
        className="basis-[calc(100%/3-16px)] flex-shrink-0"
      >
        <div className="relative w-[499px] h-[553px] group">
          <Link href={item.url || "/shop"} className="block w-full h-full">
            <Image
              src={item.imageUrl}
              alt={item.title || "New Arrival"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
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

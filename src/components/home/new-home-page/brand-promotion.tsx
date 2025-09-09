"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ArrowUpRight } from "lucide-react";

interface MoodboardItem {
  id: string;
  imageUrl: string;
  title?: string;
  url?: string;
}

interface PageProps {
  moodboardItems: MoodboardItem[];
  title?: string;
  className?: string;
}

export function BrandPromotion({
  moodboardItems,
  title = "Elevate Everyday Living",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC] py-4 md:py-16", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
        {/* Section Title */}
        <div className="mb-6 md:mb-12 text-center">
          <h2 className="text-xl md:text-4xl font-light text-gray-900 tracking-wide">
            {title}
          </h2>
        </div>

      {/* ----------------- MOBILE VIEW (Floating stacked moodboard) ----------------- */}
<div className="sm:hidden">
  <div className="columns-2 gap-3">
    {moodboardItems.map((item) => (
      <div
        key={item.id}
        className="mb-3 break-inside-avoid relative bg-[#f7f6f3] rounded-xl overflow-hidden shadow-sm"
      >
        <Link href={item.url || "/shop"}>
          <Image
            src={item.imageUrl}
            alt={item.title || "Product image"}
            width={600}
            height={800}
            className="object-cover w-full h-auto rounded-lg"
          />
        </Link>
        {item.title && (
          <p className="mt-2 text-sm font-medium text-gray-700 text-center">
            {item.title}
          </p>
        )}
      </div>
    ))}
  </div>
</div>


        {/* ----------------- DESKTOP VIEW----------------- */}
        <div className="hidden sm:block">
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
              {moodboardItems.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5"
                >
                  <div className="group cursor-pointer">
                    <div className="relative bg-[#e1ddd5] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 p-4">
                      {/* Title and Arrow Button */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          {item.title || "Product"}
                        </h3>
                        <Link
                          href={item.url || "/shop"}
                          className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                        >
                          <ArrowUpRight className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>

                      {/* Product Image */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                        <Link href={item.url || "/shop"} className="block w-full h-full">
                          <Image
                            src={item.imageUrl}
                            alt={item.title || "Product image"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}

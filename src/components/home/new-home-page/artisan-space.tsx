"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface PageProps extends GenericProps {
  shopByCategories: HomeShopByCategory[];
  titleData?: { title: string };
}

export function ArtisanCollection({
  className,
  shopByCategories,
  titleData,
  ...props
}: PageProps) {
  return (
    <section
      className={cn("flex w-full justify-center py-4 bg-[#F4F0EC]", className)}
      {...props}
    >
      <div className="w-full space-y-6 max-w-screen-2xl mx-auto px-4">
        {/* Title */}
        <h2 className="text-lg md:text-3xl font-normal sm:font-bold text-gray-800 pb-2 px-4">
          {titleData?.title || "Shop By Value"}
        </h2>

        {/* Carousel */}
        <div className="px-4">
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {shopByCategories.map((category, index) => (
                <CarouselItem
                  key={index}
                  className={cn(
                    "pl-4",
                    //  Smaller items on mobile, larger on desktop
                    "basis-[140px] sm:basis-[180px] md:basis-[220px] lg:basis-[244px]"
                  )}
                >
                  <Link href={category.url || "/shop"} className="block">
                    <div className="relative h-[160px] sm:h-[200px] md:h-[240px] lg:h-[260px] w-full rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={category.imageUrl}
                        alt={category.title || "Category"}
                        fill
                        quality={90}
                        className="object-cover"
                      />
                    </div>
                    {/* Title under image */}
                    {category.title && (
                      <p className="mt-2 text-center text-sm text-gray-700">
                        {category.title}
                      </p>
                    )}
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}

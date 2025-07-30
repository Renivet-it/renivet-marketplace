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
      className={cn("flex w-full justify-center py-12 bg-[#F4F0EC]", className)}
      {...props}
    >
      <div className="w-full space-y-6 max-w-screen-2xl mx-auto px-4">
        {/* Title */}

<h2 className="text-2xl md:text-3xl font-bold text-gray-800 pb-2 px-4">
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
                <CarouselItem key={index} className="pl-4 basis-[244px]">
                  <Link href={category.url || "/shop"} className="block">
                      <div className="relative h-[260px] w-full">
                        <Image
                          src={category.imageUrl}
                          alt={category.title || "Category"}
                          fill
                          quality={90}
                          className="object-cover"
                        />
                    </div>
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
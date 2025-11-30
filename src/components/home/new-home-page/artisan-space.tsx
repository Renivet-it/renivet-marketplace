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
import Autoplay from "embla-carousel-autoplay";

// The props interface remains unchanged.
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
  if (!shopByCategories || shopByCategories.length === 0) {
    return null;
  }

  return (
    // Main section with the page's solid background color
    <section
      className={cn("w-full bg-[#fbfaf4] py-12", className)}
      {...props}
    >
      <div className="w-full max-w-screen-2xl mx-auto space-y-6">
        {/* Optional Title */}
        {titleData?.title && (
          <h2 className="text-2xl md:text-3xl font-normal text-gray-800 px-4">
            {titleData.title}
          </h2>
        )}

        {/* The container with the gradient background */}
        <div
          className="py-10"
          style={{
            background: "linear-gradient(to bottom, #FFFFFF 9%, #D78D2F 100%)"
          }}
        >
          {/* The carousel with responsive spacing */}
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6 px-4 md:px-6">
              {shopByCategories.map((category, index) => (
                <CarouselItem
                  key={index}
                  className="pl-4 md:pl-6 basis-auto" // Responsive padding for the gap
                >
                  <Link href={category.url || "/shop"} className="block group">
                    {/* The white card with responsive dimensions */}
                    <div
                      className="relative bg-white rounded-2xl overflow-hidden shadow-sm w-[150px] h-[200px] md:w-[230px] md:h-[300px]"
                    >
                      <Image
                        src={category.imageUrl}
                        alt={category.title || "Category"}
                        fill
                        quality={90}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 150px, 230px"
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

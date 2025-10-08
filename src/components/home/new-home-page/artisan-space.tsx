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
      className={cn("w-full bg-[#F4F0EC] py-12", className)}
      {...props}
    >
      <div className="w-full max-w-screen-2xl mx-auto space-y-6">
        {/* Optional Title */}
        {titleData?.title && (
          <h2 className="text-2xl md:text-3xl font-normal text-gray-800 px-4">
            {titleData.title}
          </h2>
        )}

        {/* The container with the CORRECT top-to-bottom gradient background */}
        <div
          className="py-10"
          style={{
            // CORRECTED: Gradient is now 'to bottom'
            background: "linear-gradient(to bottom, #FFFFFF 9%, #D78D2F 100%)"
          }}
        >
          {/* The carousel with the white cards sits ON TOP of the gradient */}
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent className="-ml-6 px-6">
              {shopByCategories.map((category, index) => (
                <CarouselItem
                  key={index}
                  className="pl-6 basis-auto" // Use padding for the gap
                >
                  <Link href={category.url || "/shop"} className="block group">
                    {/* The white card with fixed dimensions */}
                    <div
                      className="relative bg-white rounded-2xl overflow-hidden shadow-sm"
                      style={{
                        width: "230px",
                        height: "300px",
                      }}
                    >
                      <Image
                        src={category.imageUrl}
                        alt={category.title || "Category"}
                        fill
                        quality={90}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="230px"
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

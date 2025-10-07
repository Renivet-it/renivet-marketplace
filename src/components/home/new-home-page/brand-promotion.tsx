"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// Define the structure for each item in the carousel
interface MoodboardItem {
  id: string;
  imageUrl: string;
  title?: string;
  url?: string;
}

// Define the props for the component
interface PageProps {
  moodboardItems: MoodboardItem[];
  title?: string;
  className?: string;
}

// The background image for the inner content area
const contentBackgroundUrl = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN1PvavSZkoUs8MvPRa6CdSruet23wTjfHEgmZ";

export function BrandPromotion({
  moodboardItems,
  title = "Jute & Cotton", // Default title updated to match the image
  className,
}: PageProps ) {
  // Don't render the component if there are no items to display
  if (!moodboardItems || !moodboardItems.length) {
    return null;
  }

  return (
    // Outer container with the solid background color and padding
    <div className={cn("w-full bg-[#F4F0EC] py-16 md:py-7", className)}>
      {/* This section is now just a simple max-width container */}
      <section className="relative mx-auto max-w-[1750px]">
        {/* This div now contains the background image and content */}
        <div
          className="flex flex-col items-center bg-center bg-no-repeat px-4 py-10 sm:px-6 lg:px-8"
          style={{
            // Apply a semi-transparent white overlay on top of the image
            backgroundImage: `linear-gradient(rgba(244, 240, 236, 0.85), rgba(244, 240, 236, 0.85)), url('${contentBackgroundUrl}')`,
            backgroundSize: "contain",
          }}
        >
          {/* Section Title */}
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-light tracking-wide text-black md:text-3xl">
              {title}
            </h2>
          </div>

          {/* Carousel */}
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: true,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {moodboardItems.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-auto pl-4 md:pl-6"
                >
                  <div
                    className="group relative overflow-hidden transition-shadow duration-300 hover:shadow-lg"
                    style={{
                      width: "264px",
                      height: "388px",
                      borderRadius: "30px"
                    }}
                  >
                    <Link href={item.url || "/shop"} className="block size-full">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Moodboard image"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 264px"
                      />
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    </div>
  );
}

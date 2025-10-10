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

export function BagSection({
  moodboardItems,
  title = "Jute & Cotton", // Default title
  className,
}: PageProps) {
  // Don't render the component if there are no items to display
  if (!moodboardItems || !moodboardItems.length) {
    return null;
  }

  return (
    // Outer container with the page background color
    <section className={cn("w-full bg-[#F4F0EC] py-16 md:py-24", className)}>
      {/* Centering container */}
      <div className="relative mx-auto max-w-[1500px] px-4">
        
        {/* Decorative SVG for the top oval and strings */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-full h-24 z-0">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 500 100"
            preserveAspectRatio="xMidYMax meet"
            className="max-w-lg mx-auto"
          >
            {/* Adjusted coordinates for better positioning */}
            <line x1="150" y1="100" x2="50" y2="20" stroke="#A0522D" strokeWidth="1" />
            <line x1="350" y1="100" x2="450" y2="20" stroke="#A0522D" strokeWidth="1" />
            <ellipse cx="250" cy="15" rx="60" ry="12" fill="#D2691E" />
          </svg>
        </div>

        {/* The main yellow tag-shaped container with the correct aspect ratio */}
        <div
          className="relative w-full rounded-3xl bg-yellow-500 p-4 sm:p-6 md:p-10 flex items-center"
          style={{ aspectRatio: "1300 / 389" }} // Correct aspect ratio
        >
          {/* Left "hole" of the tag */}
          <div className="absolute top-6 left-6 w-4 h-4 rounded-full bg-[#F4F0EC] md:top-8 md:left-8 md:w-6 md:h-6"></div>
          {/* Right "hole" of the tag */}
          <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-[#F4F0EC] md:top-8 md:right-8 md:w-6 md:h-6"></div>

          {/* Carousel for the bags */}
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
            <CarouselContent className="-ml-4">
              {moodboardItems.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="basis-auto pl-4" // Use basis-auto for fixed-width items
                >
                  <Link href={item.url || "/shop"} className="block group">
                    {/* White card with RESPONSIVE and FIXED dimensions */}
                    <div className="relative w-[150px] h-[144px] md:w-[261px] md:h-[250px] overflow-hidden rounded-2xl bg-white p-2 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Bag image"}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 150px, 261px"
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

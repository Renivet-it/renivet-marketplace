"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

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

export function BagSection({
  moodboardItems,
  title = "Jute & Cotton",
  className,
}: PageProps) {
  if (!moodboardItems || !moodboardItems.length) {
    return null;
  }

  return (
    <section className={cn("w-full bg-[#F4F0EC] pt-16 pb-12 md:pt-24 md:pb-16", className)}>
      <div className="relative mx-auto max-w-[1300px] px-4">

        {/* ========================================================== */}
        {/* 🔹 FIXED TAG HANDLE SVG (Responsive for Desktop)            */}
        {/* ========================================================== */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[85%] w-full z-0">
          {/* 📱 Mobile version (original curved handle) */}
          <svg
            viewBox="0 0 400 80"
            preserveAspectRatio="xMidYMax meet"
            className="block md:hidden w-full h-24"
          >
            <path
              d="M 50 70 L 150 20 H 250 L 350 70"
              stroke="#4B4B4B"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="200" cy="20" rx="40" ry="8" fill="#D2691E" />
          </svg>

          {/* 💻 Desktop version (edge-to-edge angled handle) */}
          <svg
            viewBox="0 0 1300 120"
            preserveAspectRatio="xMidYMid meet"
            className="hidden md:block w-full h-28"
          >
            <path
              d="M 180 100 L 500 25 H 800 L 1120 100"
              stroke="#4B4B4B"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="650" cy="25" rx="45" ry="8" fill="#D2691E" />
          </svg>
        </div>


        {/* ========================================================== */}
        {/* 🔸 MAIN YELLOW TAG CONTAINER                               */}
        {/* ========================================================== */}
        <div
          // Use responsive classes: h-[150px] for mobile, remove inline style
          className="relative w-full rounded-3xl bg-yellow-500 p-4 sm:p-6 md:p-10 flex items-center h-[150px] md:h-auto"
          // The aspect ratio is now controlled by responsive classes
          style={{ aspectRatio: "1300 / 480" }}
        >
          {/* Left "hole" */}
          <div className="absolute top-6 left-6 w-4 h-4 rounded-full bg-[#D2691E] md:top-8 md:left-8 md:w-6 md:h-6"></div>
          {/* Right "hole" */}
          <div className="absolute top-6 right-6 w-4 h-4 rounded-full bg-[#D2691E] md:top-8 md:right-8 md:w-6 md:h-6"></div>

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
            <CarouselContent className="-ml-4">
              {moodboardItems.map((item) => (
                <CarouselItem key={item.id} className="basis-auto pl-4">
                  <Link href={item.url || "/shop"} className="block group">
                    {/* Use responsive classes for card size */}
                    <div className="relative w-[100px] h-[100px] md:w-[261px] md:h-[250px] overflow-hidden rounded-2xl mt-8 p-2 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                      <Image
                        src={item.imageUrl}
                        alt={item.title || "Bag image"}
                        fill
                        className="object-contain"
                        // Update sizes prop for better image optimization
                        sizes="(max-width: 768px) 100px, 261px"
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

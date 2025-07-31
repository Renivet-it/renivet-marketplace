"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

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

export function MatchaBag({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          {title}
        </h2>
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Carousel Section */}
          <div className="flex-1 w-full lg:w-2/3">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                slidesToScroll: 1,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {moodboardItems.map((item) => (
                  <CarouselItem
                    key={item.id}
                    className="pl-2 basis-full"
                  >
                    <div className="relative w-full">
                      <div className="relative w-full h-[400px] group">
                        <Link
                          href={item.url ?? "/shop"}
                          className="block w-full h-full"
                        >
                          <Image
                            src={item.imageUrl}
                            alt={item.title ?? "Moodboard item"}
                            fill
                            className="object-cover rounded-lg"
                            quality={100}
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 800px"
                          />
                          <div className="absolute inset-0 flex items-end pb-8 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="bg-white text-gray-900 px-6 py-3 font-medium uppercase tracking-wide text-sm hover:bg-gray-100 transition-colors rounded"
                              aria-label={`Shop now for ${item.title ?? "product"}`}
                            >
                              Shop Now
                            </button>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Text Box Section - Overlapping the carousel */}
          <div className="w-full lg:w-1/3 lg:max-w-[330px] flex-shrink-0 lg:-ml-16 z-10 mt-8">
            <div className="bg-white border-2 border-gray-300 rounded-lg p-8 text-center shadow-sm h-fit">
              <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
                CRAFTED TO CARRY<br />
                MINDFULLY
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                elevate your everyday with<br />
                handbags made for conscious<br />
                fashion—sustainably styled, built to<br />
                last.
              </p>
              <button className="border border-gray-400 text-gray-700 px-6 py-2 text-xs font-medium uppercase tracking-wider hover:bg-gray-50 transition-colors rounded">
                EXPLORE NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
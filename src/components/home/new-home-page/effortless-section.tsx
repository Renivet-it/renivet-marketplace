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

export function EffortlessElegance({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC]", className)}>
      {/* Mobile View - Full Width Banner */}
      <div className="lg:hidden w-full">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="ml-0">
            {moodboardItems.map((item) => (
              <CarouselItem key={item.id} className="pl-0">
                <Link href={item.url ?? "/shop"} className="block w-full">
                  {/* Natural height container */}
                  <div className="w-full" style={{ height: 'auto' }}>
                    <Image
                      src={item.imageUrl}
                      alt={item.title ?? "Moodboard item"}
                      width={1200}  // Set your image's actual width
                      height={600}  // Set your image's actual height
                      className="w-full h-auto object-contain"
                      quality={100}
                      priority
                    />
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block max-w-screen-2xl mx-auto py-12 px-8 relative">
        <div className="flex flex-row gap-8 items-start">
          <div className="flex-1 w-full">
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
                  <CarouselItem key={item.id} className="pl-2 basis-full">
                    <div className="relative w-full" style={{ height: "530px" }}>
                      <Link href={item.url ?? "/shop"} className="block w-full h-full">
                        <Image
                          src={item.imageUrl}
                          alt={item.title ?? "Moodboard item"}
                          fill
                          className="object-cover rounded-lg"
                          quality={100}
                        />
                      </Link>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          <div className="absolute left-[-20px] top-1/2 transform -translate-y-1/2 max-w-[265px] z-10">
            <div className="bg-white bg-opacity-20 backdrop-blur-md p-4 text-left rounded-lg shadow-md border-2 border-white/30" style={{ height: "335px" }}>
              <h3 className="text-2xl font-light text-gray-900 mb-3 leading-tight tracking-wide">
                Effortless Elegance,<br />
                Naturally Woven
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Explore our latest collections of co-accuracy crafted sarees—based in tradition, refined for today.
              </p>
              <Link href="/shop">
                <button className="border-b border-gray-400 text-gray-700 px-1 py-1 text-sm font-medium uppercase tracking-widest hover:border-gray-600 transition-colors rounded-none">
                  EXPLORE NOW →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
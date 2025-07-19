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

export function BrandPromotion({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC] pb-6 md:pb-10", className)}>
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
        <CarouselContent>
          {moodboardItems.map((item) => (
            <CarouselItem key={item.id} className="p-0">
              <div className="w-screen relative" style={{ aspectRatio: "1740/1289" }}>
                <Link
                  href={item.url || "/shop"}
                  className="block h-full w-full"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Moodboard item"}
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                    sizes="100vw"
                  />
                </Link>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
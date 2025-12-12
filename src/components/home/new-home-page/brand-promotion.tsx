"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface MoodboardItem {
  id: string;
  imageUrl: string;
  url?: string;
}

interface PageProps {
  moodboardItems: MoodboardItem[];
  className?: string;
}

export function BrandPromotion({ moodboardItems, className }: PageProps) {
  if (!moodboardItems?.length) return null;

  return (
    <section className={cn("w-full bg-[#fcfbf4] py-4 px-4", className)}>
      <div className="max-w-[1600px] mx-auto">

        {/* ========================= TITLE ========================= */}
   <h2
  className="
    text-center
    text-[18px]         /* mobile smaller */
    md:text-[32px]      /* desktop bigger */
    font-light
    text-[#3B3B3B]
    mb-8
    tracking-wide
    whitespace-nowrap   /* forces one line */
  "
>
  Handmade Stories from Across India
</h2>


        {/* ========================= DESKTOP CAROUSEL ========================= */}
        <div className="hidden md:block">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3500,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {moodboardItems.map((item) => (
                <CarouselItem
                  key={item.id}
                   className="pl-4 mr-6 basis-auto"// ← added mr-6 for spacing
                  style={{ width: "411px" }} // EXACT WIDTH
                >
                  <Link
                    href={item.url || "/shop"}
                    className="relative block w-[411px] h-[500px] overflow-hidden border border-[#D8D2C7]"
                  >
                    <Image
                      src={item.imageUrl}
                      alt="Story Image"
                      fill
                      className="object-cover"
                    />
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* ========================= MOBILE CAROUSEL ========================= */}
        <div className="md:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3500,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {moodboardItems.map((item) => (
                <CarouselItem
                  key={item.id}
                   className="pl-4 mr-6 basis-auto"// ← added mr-6 for spacing
                  style={{ width: "260px" }}
                >
                  <Link
                    href={item.url || "/shop"}
                    className="relative block w-[260px] h-[330px] overflow-hidden border border-[#D8D2C7]"
                  >
                    <Image
                      src={item.imageUrl}
                      alt="Story Card"
                      fill
                      className="object-cover"
                    />
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

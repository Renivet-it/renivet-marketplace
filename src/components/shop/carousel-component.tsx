"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface ExhibitionCarouselProps {
  className?: string;
  slides: {
    title: string;
    date: string;
    description: string;
    imageUrl: string;
    url?: string;
  }[];
}

export function ExhibitionCarousel({ className, slides }: ExhibitionCarouselProps) {
  const aspectRatio = 1440 / 500; // Similar to Landing banner

  return (
    <section className={cn("mb-4", className)}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent
          classNames={{
            wrapper: "size-full",
            inner: "size-full ml-0",
          }}
        >
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="px-0 py-0">
              <div
                className="relative w-full overflow-hidden bg-gradient-to-tr from-pink-100 via-purple-100 to-yellow-100"
                style={{
                  paddingBottom: `${(1 / aspectRatio) * 100}%`,
                }}
              >
                {/* ✅ Image */}
                <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    width={366}
                    height={300}
                    className="w-[366px] h-[300px] object-cover md:w-full md:h-full"
                    priority={index === 0}
                    />
                {/* ✅ Text + CTA */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/30">
                  <h1 className="text-white text-2xl font-bold mb-2">{slide.title}</h1>
                  <p className="text-gray-200 mb-2">{slide.date}</p>
                  <p className="text-gray-100 text-sm mb-4 max-w-lg">{slide.description}</p>
                  <Button
                    size="lg"
                    className="bg-white text-black font-semibold uppercase rounded-full hover:bg-gray-200 py-3 px-6"
                    asChild
                  >
                    <Link href={slide.url || "/shop"}>Join Us</Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

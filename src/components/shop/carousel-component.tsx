"use client";

import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface ExhibitionCarouselProps {
  className?: string;
  slides: {
    title?: string;
    date?: string;
    description?: string;
    imageUrl: string;
    url?: string;
  }[];
}

export function ExhibitionCarousel({ className, slides }: ExhibitionCarouselProps) {
  return (
    <section className={cn("pb-2 pt-2 px-2", className)}>
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 4000 })]}
        className="w-full"
      >
        <CarouselContent classNames={{ wrapper: "size-full", inner: "size-full ml-0" }}>
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="px-0 py-0">
              <div className="relative w-[398px] h-[410px] md:w-full md:h-full overflow-hidden rounded-3xl mx-auto">
                {/* Floating shapes */}
                {[...Array(8)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute w-10 h-10 bg-white/10 rounded-xl backdrop-blur-sm"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animation: `float${i % 2 === 0 ? "X" : "Y"} ${10 + i * 2}s linear infinite`,
                    }}
                  />
                ))}

                {slide.url ? (
                  <Link href={slide.url} className="absolute inset-0 block w-full h-full">
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title || "Exhibition image"}
                      fill
                      className="object-cover rounded-3xl"
                      priority={index === 0}
                    />
                  </Link>
                ) : (
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title || "Exhibition image"}
                    fill
                    className="absolute inset-0 object-cover rounded-3xl"
                    priority={index === 0}
                  />
                )}
              </div>

              <style jsx>{`
                @keyframes floatX {
                  0% { transform: translateX(0); }
                  50% { transform: translateX(50px); }
                  100% { transform: translateX(0); }
                }
                @keyframes floatY {
                  0% { transform: translateY(0); }
                  50% { transform: translateY(-50px); }
                  100% { transform: translateY(0); }
                }
              `}</style>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
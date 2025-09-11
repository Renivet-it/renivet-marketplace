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
  const aspectRatio = 1440 / 500;

  return (
    <section className={cn("pb-2 pt-2 px-2 bg-[hsla(300, 24%, 78%, 1)]", className)}>
      <Carousel
        opts={{ align: "start", loop: true }}
        plugins={[Autoplay({ delay: 4000 })]}
        className="w-full"
      >
        <CarouselContent classNames={{ wrapper: "size-full", inner: "size-full ml-0" }}>
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="px-0 py-0">
              <div
                className="relative w-full overflow-hidden bg-gradient-to-tr from-purple-200 via-pink-200 to-yellow-100 rounded-3xl"
                style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
              >
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

                {/* Image */}
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  width={366}
                  height={300}
                  className="w-[366px] h-[300px] object-cover md:w-full md:h-full rounded-3xl"
                  priority={index === 0}
                />

                {/* Text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/30 rounded-3xl">
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
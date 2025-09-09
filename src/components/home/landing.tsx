"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import { useEffect, useState } from "react";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
  const aspectRatio = 1440 / 500; // desktop ratio
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // autoplay + progress bar logic
  useEffect(() => {
    let start = Date.now();
    const duration = 5000; // 5 seconds

    const tick = () => {
      const elapsed = Date.now() - start;
      const percent = Math.min((elapsed / duration) * 100, 100);
      setProgress(percent);

      if (elapsed >= duration) {
        setActiveIndex((prev) => (prev + 1) % banners.length);
        start = Date.now();
      }
      requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [banners.length]);

  return (
    <section className={cn("bg-[#F4F0EC]", className)} {...props}>
      {/* --- Mobile Welcome Note Only --- */}
      <div className="w-full text-center py-2 bg-white shadow-sm sm:hidden">
        <p className="text-sm font-medium text-gray-600 tracking-wide">
          Welcome to <span className="font-semibold">Renivet</span> — where fashion meets intention
        </p>
      </div>

      {/* --- Slider --- */}
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
        className="w-full bg-[#F4F0EC]"
      >
        <CarouselContent
          classNames={{
            wrapper: "size-full",
            inner: "size-full ml-0",
          }}
        >
          {banners.map((item, index) => (
            <CarouselItem key={index} className="px-0 py-0">
           
      <div
      className="relative w-full overflow-hidden bg-gray-100"
      style={{
        paddingBottom: `${(1 / aspectRatio) * 100}%`,
      }}
     >
      {/* Mobile: whole slide clickable */}
      <Link 
        href={item.url || "/shop"} 
        className="block absolute inset-0 sm:hidden"
      >
        <Image
          src={item.imageUrl}
          alt={item.title}
          width={1440}
          height={550}
          className="w-full h-full object-cover"
          priority={index === 0}
        />
      </Link>

      {/* Desktop: image + Explore Now button */}
      <div className="hidden sm:block absolute inset-0">
        <Image
          src={item.imageUrl}
          alt={item.title}
          width={1440}
          height={550}
          className="absolute inset-0 w-full h-full object-cover"
          priority={index === 0}
        />

        <div className="absolute inset-0 flex items-end justify-center pb-20">
          <Button
            size="lg"
            className="bg-transparent text-black font-medium uppercase tracking-wider rounded-none border-2 border-black 
                       hover:bg-black hover:text-white transition-colors duration-300 py-3 px-8 text-sm"
            asChild
          >
            <Link href={item.url || "/shop"}>› EXPLORE NOW</Link>
          </Button>
        </div>
      </div>
    </div>
    </CarouselItem>
          ))}
          </CarouselContent>
      
        </Carousel>

      {/* Mobile progress bar */}
<div className="sm:hidden flex justify-center items-center gap-2 mt-3">
  {banners.map((_, index) => (
    <div
      key={index}
      className="relative h-1 bg-gray-300 rounded overflow-hidden"
      style={{ width: "30px" }} 
    >
       <div
        className={cn(
          "h-1 bg-black transition-all",
          activeIndex === index ? "animate-slide-progress" : "w-0"
        )}
        style={{
          animationDuration: "5000ms", 
        }}
      />
    </div>
  ))}
</div>

<style jsx>{`
  @keyframes slide-progress {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }
  .animate-slide-progress {
    animation: slide-progress 5s linear forwards;
  }
`}</style>

</section>
  )}

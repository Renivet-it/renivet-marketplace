"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Icons } from "@/components/icons";
import { useState } from "react";

interface PageProps extends React.HTMLAttributes<HTMLElement> {
  banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
  const aspectRatio = 1440 / 500; // desktop ratio
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className={cn("", className)} {...props}>
      {/* ---------- MOBILE NAVIGATION ---------- */}
      <nav className="flex justify-around items-center p-4 bg-gray-100 md:hidden">
        <Link href="/women" className="flex flex-col items-center text-gray-700 hover:text-green-600">
          <Icons.Venus className="w-6 h-6" />
          <span className="text-xs">Women</span>
        </Link>
        <Link href="/men" className="flex flex-col items-center text-gray-700 hover:text-green-600">
          <Icons.Mars className="w-6 h-6" />
          <span className="text-xs">Men</span>
        </Link>
        <Link href="/little" className="flex flex-col items-center text-gray-700 hover:text-green-600">
          <Icons.Users className="w-6 h-6" />
          <span className="text-xs">Little Renivet</span>
        </Link>
        <Link href="/home" className="flex flex-col items-center text-gray-700 hover:text-green-600">
          <Icons.House className="w-6 h-6" />
          <span className="text-xs">Home & Living</span>
        </Link>
        <Link href="/beauty" className="flex flex-col items-center text-gray-700 hover:text-green-600">
          <Icons.Droplet className="w-6 h-6" />
          <span className="text-xs">Beauty</span>
        </Link>
      </nav>

      {/* ---------- DESKTOP CAROUSEL ---------- */}
      <div className="hidden md:block">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full"
        >
          <CarouselContent
            classNames={{ wrapper: "size-full", inner: "size-full ml-0" }}
          >
            {banners.map((item, index) => (
              <CarouselItem key={index} className="px-0 py-0">
                <div
                  className="relative w-full overflow-hidden bg-gray-100"
                  style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={1440}
                    height={550}
                    className="absolute inset-0 w-full h-full object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <Button
                      size="lg"
                      className="bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 py-3 px-6"
                      asChild
                    >
                      <Link href={item.url || "/shop"}>Shop Now</Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* ---------- MOBILE CAROUSEL WITH FLIP EFFECT ---------- */}
      <div className="md:hidden px-4 mt-4 relative">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
          className="w-full"
          onSelect={(index: number) => setActiveIndex(index)}
        >
          <CarouselContent classNames={{ wrapper: "size-full", inner: "size-full ml-0" }}>
            {banners.map((item, index) => (
              <CarouselItem key={index} className="px-0 py-0">
                <Link href={item.url || "/shop"}>
                  <div
                    className={`relative w-full h-[280px] overflow-hidden rounded-2xl transition-transform duration-700 ease-in-out ${
                      activeIndex === index ? "rotate-y-0" : "rotate-y-180"
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="w-full h-full object-fill"
                      priority={index === 0}
                    />
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

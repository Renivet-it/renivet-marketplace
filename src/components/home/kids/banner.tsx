"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Icons } from "@/components/icons";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
  const aspectRatio = 1440 / 500; // same as reference

  return (
    <section className={cn("", className)} {...props}>
      {/* ------------------- MOBILE NAVIGATION ------------------- */}
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

      {/* ------------------- DESKTOP VIEW ------------------- */}
      <div className="hidden md:block">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 5000 })]}
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
                  style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={1440}
                    height={500}
                    className="absolute inset-0 w-full h-full object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 py-3 px-8"
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
{/* ------------------- MOBILE VIEW ------------------- */}
<div className="md:hidden relative bg-[#8B34A3] text-white pb-32">
  {/* ---------- TOP DRIPPING COLOR ---------- */}
  <svg
    viewBox="0 0 1440 150"
    className="absolute top-0 left-0 w-full h-[150px] z-0"
    preserveAspectRatio="none"
  >
    <path
      d="
        M0,40 
        C60,90 120,10 180,60
        C240,110 300,20 360,70
        C420,120 480,30 540,80
        C600,130 660,40 720,90
        C780,140 840,50 900,100
        C960,150 1020,60 1080,110
        C1140,160 1200,70 1260,120
        C1320,170 1380,80 1440,130
        V0 H0 Z
      "
      fill="#8B34A3"
    />
  </svg>

  {/* ---------- carousel content ---------- */}
  <div className="relative z-10">
    <Carousel
      opts={{ align: "start", loop: true, duration: 0 }}
      plugins={[Autoplay({ delay: 5000 })]}
      className="w-full"
    >
      <CarouselContent
        classNames={{
          wrapper: "size-full",
          inner: "size-full ml-0",
        }}
      >
        {banners.map((item, index) => (
          <CarouselItem key={index} className="px-0 py-0">
            <Link href={item.url || "/shop"}>
              <div className="bg-white p-1 rounded-2xl">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={1440}
                  height={500}
                  className="w-full h-auto object-cover rounded-2xl"
                  priority={index === 0}
                />
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  </div>

  {/* ---------- BOTTOM CLOUD ---------- */}
  <svg
    viewBox="0 0 1440 200"
    className="absolute bottom-0 left-0 w-full h-[200px] z-0"
    preserveAspectRatio="none"
  >
    <path
      d="M0,160
         C120,140 240,180 360,160
         C480,140 600,180 720,160
         C840,140 960,180 1080,160
         C1200,140 1320,180 1440,160
         V200 H0 Z"
      fill="#fff"
    />
  </svg>
</div>




    </section>
  );
}

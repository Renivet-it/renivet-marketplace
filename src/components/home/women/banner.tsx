"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Icons } from "@/components/icons"; // ✅ add this import

interface PageProps extends React.HTMLAttributes<HTMLElement> {
  banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
  const aspectRatio = 1440 / 500;

  return (
    <section className={cn("", className)} {...props}>
      {/* ------------------- DESKTOP VIEW ------------------- */}
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


     {/* ------------------- MOBILE NAV ------------------- */}
     <nav className="flex justify-around items-center p-4 bg-gray-100 md:hidden">
        <Link
          href="/women"
          className="flex flex-col items-center text-gray-700 hover:text-green-600"
        >
          <Icons.Venus className="w-6 h-6" />
          <span className="text-xs">Women</span>
        </Link>
        <Link
          href="/men"
          className="flex flex-col items-center text-gray-700 hover:text-green-600"
        >
          <Icons.Mars className="w-6 h-6" />
          <span className="text-xs">Men</span>
        </Link>
        <Link
          href="/little"
          className="flex flex-col items-center text-gray-700 hover:text-green-600"
        >
          <Icons.Users className="w-6 h-6" />
          <span className="text-xs">Little Renivet</span>
        </Link>
        <Link
          href="/home"
          className="flex flex-col items-center text-gray-700 hover:text-green-600"
        >
          <Icons.House className="w-6 h-6" />
          <span className="text-xs">Home & Living</span>
        </Link>
        <Link
          href="/beauty"
          className="flex flex-col items-center text-gray-700 hover:text-green-600"
        >
          <Icons.Droplet className="w-6 h-6" />
          <span className="text-xs">Beauty</span>
        </Link>
      </nav>



{/* ------------------- MOBILE VIEW ------------------- */}
<div className="md:hidden px-2">
  <Carousel
    opts={{
      align: "start",
      loop: true,
      duration: 0, // instant switch
    }}
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
            <div className="relative w-full  h-[280px] overflow-hidden bg-gray-100 rounded-2xl">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="w-full h-full object-fill"
                priority={index === 0}
              />

    <div className="absolute inset-0 flex flex-col justify-center items-start text-left px-4">
    <div className="text-white text-xl font-serif font-medium drop-shadow-md leading-snug">
        <div>Autumn</div>
        <div>Collection</div>
        <div>2025</div>
      </div>

      <Link
        href={item.url || "/shop"}
        className="bg-[#699966] hover:bg-green-700 text-white text-xs font-medium px-1.5 py-0.5 transition"
      >
        &gt; Explore Now
      </Link>
    </div>
        
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

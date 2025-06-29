"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
  banners: Banner[];
}

export function SuggestedLook({ className, banners, ...props }: PageProps) {
  return (
    <section className={cn("pt-10 md:pt-16 lg:pt-20", className)} {...props}>
      {/* Added header title */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 mb-6">
              <h1 className="text-center text-3xl sm:text-4xl font-bold text-gray-900 mb-10">
          Suggested Looks For You
        </h1>
      </div>

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
        className="w-full aspect-[2.6/1]"
      >
        <CarouselContent
          classNames={{
            wrapper: "size-full",
            inner: "size-full ml-0",
          }}
        >
          {banners.map((item, index) => (
            <CarouselItem key={index} className="h-full p-0">
              <div className="relative size-full overflow-hidden rounded-2xl">
                <Link href="/shop" className="block size-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
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
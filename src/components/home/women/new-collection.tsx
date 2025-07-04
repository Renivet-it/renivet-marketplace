"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps {
  banners: Banner[];
  className?: string;
}

export function NewCollection({ className, banners }: PageProps) {
  return (
    <section
      className={cn("pt-10 md:pt-16 lg:pt-20", className)}
      style={{ backgroundColor: "#f4f0ec" }}
    >
      <div className="max-w-[1440px] mx-auto">
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
          style={{ height: "600px" }}
        >
          <CarouselContent
            classNames={{
              wrapper: "size-full",
              inner: "size-full ml-0",
            }}
          >
            {banners.map((item, index) => (
              <CarouselItem key={index} className="h-full p-0">
                <div className="relative w-[1440px] h-[600px] overflow-hidden">
                  <Link href="/shop" className="block size-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={1440}
                      height={600}
                      className="object-cover"
                      priority={index === 0}
                      sizes="1440px"
                    />
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
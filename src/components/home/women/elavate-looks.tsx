import React from "react";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PageProps extends GenericProps {
  shopByCategories: HomeShopByCategory[];
  title?: string;
}

export function ElevateYourLooks({
  className,
  shopByCategories,
  title = "Refine Your Style",
  ...props
}: PageProps) {
  return (
    <section
      className={cn(
        "flex w-full justify-center py-2 sm:py-12 bg-white sm:bg-[#F4F0EC]",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4 relative">
        {/* Title */}
        <h4 className="text-center text-lg sm:text-3xl font-normal sm:font-bold text-gray-900 mb-1 sm:mb-12
        font-serif sm:font-sans
        ">
          {title}
        </h4>

 {/* =====================  MOBILE VIEW===================== */}
<div className="sm:hidden relative">
  <Carousel
    opts={{ align: "start", loop: true, slidesToScroll: "auto" }}
    className="w-full"
  >
    <CarouselContent className="-ml-1">
      {shopByCategories.map((category, index) => (
        <CarouselItem
          key={index}
          className="px-1 basis-1/4 min-w-0"
        >
          <Link
            href={category.url || "/shop"}
            className="group flex flex-col items-center w-full"
          >
            <div className="mx-auto mb-1 w-[70px] h-[70px] rounded-full overflow-hidden relative shrink-0">
              <Image
                src={category.imageUrl}
                alt={category.title || "Category"}
                fill
                sizes="70px"
                className="absolute inset-0 w-full h-full min-w-full min-h-full object-cover"
              />
            </div>

            <p className="text-[10px] font-normal uppercase text-gray-800 text-center">
              {category.title || "Category"}
            </p>
          </Link>
        </CarouselItem>
      ))}
    </CarouselContent>
  </Carousel>
</div>
          

        {/* =====================  DESKTOP VIEW (original code)  ===================== */}
        <div className="hidden sm:block px-2 relative">
          <Carousel
            opts={{ align: "start", loop: true, slidesToScroll: "auto" }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {shopByCategories.map((category, index) => (
                <CarouselItem
                  key={index}
                  className="pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 min-w-0"
                >
                  <Link
                    href={category.url || "/shop"}
                    className="group flex flex-col items-center w-full px-1"
                  >
                    <div className="rounded-full overflow-hidden w-full aspect-square mb-4">
                      <div className="rounded-full overflow-hidden w-full h-full">
                        <Image
                          src={category.imageUrl}
                          alt={category.title || "Category"}
                          width={176}
                          height={176}
                          sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 160px"
                          quality={100}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <p className="text-lg font-medium uppercase text-gray-800 sm:text-sm text-center">
                      {category.title || "Category"}
                    </p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 -translate-x-6 top-1/2 -translate-y-1/2 hidden md:flex" />
            <CarouselNext className="absolute right-0 translate-x-6 top-1/2 -translate-y-1/2 hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
}

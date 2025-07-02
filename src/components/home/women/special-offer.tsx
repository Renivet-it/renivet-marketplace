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

export function SpecialOffer({ className, banners, ...props }: PageProps) {
  return (
    <section className={cn("w-full py-8 md:py-12 bg-white", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Section */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {banners.map((item : any) => (
            <div
              key={item.id}
              className="relative w-full aspect-[605/755] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              {/* @ts-ignore */}
              <Link href={item.url || "#"} className="block h-full w-full">
                {/* Image with exact dimensions */}
                <div className="relative w-full h-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={605}
                    height={755}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>

                {/* Text Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 text-white">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base italic">
                      {item.description?.[0]}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-semibold mb-2">
                      {item.description?.[1]}
                    </p>
                    <button className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition">
                      { "BUY NOW"}
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface CollectionItem {
  id: string;
  imageUrl: string;
  context?: string;
  title: string;
  description?: string;
  ctaText?: string;
  url: string;
  shape?: "circle" | "rectangle";
  isSpecial?: boolean;
}

interface PageProps {
  collections: CollectionItem[];
  title?: string;
  className?: string;
}

export function TopCollection({
  collections,
  title = "Top Collection",
  className,
}: PageProps) {
  if (!collections.length) return null;

  return (
    <section className={cn("w-full py-12 bg-white", className)}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-left text-gray-900 mb-12">
          {title}
        </h1>

        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            loop: true,
            // @ts-ignore
            autoplay: 3000, // Slides every 3 seconds
          }}
          className="w-full"
        >
          <div className="relative">
            <CarouselContent className="px-4 space-x-4">
              {collections.map((collection) => (
                <CarouselItem
                  key={collection.id}
                  className="basis-full sm:basis-1/2 lg:basis-1/2 snap-start"
                >
                  <div className="group relative h-full bg-gray-50 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 p-6 flex flex-col items-start text-left space-y-4">
                    {/* Context/Brand Label */}
                    {collection.context && (
                      <div className="text-sm font-semibold text-gray-500 flex items-center space-x-2">
                        <span className="text-lg font-bold text-black">🌍</span>
                        <span>{collection.context}</span>
                      </div>
                    )}

                    {/* Image Container */}
                    <div
                      className={cn(
                        "relative w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden"
                      )}
                    >
                      <Image
                        src={collection.imageUrl}
                        alt={collection.title}
                        fill
                        className={cn(
                          "object-cover transition-transform duration-500 group-hover:scale-105"
                        )}
                      />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 uppercase">
                      {collection.title}
                    </h2>

                    {/* Description */}
                    {collection.description && (
                      <p className="text-sm text-gray-600">
                        {collection.description}
                      </p>
                    )}

                    {/* CTA Button - Only for the right item */}
                    {collection.isSpecial && (
                      <Link
                        href={collection.url}
                        className="inline-block mt-2 px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition"
                      >
                        {collection.ctaText || "Buy now"}
                      </Link>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
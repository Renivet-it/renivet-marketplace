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
  title = "Top Collections",
  className,
}: PageProps) {
  if (!collections.length) return null;

  return (
    <section
      className={cn("w-full py-4 md:py-12", className)}
      style={{ backgroundColor: "#f4f0ec" }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-lg md:text-3xl lg:text-4xl font-normal sm:font-bold text-left text-gray-900 mb-4 md:mb-12">
          {title}
        </h1>

        {/* Desktop Carousel */}
        <div className="hidden md:block">
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="px-2 md:px-4 -ml-2 md:space-x-4">
              {collections.map((collection) => (
                <CarouselItem
                  key={collection.id}
                  className="pl-2 basis-1/2 lg:basis-1/3 snap-start"
                >
                  <CollectionCard collection={collection} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Mobile: Stack one by one vertically */}
        <div className="flex flex-col md:hidden gap-4">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Reusable card component
function CollectionCard({ collection }: { collection: CollectionItem }) {
  return (
    <div
      className={cn(
        "group relative w-full rounded-xl md:rounded-2xl overflow-hidden shadow-sm transition-all duration-300 p-4 md:p-6 flex flex-col items-start text-left space-y-2"
      )}
      style={{ backgroundColor: "#f4f0ec" }}
    >
      {/* Context/Brand Label */}
      {collection.context && (
        <div className="text-xs md:text-sm font-semibold text-gray-500 flex items-center space-x-2">
          <span className="text-base md:text-lg font-bold text-black">🌍</span>
          <span>{collection.context}</span>
        </div>
      )}

      {/* Image */}
      <div
        className={cn(
          "relative w-full rounded-lg md:rounded-xl overflow-hidden",
          "aspect-[16/9] md:h-[322px] md:w-[571px]"
        )}
      >
        <Image
          src={collection.imageUrl}
          alt={collection.title}
          width={571}
          height={322}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 571px"
        />
      </div>

      {/* Title */}
      <h2 className="text-lg md:text-xl font-bold text-gray-900 uppercase">
        {collection.title}
      </h2>

      {/* Description */}
      {collection.description && (
        <p className="text-xs md:text-sm text-gray-600">{collection.description}</p>
      )}

      {/* CTA Button */}
      {collection.isSpecial && (
        <Link
          href={collection.url}
          className="inline-block mt-2 px-4 md:px-6 py-1 md:py-2 text-xs md:text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition"
        >
          {collection.ctaText || "Buy now"}
        </Link>
      )}
    </div>
  );
}

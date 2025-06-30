"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MoodboardItem {
  id: string;
  imageUrl: string;
  title?: string;
  url?: string;
}

interface PageProps {
  moodboardItems: MoodboardItem[];
  title?: string;
  className?: string;
}

export function MoodboardItem({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full py-6 md:py-12 bg-white", className)}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Subtitle */}
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            {title}
          </h2>
          <p className="text-gray-600 text-xs md:text-base">
            A curated collage of what's trending, timeless
          </p>
        </div>

        {/* Image Grid - Mobile optimized */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 lg:gap-6">
          {moodboardItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="group relative w-full aspect-[3/4] overflow-hidden rounded-md md:rounded-lg shadow-xs md:shadow-sm hover:shadow-md transition-all duration-300"
            >
              {item.url ? (
                <Link href={item.url} className="block h-full w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Moodboard item"}
                    width={320}
                    height={427}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 320px"
                  />
                </Link>
              ) : (
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Moodboard item"}
                  width={320}
                  height={427}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 320px"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
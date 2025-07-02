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
    <section className={cn("w-full bg-white", className)}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title & Subtitle */}
        <div className="text-center mb-6 md:mb-10 pt-8">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            {title}
          </h2>
          <p className="text-gray-600 text-xs md:text-base">
            A curated collage of what&apos;s trending, timeless
          </p>
        </div>

        {/* Full-width image container */}
        <div className="relative w-full aspect-[1440/1442] min-h-[50vh]">
          {moodboardItems.slice(0, 1).map((item) => (
            <div key={item.id} className="absolute inset-0">
              {item.url ? (
                <Link href={item.url} className="block h-full w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Moodboard item"}
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                    sizes="100vw"
                  />
                </Link>
              ) : (
                <Image
                  src={item.imageUrl}
                  alt={item.title || "Moodboard item"}
                  fill
                  className="object-cover"
                  priority
                  quality={100}
                  sizes="100vw"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
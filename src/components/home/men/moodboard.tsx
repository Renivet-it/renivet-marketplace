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

export function MoodboardItemMen({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC] pb-6 md:pb-10", className)}>
      <div className="max-w-screen-2xl mx-auto">
        {/* Title & Subtitle */}
        <div className="text-center mb-4 md:mb-10 pt-6 md:pt-8 px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            Curated His Essence
          </h2>
        </div>

        {/* Responsive image container */}
        {moodboardItems.slice(0, 1).map((item) => (
          <div
            key={item.id}
            className="w-full relative aspect-[1440/1289] h-auto"
          >
            <Link
              href={item.url || "/shop"}
              className="block h-full w-full"
            >
              <Image
                src={item.imageUrl}
                alt={item.title || "Moodboard item"}
                fill
                className="w-full h-full object-cover"
                priority
                quality={100}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1440px"
              />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
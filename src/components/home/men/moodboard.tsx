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
  title = "Moodboard for Him",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-white sm:bg-[#F4F0EC] pb-2 md:pb-10", className)}>
      <div className="max-w-screen-2xl mx-auto">
        {/* Title & Subtitle */}
        <div className="text-center mb-3 md:mb-10 pt-2 md:pt-8 px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg md:text-3xl font-normal sm:font-bold text-gray-900 mb-1 md:mb-2
            font-serif sm:font-sans"
          >
            Curated His Essence
          </h2>

          {/* Mobile-only subtitle */}
          <p className="sm:hidden text-sm font-normal font-sans">
            The outfit library
          </p>
        </div>

        {/* Responsive image container */}
        {moodboardItems.slice(0, 1).map((item) => (
          <div key={item.id} className="w-full relative aspect-[1440/1289] h-auto">
            <Link href={item.url || "/shop"} className="block h-full w-full">
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

            {/* Mobile-only Explore Now button */}
            <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2">
              <Link
                href={item.url || "/shop"}
                className="bg-[#f7f3e1] text-black text-xs font-medium px-1.5 py-0.5 transition"
              >
                &gt; Explore Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

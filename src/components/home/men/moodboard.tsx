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
    <section className={cn("w-full bg-[#F4F0EC] pb-10", className)}> {/* Added padding-bottom */}
      <div className="max-w-screen-2xl mx-auto">
        {/* Title & Subtitle */}
        <div className="text-center mb-6 md:mb-10 pt-8 px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            Curated Her Essence
          </h2>
        </div>

        {/* Full-width image with clickable link - always clickable with fallback to /shop */}
        {moodboardItems.slice(0, 1).map((item) => (
          <div key={item.id} className="w-full relative" style={{ height: "1289px" }}>
            <Link
              href={item.url || "/shop"} // Fallback to /shop if no URL provided
              className="block h-full w-full"
            >
              <Image
                src={item.imageUrl}
                alt={item.title || "Moodboard item"}
                width={1440}
                height={1289}
                className="w-full h-full object-cover"
                priority
                quality={100}
              />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
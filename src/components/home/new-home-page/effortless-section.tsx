"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export function EffortlessElegance({
  moodboardItems,
  title = "Special Offer", // Updated default title
  className,
}: PageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const AUTOPLAY_DELAY = 4000; // 4 seconds

  useEffect(() => {
    if (moodboardItems.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % moodboardItems.length);
      }, AUTOPLAY_DELAY);
      return () => clearInterval(interval);
    }
  }, [moodboardItems.length]);

  if (!moodboardItems || !moodboardItems.length) {
    return null;
  }

  return (
    <section className={cn("w-full bg-[#F4F0EC] py-8", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative w-full overflow-hidden"
          // Set the aspect ratio based on the image dimensions (1363.34 / 300)
          style={{ aspectRatio: "1363.34 / 300" }}
        >
          {moodboardItems.map((item, index) => (
            <Link
              key={item.id}
              href={item.url ?? "/shop"}
              className={cn(
                "absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out",
                index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              <Image
                src={item.imageUrl}
                alt={item.title ?? "Promotional banner"}
                fill
                className="object-cover"
                sizes="(max-width: 1536px) 100vw, 1536px"
                priority={index === 0}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

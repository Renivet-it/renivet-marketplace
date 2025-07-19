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

export function MatchaBag({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC] pb-6 md:pb-10", className)}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Container with max-width */}
        {moodboardItems.map((item) => (
          <div
            key={item.id}
            className="w-full relative overflow-hidden rounded-lg" // Removed w-screen, added rounded-lg
            style={{ aspectRatio: "1279/1542" }} // Updated to your desired ratio
          >
            <Link
              href={item.url || "/shop"}
              className="block h-full w-full"
            >
              <Image
                src={item.imageUrl}
                alt={item.title || "Moodboard item"}
                fill
                className="object-cover"
                priority
                quality={100}
                sizes="(max-width: 768px) 100vw, (max-width: 1279px) 100vw, 1279px" // Adjusted sizes
              />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
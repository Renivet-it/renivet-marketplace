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

export function BrandPromotion({
  moodboardItems,
  title = "Moodboard for Her",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC] pb-6 md:pb-10", className)}>
      {/* Full-page image container without max-width constraints */}
      {moodboardItems.map((item) => (
        <div
          key={item.id}
          className="w-screen relative" // Using w-screen to ensure full viewport width
          style={{ aspectRatio: "1740/1289" }}
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
              sizes="100vw" // Since it's full width, we can use 100vw
            />
          </Link>
        </div>
      ))}
    </section>
  );
}
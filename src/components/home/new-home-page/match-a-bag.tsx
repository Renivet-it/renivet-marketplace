"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface MoodboardItem {
  id: string;
  imageUrl: string;
  url?: string;
  showButton?: boolean;
}

interface PageProps {
  moodboardItems: MoodboardItem[];
  title?: string;
  className?: string;
}

export function MatchaBag({
  moodboardItems,
  title = "Alternatives For Everyday Living.",
  className,
}: PageProps) {
  if (!moodboardItems.length) return null;

  return (
    <section className={cn("w-full bg-[#F4F0EC] py-12", className)}>
      <div className="max-w-screen-2xl mx-auto px-4">

        {/* Title */}
        <h2 className="text-center text-3xl font-light text-[#4a463f] mb-10">
          {title}
        </h2>

        {/* ---------------------- DESKTOP (unchanged) ---------------------- */}
<div className="hidden md:grid grid-cols-6 gap-4">
          {moodboardItems.map((item) => (
            <Link
              key={item.id}
              href={item.url || "/shop"}
              className="relative w-full"
            >
              <div className="relative w-full h-[235px] overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>

              {item.showButton && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button className="bg-[#3a493f] text-white text-sm px-4 py-1 rounded-sm shadow">
                    Shop Now
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* ----------------------- MOBILE (fixed layout) --------------------- */}
        <div className="md:hidden grid grid-cols-3 gap-2">
          {moodboardItems.map((item) => (
            <Link
              key={item.id}
              href={item.url || "/shop"}
              className="relative w-full"
            >
              <div className="relative w-full h-[150px] overflow-hidden rounded">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>

              {item.showButton && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <button className="bg-[#3a493f] text-white text-[10px] px-2 py-1 rounded shadow">
                    Shop Now
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

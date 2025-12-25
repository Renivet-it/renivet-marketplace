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
    <section className={cn("w-full bg-[#FCFBF4] pb-0 mb-0", className)}>
      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Title */}
        <h2 className="text-center text-[18px] md:text-[32px] font-light text-[#3B3B3B] mb-3 md:mb-8 tracking-wide">
          {title}
        </h2>

        {/* ================= DESKTOP ================= */}
        <div className="hidden md:flex justify-center gap-6">
          {moodboardItems.map((item) => (
            <Link
              key={item.id}
              href={item.url || "/shop"}
              className="relative"
            >
              <div className="relative w-[690px] h-[452px] overflow-hidden rounded-sm">
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>

              {item.showButton && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                  <button className="bg-[#3a493f] text-white text-sm px-6 py-2 rounded-sm shadow">
                    Shop Now
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* ================= MOBILE (CAROUSEL) ================= */}
        <div className="md:hidden overflow-x-auto scrollbar-hide mb-0 pb-0">
          <div className="flex gap-4 w-max px-2 py-0">
            {moodboardItems.map((item) => (
              <Link
                key={item.id}
                href={item.url || "/shop"}
                className="relative flex-shrink-0"
              >
                <div className="relative w-[360px] h-[240px] overflow-hidden rounded-sm">
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    className="object-contain bg-[#fcfbf4]"
                  />
                </div>

                {item.showButton && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button className="bg-[#3a493f] text-white text-xs px-4 py-2 rounded shadow">
                      Shop Now
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Advertisement } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  advertisements: Advertisement[];
}

export function TopCollectionBanner({ advertisements }: PageProps) {
  if (!advertisements.length) return null;

  return (
    <div className="w-full px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:py-12 bg-white">
      {/* Header and Show all */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900">
          Top Collection
        </h1>
        <Link
          href="/all-collections"
          className="text-sm sm:text-base text-gray-600 hover:text-gray-900 transition-colors"
        >
          View All Collections →
        </Link>
      </div>

      {/* Banner Grid */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 gap-4 sm:gap-6">
        {advertisements.map((ad) => (
          <div
            key={ad.id}
            className="relative w-full overflow-hidden rounded-2xl bg-gray-50 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Full-width image container */}
            <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px]">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              {/* Text overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent flex items-center p-6 sm:p-8 md:p-12">
                <div className="text-white max-w-md">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
                    {ad.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6">
                    {/* @ts-ignore */}
                    {ad.collection}
                  </p>
                  <Link
                    href={ad.url || "#"}
                    className="inline-block px-6 py-2 sm:px-8 sm:py-3 text-sm sm:text-base bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
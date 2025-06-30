"use client";

import { Advertisement } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  advertisements: Advertisement[];
}

export function DiscountOffer({ advertisements }: PageProps) {
  if (!advertisements.length) return null;

  return (
    <div className="relative w-full px-0 py-8 md:py-16 mt-8">
      {advertisements.map((ad) => (
        <div
          key={ad.id}
          className="relative w-full max-w-[1430px] mx-auto overflow-hidden md:border-2 border-gray-200 md:shadow-lg rounded-none md:rounded-3xl"
        >
          {/* Responsive Container - Full width on mobile, fixed on desktop */}
          <div className="relative w-full aspect-[1430/500] md:h-[500px]">
            {ad.url ? (
              <Link href={ad.url} target="_blank" className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={1434}
                  height={500}
                  className="object-cover w-full h-full rounded-none md:rounded-3xl"
                  priority
                  quality={100}
                  sizes="100vw"
                />
                {/* Responsive Shop Now Button */}
                <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
                  <button className="bg-white text-gray-900 font-bold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 text-sm md:text-base">
                    Shop Now
                  </button>
                </div>
              </Link>
            ) : (
              <div className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={1430}
                  height={500}
                  className="object-cover w-full h-full rounded-none md:rounded-3xl"
                  priority
                  quality={100}
                  sizes="100vw"
                />
                {/* Responsive Shop Now Button */}
                <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
                  <button className="bg-white text-gray-900 font-bold py-2 px-6 md:py-3 md:px-8 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-300 text-sm md:text-base">
                    Shop Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
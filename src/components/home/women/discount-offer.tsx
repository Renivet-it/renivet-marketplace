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
    <div className="relative w-full px-4 py-12 md:px-8 md:py-16 mt-8"> {/* Increased py-6 to py-12 and md:py-8 to md:py-16 */}
      {advertisements.map((ad) => (
        <div
          key={ad.id}
          className="relative w-full max-w-5xl md:max-w-6xl lg:max-w-7xl mx-auto overflow-hidden border-2 border-gray-200 shadow-lg rounded-3xl"
        >
          {/* 2:1 Aspect Ratio Container */}
          <div className="relative w-full" style={{ paddingTop: "50%" }}>
            {ad.url ? (
              <Link href={ad.url} target="_blank" className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover rounded-3xl"
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                />
              </Link>
            ) : (
              <div className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover rounded-3xl"
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
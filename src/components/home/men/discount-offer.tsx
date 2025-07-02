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
    <div className="relative w-full px-0 py-12 md:py-16 mt-8">
      {advertisements.map((ad) => (
        <div key={ad.id} className="relative w-full overflow-hidden">
          {/* Full-width 1496×652 Container */}
          <div
            className="relative w-full mx-auto"
            style={{
              aspectRatio: "1496/652",
              maxWidth: "1496px"
            }}
          >
            {ad.url ? (
              <Link href={ad.url} target="_blank" className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={1496}
                  height={652}
                  className="object-cover w-full h-full"
                  priority
                  quality={100}
                  sizes="100vw"
                />
              </Link>
            ) : (
              <div className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={1496}
                  height={652}
                  className="object-cover w-full h-full"
                  priority
                  quality={100}
                  sizes="100vw"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
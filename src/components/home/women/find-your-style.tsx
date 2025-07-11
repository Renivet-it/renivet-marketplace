"use client";

import { Advertisement } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  advertisements: Advertisement[];
}

export function FindYourStyle({ advertisements }: PageProps) {
  if (!advertisements.length) return null;

  return (
    <div className="relative w-full bg-[#F4F0EC] px-0 py-8 sm:px-4 md:py-12 lg:px-8 lg:py-16">
      {advertisements.map((ad) => (
        <div
          key={ad.id}
          className="relative w-full max-w-[1440px] mx-auto overflow-hidden"
          style={{
            background: "#f4f0ec",
            height: "auto",
            aspectRatio: "1440/670",
            maxHeight: "670px"
          }}
        >
          {/* Decorative Background Elements */}
          <div
style={{ backgroundColor: "#f4f0ec" }}
          />

          {/* Responsive Container */}
          <div className="relative w-full h-full">
            {ad.url ? (
              <Link href={ad.url} target="_blank" className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-contain sm:object-cover"
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
                  fill
                  className="object-contain sm:object-cover"
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
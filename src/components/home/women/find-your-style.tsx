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
    <div className="relative w-full px-4 py-12 md:px-8 md:py-16 mt-8">
      {advertisements.map((ad) => (
        <div
          key={ad.id}
          className="relative w-full max-w-[1440px] mx-auto overflow-hidden shadow-lg"
          style={{
            clipPath: "polygon(3% 1%, 10% 0%, 20% 2%, 30% 0%, 40% 1%, 50% 0%, 60% 2%, 70% 0%, 80% 1%, 90% 0%, 97% 2%, 99% 5%, 100% 10%, 99% 20%, 100% 30%, 99% 40%, 100% 50%, 99% 60%, 100% 70%, 99% 80%, 100% 90%, 98% 97%, 90% 99%, 80% 100%, 70% 99%, 60% 100%, 50% 99%, 40% 100%, 30% 99%, 20% 100%, 10% 99%, 2% 98%, 0% 90%, 1% 80%, 0% 70%, 1% 60%, 0% 50%, 1% 40%, 0% 30%, 1% 20%, 0% 10%)",
            background: "white",
            height: "670px",
            width: "100%"
          }}
        >
          {/* Decorative Background Elements */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><path d=\"M10 10 Q 50 50, 90 10\" fill=\"none\" stroke=\"%23d4e4d4\" stroke-width=\"2\"/><path d=\"M20 15 Q 50 60, 80 15\" fill=\"none\" stroke=\"%23d4e4d4\" stroke-width=\"1\"/><circle cx=\"10\" cy=\"10\" r=\"3\" fill=\"%23d4e4d4\"/><circle cx=\"90\" cy=\"10\" r=\"3\" fill=\"%23d4e4d4\"/></svg>')",
              backgroundRepeat: "repeat",
              opacity: 0.3,
            }}
          />
          {/* 1440×670 Container */}
          <div className="relative w-full h-full">
            {ad.url ? (
              <Link href={ad.url} target="_blank" className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={1440}
                  height={670}
                  className="object-cover w-full h-full"
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1440px"
                />
              </Link>
            ) : (
              <div className="absolute inset-0">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  width={1440}
                  height={670}
                  className="object-cover w-full h-full"
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1440px"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
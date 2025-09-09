"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface InstaPost {
  id: string;
  imageUrl: string;
  url: string;
}

interface PageProps {
  banners: InstaPost[];
  className?: string;
}

export function InstaBanner({ className, banners }: PageProps) {
  // Fixed desktop dimensions
  const boxDimensions = [
    { width: 173, height: 209 },
    { width: 173, height: 258 },
    { width: 173, height: 209 },
    { width: 173, height: 258 },
    { width: 173, height: 209 },
    { width: 173, height: 258 },
    { width: 173, height: 209 },
    { width: 173, height: 258 },
  ];

  return (
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)}>
      <div className="max-w-[1612px] mx-auto px-4">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase text-gray-800 inline-block border-b-2 border-gray-300 pb-2 px-4">
            Follow Us On Instagram
          </h2>
        </div>

        {/*  Mobile Layout (hidden on md and up) */}
        <div className="grid grid-cols-2 gap-2 sm:hidden">
          {banners.slice(0, 8).map((post, index) => (
            <div key={post.id || index} className="relative w-full aspect-[3/4]">
              <Link href={post.url || "#"} className="block w-full h-full">
                <Image
                  src={post.imageUrl}
                  alt={`Instagram post ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="40vw"
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Desktop Layout (hidden on small) */}
        <div className="hidden sm:flex flex-wrap justify-center">
          {banners.slice(0, 8).map((post, index) => {
            const dimensions = boxDimensions[index];
            return (
              <div
                key={post.id || index}
                className="relative overflow-hidden m-1"
                style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                }}
              >
                <Link href={post.url || "#"} className="block w-full h-full">
                  <Image
                    src={post.imageUrl}
                    alt={`Instagram post ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 20vw, 173px"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

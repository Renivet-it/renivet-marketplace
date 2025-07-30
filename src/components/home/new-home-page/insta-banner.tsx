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
  // Fixed box dimensions in exact order
  const boxDimensions = [
    { width: 173, height: 209 }, // Box 1
    { width: 173, height: 258 }, // Box 2
    { width: 173, height: 209 }, // Box 3
    { width: 173, height: 258 }, // Box 4
    { width: 173, height: 209 }, // Box 5
    { width: 173, height: 258 }, // Box 6
    { width: 173, height: 209 }, // Box 7
    { width: 173, height: 258 }  // Box 8
  ];

  return (
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)}>
      <div className="max-w-[1612px] mx-auto px-4">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase text-gray-800 inline-block border-b-2 border-gray-300 pb-2 px-4">
            Follow Us On Instagram
          </h2>
          {/* <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sorsitengue eius utlrices sollicitudin etiquam sism.
          </p> */}
        </div>

        {/* Instagram Grid - Fixed layout */}
        <div className="flex flex-wrap justify-center" style={{ gap: 0 }}>
          {banners.slice(0, 8).map((post, index) => {
            const dimensions = boxDimensions[index];
            return (
              <div
                key={post.id || index}
                className="relative overflow-hidden"
                style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`
                }}
              >
                <Link href={post.url || "#"} className="block w-full h-full">
                  <Image
                    src={post.imageUrl}
                    alt={`Instagram post ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
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
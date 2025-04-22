"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CollectionItem {
  id: string;
  imageUrl: string;
  title: string;
  description?: string[];
  ctaText?: string;
  url?: string;
}

interface TopCollectionProps {
  collections: CollectionItem[];
  title?: string;
  className?: string;
}

export function TopCollection({
  collections,
  className,
}: TopCollectionProps) {
  if (!collections.length) return null;

  return (
    <section className={cn("w-full py-8 md:py-12 bg-white", className)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {collections.map((item) => (
            <Link
              key={item.id}
              href={item.url || "#"}
              className="flex flex-col w-full max-w-[360px] sm:max-w-[420px] mx-auto bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg overflow-hidden hover:shadow-lg sm:hover:shadow-xl transition-shadow duration-300"
            >
              {/* Responsive Image Container */}
              <div className="relative w-full aspect-[4/3.2] sm:aspect-[4/3.5]">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority
                />
              </div>

              <div className="flex-1 flex flex-col p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 text-center">
                  {item.title}
                </h2>

                {item.description && (
                  <ul className="text-sm sm:text-base text-gray-700 mt-2 sm:mt-3 space-y-1 sm:space-y-2 list-disc list-inside">
                    {item.description.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
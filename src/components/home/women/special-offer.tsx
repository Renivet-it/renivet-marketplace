"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  banners: Banner[];
  className?: string;
}

export function SpecialOffer({ className, banners }: PageProps) {
  return (
    <section
      className={cn(
        "w-full py-1 md:py-12 bg-white md:bg-[#f4f0ec]",
        className
      )}
    >
      <div className="mx-auto max-w-screen-2xl px-2 sm:px-6 lg:px-8">
    {/* Mobile: 2 items side by side with increased height */}
<div className="flex gap-4 md:hidden">
  {banners.map((item: any) => (
    <div
      key={item.id}
      className="w-1/2 h-[300px] sm:h-[350px] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <Link href={item.url || "#"} className="block h-full w-full">
        <div className="relative w-full h-full">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-fill w-full h-full"
            priority
          />
        </div>

        {/* Text Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
          <div>
            <h3 className="text-base font-bold mb-1">{item.title}</h3>
            <p className="text-xs italic">{item.description?.[0]}</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold mb-1">{item.description?.[1]}</p>
            <button className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-100 transition">
              BUY NOW
            </button>
          </div>
        </div>
      </Link>
    </div>
  ))}
</div>


        {/* Desktop: grid */}
        <div className="hidden md:grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {banners.map((item: any) => (
            <div
              key={item.id}
              className="relative w-full aspect-[584/450] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <Link href={item.url || "#"} className="block h-full w-full">
                <div className="relative w-full h-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={584}
                    height={467}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>

                {/* Text Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8 text-white">
                  <div>
                    <h3 className="text-lg sm:text-3xl font-bold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base italic">
                      {item.description?.[0]}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-semibold mb-2">
                      {item.description?.[1]}
                    </p>
                    <button className="bg-white text-gray-900 px-6 py-2 rounded-full text-sm sm:text-base font-medium hover:bg-gray-100 transition">
                      BUY NOW
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

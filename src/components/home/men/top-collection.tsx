"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  collections: Banner[];
  className?: string;
}

export function TopCollection({ className, collections }: PageProps) {
  return (
    <section
      className={cn("w-full py-2 md:py-8", className)}
      style={{ backgroundColor: "#FCFBF4" }}
    >
                <h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-4">
Style That Moves With You
</h2>
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">

          {collections.map((item: any) => (
            <div
              key={item.id}
              className="
  relative w-full overflow-hidden
  rounded-2xl shadow-md transition-shadow duration-300
  aspect-[4/3] sm:aspect-[584/450]
  hover:shadow-xl
"

            >
              <Link href={item.url || "#"} className="block h-full w-full">
                {/* Image with new dimensions */}
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
               <div className="
  absolute inset-0 flex flex-col justify-between
  p-4 sm:p-8 text-white
  bg-gradient-to-t from-black/50 via-black/20 to-transparent sm:bg-none
">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold mb-2">
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
                  <button className="
  bg-white/90 text-gray-900
  px-4 py-1.5 sm:px-6 sm:py-2
  rounded-full text-xs sm:text-base font-medium
  hover:bg-white transition
">
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
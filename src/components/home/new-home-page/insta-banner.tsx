"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// --- INTERFACES ---
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
  return (
    <section className={cn("w-full bg-[#F4F0EC]", className)}>
      <div className="max-w-[1509px] mx-auto px-4">
        {/* ========================================================== */}
        {/* 🔹 UNIFIED & LEFT-ALIGNED VIEW                            */}
        {/* ========================================================== */}
        <div
          className={cn(
            "w-full rounded-2xl",
            "p-4 md:p-14" // Responsive padding: smaller on mobile, larger on desktop
          )}
          style={{
            background: "linear-gradient(to bottom, #C95E5A 0%, rgba(201, 94, 90, 0) 50%, #C95E5A 100%)",
          }}
        >
          {/* --- Desktop View: Left-Aligned Flex Layout --- */}
          <div className="hidden md:flex flex-wrap justify-start gap-6">
            {banners.map((post, index) => (
              <div
                key={post.id || index}
                className="group bg-[#FFFBEB] rounded-2xl p-2 shadow-lg"
                style={{
                  width: "231px",
                  height: "348px",
                }}
              >
                <Link href={post.url || "#"} className="block w-full h-full">
                  <div className="relative w-full h-full">
                    <Image
                      src={post.imageUrl}
                      alt={`Festive item ${index + 1}`}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-105"
                      sizes="231px"
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* --- Mobile View: Left-Aligned Carousel --- */}
          <div className="md:hidden">
            <Carousel opts={{ align: "start", loop: banners.length > 2 }} className="w-full">
              {/* Use ml-0 and control spacing with padding on items */}
              <CarouselContent className="ml-0">
                {banners.map((post, index) => (
                  // Use basis-1/2 for a 2-across view on mobile, with padding for gutters
                  <CarouselItem key={post.id || index} className="basis-1/2 pr-2">
                    <div className="group bg-[#FFFBEB] rounded-2xl p-1.5 shadow-lg w-full h-auto aspect-[2/3]">
                      <Link href={post.url || "#"} className="block w-full h-full">
                        <div className="relative w-full h-full">
                          <Image
                            src={post.imageUrl}
                            alt={`Festive item ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="(max-width: 767px) 50vw, 140px"
                          />
                        </div>
                      </Link>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}

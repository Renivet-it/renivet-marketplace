"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"; // Make sure this path is correct

// --- INTERFACES (UNCHANGED) ---
interface InstaPost {
  id: string;
  imageUrl: string;
  url: string;
}

interface PageProps {
  banners: InstaPost[];
  className?: string;
}

const topCategoryImages = [
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcCP5AieO4H8MeNYoyJQSarWCqgVpRxP5lDBu",
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjzPoAomPpnZoHc5f2E4rFNLugdK3ty9ObjYx",
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNyDgSLH5TEHko4KfX8CDn1z7Q2migSIjw0dsy",
  // "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNcCP5AieO4H8MeNYoyJQSarWCqgVpRxP5lDBu",
  // "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNjzPoAomPpnZoHc5f2E4rFNLugdK3ty9ObjYx",
];

export function InstaBanner({ className, banners }: PageProps ) {
  return (
    <section className={cn("w-full py-12 bg-[#F4F0EC]", className)}>
      <div className="max-w-[1509px] mx-auto px-4">

        {/* ========================================================== */}
        {/* 🔹 DESKTOP-ONLY VIEW (Original code, untouched)          */}
        {/* ========================================================== */}
        <div className="hidden md:block">
          <div
            className="w-full rounded-2xl pt-8 px-8 relative"
            style={{
              background: 'linear-gradient(to bottom, #C95E5A 0%, rgba(201, 94, 90, 0) 50%, #C95E5A 100%)',
              aspectRatio: '1309 / 404',
            }}
          >
            <div className="flex flex-wrap justify-start gap-4 mb-8">
              {topCategoryImages.map((imageUrl, index) => (
                <Link
                  href={"/shop"}
                  key={index}
                  className="block w-24 h-24 relative rounded-lg overflow-hidden shadow-md"
                >
                  <Image
                    src={imageUrl}
                    alt={`Category ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>
              ))}
            </div>
            <div className="absolute bottom-[-40px] left-0 right-0 px-8">
              <div className="flex flex-wrap justify-start gap-6">
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
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* 🔹 MOBILE-ONLY VIEW (New, separate logic)                 */}
        {/* ========================================================== */}
        <div className="md:hidden">
          <div
            className="w-full rounded-2xl pt-6 px-4 pb-8 relative"
            style={{
              background: 'linear-gradient(to bottom, #C95E5A 0%, rgba(201, 94, 90, 0) 50%, #C95E5A 100%)',
            }}
          >
            {/* Mobile Top Banners (Scrollable) */}
            <div className="flex justify-start gap-3 mb-6 overflow-x-auto scrollbar-hide">
              {topCategoryImages.map((imageUrl, index) => (
                <Link
                  href={"/shop"}
                  key={index}
                  className="block w-16 h-16 relative rounded-lg overflow-hidden shadow-md flex-shrink-0"
                >
                  <Image
                    src={imageUrl}
                    alt={`Category ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </Link>
              ))}
            </div>

            {/* Mobile Bottom Cards (Carousel) */}
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
              <CarouselContent className="-ml-2">
                {banners.map((post, index) => (
                  <CarouselItem key={post.id || index} className="pl-2 basis-auto">
                    <div className="group bg-[#FFFBEB] rounded-2xl p-1.5 shadow-lg w-[140px] h-[210px]">
                      <Link href={post.url || "#"} className="block w-full h-full">
                        <div className="relative w-full h-full">
                          <Image
                            src={post.imageUrl}
                            alt={`Festive item ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="140px"
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

"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";

interface PageProps {
  banners: Banner[];
  className?: string;
}

export function CurateConcious({ banners, className }: PageProps) {
  if (!banners?.length) return null;

  const banner = banners[0];

  return (
    <section className={cn("w-full bg-[#F4F0EC] pb-2 md:pb-2", className)}>
      <div className="max-w-screen-2xl mx-auto">
        {/* TITLE */}
        <div className="text-center mb-4 pt-2 px-2">
          <h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair">
            Curate Your Conscious Cart
          </h2>
        </div>

        {/* IMAGE — FULLY VISIBLE */}
        <div className="w-full relative bg-[#F4F0EC]">
          <Link href={banner.url || "/shop"} className="block w-full">
            <Image
              src={banner.imageUrl}
              alt={banner.title || "Curated conscious products"}
              width={1440}
              height={900}
              className="w-full h-auto object-contain"
              priority
              quality={100}
              sizes="100vw"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

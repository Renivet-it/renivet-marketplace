"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
    banners: Banner[];
    className?: string;
}

export function CurateConcious({ banners, className }: PageProps) {
    if (!banners?.length) return null;

    const banner = banners[0];

    return (
        <section className={cn("w-full bg-[#FCFBF4] pb-2 md:pb-2", className)}>
            <div className="mx-auto max-w-screen-2xl">
                {/* TITLE */}
                <div className="mb-4 px-2 pt-2 text-center">
                    <h2 className="text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                        Curate Your Conscious Cart
                    </h2>
                </div>

                {/* IMAGE — FULLY VISIBLE */}
                <div className="relative w-full bg-[#FCFBF4]">
                    <Link href={banner.url || "/shop"} className="block w-full">
                        <Image
                            src={banner.imageUrl}
                            alt={banner.title || "Curated conscious products"}
                            width={1440}
                            height={900}
                            className="h-auto w-full object-contain"
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

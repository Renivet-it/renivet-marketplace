"use client";

import { AllBrandsDialog } from "@/components/globals/layouts/navbar/brand-navigation";
import type { StorefrontBrand } from "@/lib/brands/storefront-brand-order";
import Image from "next/image";
import { useState } from "react";

export const BOTANICAL_MOBILE_IMAGE =
    "/assets/botanical-banner/botanical-mobile.png";
export const BOTANICAL_DESKTOP_IMAGE =
    "/assets/botanical-banner/botanical-desktop.png";

export const BOTANICAL_DESKTOP_LAYOUT = {
    fullWidth: true,
    height: 324,
    columns: "1fr 1fr",
} as const;

export const BOTANICAL_BANNER_COPY = {
    heading: "Meet the brands changing the way we shop.",
    description:
        "Discover passionate Indian makers designing with sustainable fibers, zero-waste principles, and authentic local craftsmanship.",
} as const;

export function BotanicalBanner({ brands }: { brands: StorefrontBrand[] }) {
    const [directoryOpen, setDirectoryOpen] = useState(false);

    return (
        <section className="w-full bg-[#f8f5ef] px-4 py-3 sm:px-6 md:px-8 md:py-3">
            <div className="grid min-h-[160px] w-full grid-cols-[1.55fr_1fr] overflow-hidden rounded-[14px] border border-[#dfc6c2] bg-[#e9d7d3] md:h-[324px] md:min-h-0 md:grid-cols-2">
                <div className="flex min-w-0 flex-col items-start justify-center px-4 py-5 md:px-14 md:py-10 lg:px-16">
                    <h2 className="max-w-[230px] font-serif text-[18px] font-normal leading-[1.18] text-[#302e2b] md:max-w-[520px] md:text-[34px]">
                        {BOTANICAL_BANNER_COPY.heading}
                    </h2>
                    <p className="mt-3 hidden max-w-[520px] text-[10px] leading-[1.5] text-[#77716a] md:block md:text-[11px]">
                        {BOTANICAL_BANNER_COPY.description}
                    </p>
                    <button
                        type="button"
                        onClick={() => setDirectoryOpen(true)}
                        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#61333d] px-4 text-[8px] font-semibold text-white transition-colors hover:bg-[#4d2931] md:mt-6 md:h-10 md:min-w-[220px] md:px-6 md:text-[9px] md:uppercase md:tracking-[0.04em]"
                    >
                        Explore all brands
                        <span aria-hidden="true">&rarr;</span>
                    </button>
                </div>

                <div className="relative min-h-[160px] overflow-hidden md:h-full md:min-h-0">
                    <Image
                        src={BOTANICAL_MOBILE_IMAGE}
                        alt="A lush botanical garden filled with tropical green foliage"
                        fill
                        sizes="40vw"
                        className="object-cover md:hidden"
                    />
                    <Image
                        src={BOTANICAL_DESKTOP_IMAGE}
                        alt="Lush tropical leaves and organic plants"
                        fill
                        sizes="(min-width: 768px) 50vw, 40vw"
                        className="hidden object-cover md:block"
                    />
                </div>
            </div>

            <AllBrandsDialog
                brands={brands}
                open={directoryOpen}
                onOpenChange={setDirectoryOpen}
            />
        </section>
    );
}

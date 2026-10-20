"use client";

import { AllBrandsDialog } from "@/components/globals/layouts/navbar/brand-navigation";
import {
    sortStorefrontBrands,
    type StorefrontBrand,
} from "@/lib/brands/storefront-brand-order";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const FEATURED_BRAND_LIMIT = 5;

export function getFeaturedBrandPreview<T extends StorefrontBrand>(
    brands: T[]
) {
    return sortStorefrontBrands(brands).slice(0, FEATURED_BRAND_LIMIT);
}

function FeaturedBrandLogo({ brand }: { brand: StorefrontBrand }) {
    const [failed, setFailed] = useState(false);

    return (
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#dfd8ce] bg-white md:size-11">
            {brand.logoUrl && !failed ? (
                <Image
                    src={brand.logoUrl}
                    alt={`${brand.name} logo`}
                    fill
                    sizes="44px"
                    className="object-contain p-1.5"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className="font-serif text-sm text-[#3d443f]">
                    {brand.name.slice(0, 1).toUpperCase()}
                </span>
            )}
        </span>
    );
}

export function FeaturedBrands({ brands }: { brands: StorefrontBrand[] }) {
    const [directoryOpen, setDirectoryOpen] = useState(false);
    const featuredBrands = getFeaturedBrandPreview(brands);

    if (!brands.length) return null;

    return (
        <section className="w-full bg-[#f8f5ef] px-4 pb-5 pt-3 sm:px-6 md:bg-[#FAF7F2] md:px-8 md:py-5">
            <div className="mx-auto w-full">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="hidden text-[8px] font-medium uppercase tracking-[0.16em] text-[#827b70] md:block">
                            Our collective
                        </p>
                        <h2 className="font-serif text-[21px] font-normal leading-tight text-[#302e2b] md:mt-1 md:text-[30px] md:text-[#3E2127]">
                            Featured brands
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDirectoryOpen(true)}
                        className="mb-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#302e2b] transition-opacity hover:opacity-60 md:text-[10px] md:text-[#61333d] md:tracking-[0.14em]"
                    >
                        See all <span aria-hidden="true">&rarr;</span>
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-5 gap-2 md:gap-4">
                    {featuredBrands.map((brand) => (
                        <Link
                            key={brand.id}
                            href={`/brands/${brand.slug}/shop`}
                            className="group flex min-w-0 flex-col items-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244136] focus-visible:ring-offset-2 md:min-h-[74px] md:flex-row md:rounded-[14px] md:border-0 md:bg-[#f0e2df] md:px-4 md:py-3.5 md:text-left md:shadow-[0_10px_22px_rgba(62,33,39,0.07)] md:transition-all md:hover:-translate-y-0.5 md:hover:shadow-[0_14px_28px_rgba(62,33,39,0.12)]"
                        >
                            <FeaturedBrandLogo brand={brand} />
                            <span className="min-w-0">
                                <span className="block max-w-full truncate text-[8px] font-medium leading-tight text-[#252824] md:text-[11px] md:font-semibold">
                                    {brand.name}
                                </span>
                                <span className="mt-0.5 hidden truncate text-[8px] text-[#8a837a] md:block">
                                    Explore brand
                                </span>
                            </span>
                        </Link>
                    ))}
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

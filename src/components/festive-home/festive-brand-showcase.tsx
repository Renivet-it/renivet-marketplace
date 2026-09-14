"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-general";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export interface FestiveBrand {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

function BrandLogo({ brand }: { brand: FestiveBrand }) {
    const [failed, setFailed] = useState(false);

    if (!brand.logoUrl || failed) {
        return null;
    }

    return (
        <Image
            src={brand.logoUrl}
            alt={`${brand.name} logo`}
            width={180}
            height={72}
            sizes="(min-width: 768px) 180px, 130px"
            className="max-h-12 w-auto max-w-[85%] object-contain"
            onError={() => setFailed(true)}
        />
    );
}

function BrandCard({
    brand,
    modal = false,
}: {
    brand: FestiveBrand;
    modal?: boolean;
}) {
    return (
        <Link
            href={`/brands/${brand.slug}/shop`}
            className={`group flex flex-col items-center justify-center gap-2 border border-[#dfccb0] bg-[#fffaf0] px-3 py-3 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b2631] ${
                modal ? "min-h-28" : "min-h-20 md:min-h-24"
            }`}
        >
            <BrandLogo brand={brand} />
            <span
                data-festive-brand-name="true"
                className="text-center text-[9px] font-medium uppercase leading-tight tracking-[0.16em] text-[#5b4035]"
            >
                {brand.name}
            </span>
        </Link>
    );
}

export function FestiveBrandShowcase({ brands }: { brands: FestiveBrand[] }) {
    const featuredBrands = brands.slice(0, 6);

    if (!brands.length) return null;

    return (
        <section
            data-festive-section="brands"
            className="px-3 py-8 md:px-8 md:py-9"
        >
            <Dialog>
                <div className="mb-6 block border-b border-[#e2d2b9] pb-4 md:mb-7 md:flex md:items-end md:justify-between md:border-0 md:pb-0">
                    <div>
                        <h2 className="font-serif text-[26px] leading-none md:text-[34px]">
                            Brands worth discovering
                        </h2>
                        <p className="mt-3 text-[10px] text-[#806f60]">
                            Independent brands. Meaningful stories. A kinder
                            tomorrow.
                        </p>
                    </div>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            className="mt-4 inline-block text-[8px] font-semibold uppercase tracking-[0.16em] md:mt-0"
                        >
                            View all brands&nbsp; →
                        </button>
                    </DialogTrigger>
                </div>

                <div
                    data-festive-brand-grid="true"
                    className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6"
                >
                    {featuredBrands.map((brand) => (
                        <BrandCard brand={brand} key={brand.id} />
                    ))}
                </div>

                <DialogContent className="flex max-h-[92dvh] w-[calc(100%-24px)] max-w-5xl flex-col gap-0 overflow-hidden border border-[#dfccb0] bg-[#fbf4e7] p-0 sm:rounded-none md:w-[calc(100%-64px)]">
                    <DialogHeader className="border-b border-[#dfccb0] px-5 py-5 text-left md:px-8 md:py-7">
                        <DialogTitle className="font-serif text-3xl font-normal text-[#3e2b24] md:text-4xl">
                            All brands
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#806f60]">
                            Discover every active brand on Renivet, arranged
                            alphabetically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-y-auto px-4 py-5 md:px-8 md:py-7">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                            {brands.map((brand) => (
                                <BrandCard brand={brand} key={brand.id} modal />
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}

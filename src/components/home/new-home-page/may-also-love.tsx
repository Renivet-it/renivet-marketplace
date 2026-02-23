"use client";

import { convertPaiseToRupees } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

// ⭐ PRODUCT CARD — NO GAP VERSION
const ProductCard = ({ banner }: { banner: Banner }) => {
    const { product } = banner;
    const [isWishlisted, setIsWishlisted] = useState(false);

    if (!product) return null;

    const imageUrl =
        product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

    const price = convertPaiseToRupees(
        product.variants?.[0]?.price ?? product.price ?? 0
    );

    const compareAt =
        product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

    const displayCompare = compareAt ? convertPaiseToRupees(compareAt) : null;

    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const discountPct =
        compareAt && compareAt > rawPrice
            ? Math.round(((compareAt - rawPrice) / compareAt) * 100)
            : null;

    const productUrl = `/products/${product.slug}`;

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation when clicking the heart
        setIsWishlisted(!isWishlisted);
    };

    return (
        <Link
            href={productUrl}
            className="group block w-[180px] flex-shrink-0 text-center md:w-full md:flex-shrink"
        >
            {/* Vegan Tag */}
            <div className="mb-1 flex items-center justify-start px-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-green-700 md:text-[12px]">
                    100%vegan
                </span>
            </div>

            {/* IMAGE CONTAINER */}
            <div className="relative h-[240px] w-full overflow-hidden rounded-sm md:h-[350px]">
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 180px, 300px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* 🏷️ Discount badge */}
                {discountPct && discountPct > 0 && (
                    <span className="absolute left-0 top-2.5 rounded-r-full bg-gradient-to-r from-rose-600 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md md:px-3 md:py-1 md:text-xs">
                        {discountPct}% OFF
                    </span>
                )}

                {/* Wishlist Button Overlay */}
                <button
                    onClick={toggleWishlist}
                    className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                    <Heart
                        className={
                            isWishlisted
                                ? "h-4 w-4 fill-red-500 text-red-500"
                                : "h-4 w-4 text-gray-600"
                        }
                        strokeWidth={isWishlisted ? 0 : 1.5}
                    />
                </button>
            </div>

            {/* Title */}
            <h3 className="mt-3 line-clamp-2 h-[42px] text-[14px] font-medium text-gray-800 md:text-[16px]">
                {product.title}
            </h3>

            {/* Price */}
            <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-[16px] font-semibold text-gray-900 md:text-[18px]">
                    ₹{price}
                </span>

                {displayCompare && (
                    <span className="text-[12px] text-gray-400 line-through md:text-[13px]">
                        ₹{displayCompare}
                    </span>
                )}

                {discountPct && discountPct > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-600 md:text-[13px]">
                        {discountPct}% off
                    </span>
                )}
            </div>
        </Link>
    );
};

// ⭐ MAIN — 2 ROW CAROUSEL (MOBILE) + GRID (DESKTOP)
export function MayAlsoLoveThese({ banners }: { banners: Banner[] }) {
    if (!banners.length) return null;

    const items = banners.slice(0, 18);

    return (
        <section className="w-full bg-[#FCFBF4] py-8">
            <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                You&apos;ll Love These
            </h2>

            {/* 📱 MOBILE — SINGLE ROW HORIZONTAL SCROLL */}
            <div className="scrollbar-hide overflow-x-auto px-4 md:hidden">
                <div className="flex w-max gap-4">
                    {items.map((item) => (
                        <ProductCard key={item.id} banner={item} />
                    ))}
                </div>
            </div>

            {/* 🖥 DESKTOP — 6 COLUMN GRID */}
            <div className="mx-auto hidden max-w-screen-2xl px-6 md:block">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {items.map((item) => (
                        <ProductCard key={item.id} banner={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

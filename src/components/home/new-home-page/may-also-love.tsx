"use client";

import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";
import { convertPaiseToRupees } from "@/lib/utils";
import React, { useState } from "react";
import { Heart } from "lucide-react";

const PLACEHOLDER_IMAGE_URL =
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

// ⭐ PRODUCT CARD — NO GAP VERSION
const ProductCard = ({ banner }: { banner: Banner } ) => {
  const { product } = banner;
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) return null;

  const imageUrl = product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

  const price = convertPaiseToRupees(
    product.variants?.[0]?.price ?? product.price ?? 0
  );

  const compareAt =
    product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

  const displayCompare = compareAt ? convertPaiseToRupees(compareAt) : null;

  const productUrl = `/products/${product.slug}`;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the heart
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link
      href={productUrl}
      className="block w-[180px] md:w-full flex-shrink-0 md:flex-shrink text-center group"
    >
      {/* Vegan Tag */}
      <div className="flex justify-start items-center px-1 mb-1">
        <span className="text-[10px] md:text-[12px] text-green-700 font-medium uppercase tracking-wider">
          100%vegan
        </span>
      </div>

      {/* IMAGE CONTAINER */}
      <div className="relative w-full h-[240px] md:h-[350px] overflow-hidden rounded-sm">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Wishlist Button Overlay */}
        <button 
          onClick={toggleWishlist}
          className="absolute top-3 right-3 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart 
            className={isWishlisted ? "w-4 h-4 fill-red-500 text-red-500" : "w-4 h-4 text-gray-600"} 
            strokeWidth={isWishlisted ? 0 : 1.5} 
          />
        </button>
      </div>

      {/* Title */}
      <h3 className="mt-3 text-[14px] md:text-[16px] font-medium text-gray-800 line-clamp-2 h-[42px]">
        {product.title}
      </h3>

      {/* Price */}
      <div className="mt-1 flex justify-center items-center gap-2">
        <span className="text-[16px] md:text-[18px] font-semibold text-gray-900">
          ₹{price}
        </span>

        {displayCompare && (
          <span className="text-[12px] md:text-[13px] line-through text-gray-400">
            ₹{displayCompare}
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
    <section className="w-full py-8 bg-[#fbfaf4]">
      <h2 className="text-center text-2xl font-bold text-[#4A453F] mb-8">
        You&apos;ll Love These
      </h2>

      {/* 📱 MOBILE — SINGLE ROW HORIZONTAL SCROLL */}
      <div className="md:hidden overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-4 w-max">
          {items.map((item) => (
            <ProductCard key={item.id} banner={item} />
          ))}
        </div>
      </div>

      {/* 🖥 DESKTOP — 6 COLUMN GRID */}
      <div className="hidden md:block max-w-screen-2xl mx-auto px-6">
        <div
          className="
            grid
            gap-8
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-6
          "
        >
          {items.map((item) => (
            <ProductCard key={item.id} banner={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

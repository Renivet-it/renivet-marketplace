"use client";

import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";
import { convertPaiseToRupees } from "@/lib/utils";
import React from "react";

const PLACEHOLDER_IMAGE_URL =
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

// ⭐ PRODUCT CARD — NO GAP VERSION
const ProductCard = ({ banner }: { banner: Banner }) => {
  const { product } = banner;
  if (!product) return null;

  const imageUrl = product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

  const price = convertPaiseToRupees(
    product.variants?.[0]?.price ?? product.price ?? 0
  );

  const compareAt =
    product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

  const displayCompare = compareAt ? convertPaiseToRupees(compareAt) : null;

  const alerts = ["only 2 left!", "only 5 left!", "10% off"];
  const alert = alerts[Math.floor(Math.random() * alerts.length)];

  const productUrl = `/products/${product.slug}`;

  return (
    <Link
      href={productUrl}
      className="block  w-[266px] 
  md:w-full        
  flex-shrink-0 
  md:flex-shrink  
  text-center
"

    >
      {/* Vegan Tag */}
      <div className="flex justify-between items-center px-1 mb-1">
        <span className="text-[12px] text-green-700 font-medium">
          100%vegan
        </span>
      </div>

      {/* IMAGE FULL COVER */}
      <div className="relative w-full h-[350px] bg-white overflow-hidden rounded-md">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover"
        />
      </div>

      {/* Stock label */}
      {/* <p className="text-[12px] text-red-500 mt-2">{alert}</p> */}

      {/* Title */}
      <h3 className="mt-1 text-[16px] font-medium text-gray-800 line-clamp-2 h-[42px]">
        {product.title}
      </h3>

      {/* Price */}
      <div className="mt-1 flex justify-center items-center gap-2">
        <span className="text-[18px] font-semibold text-gray-900">
          ₹{price}
        </span>

        {displayCompare && (
          <span className="text-[13px] line-through text-gray-400">
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
    <section className="w-full py-16 bg-[#fbfaf4]">
      <h2 className="text-center text-4xl font-light text-[#4A453F] mb-12">
        You&apos;ll Love These
      </h2>

      {/* 📱 MOBILE — 2-ROW CAROUSEL, ZERO GAP */}
{/* 📱 MOBILE — SINGLE ROW HORIZONTAL SCROLL */}
<div className="md:hidden overflow-x-auto scrollbar-hide px-2">
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

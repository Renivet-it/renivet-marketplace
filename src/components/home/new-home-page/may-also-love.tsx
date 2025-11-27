"use client";

import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";
import { Icons } from "@/components/icons";
import { convertPaiseToRupees } from "@/lib/utils";
import React from "react";

const PLACEHOLDER_IMAGE_URL =
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

// ⭐ PRODUCT CARD — CLEAN VERSION
const ProductCard = ({ banner }: { banner: Banner }) => {
  const { product } = banner;
  if (!product) return null;

  const imageUrl =
    product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

  const price = convertPaiseToRupees(
    product.variants?.[0]?.price ?? product.price ?? 0
  );

  const compareAt =
    product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

  const displayCompare = compareAt
    ? convertPaiseToRupees(compareAt)
    : null;

  const alerts = ["only 2 left!", "only 5 left!", "10% off", null];
  const alert = alerts[Math.floor(Math.random() * alerts.length)];

  const productUrl = `/products/${product.slug}`;

  return (
    <Link
      href={productUrl}
      className="block w-[170px] sm:w-[220px] text-center"
    >
      {/* TOP vegan + heart */}
      <div className="flex justify-between items-center px-2 mb-2">
        <span className="text-[12px] text-green-700 font-medium">
          100%vegan
        </span>
      </div>

      {/* FULL IMAGE COVER */}
      <div className="relative w-full h-[200px] sm:h-[240px] bg-white overflow-hidden rounded-md">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover"   // <==== FILLED IMAGE
        />
      </div>

      {/* LOW STOCK */}
      {alert && (
        <p className="text-[12px] text-red-500 mt-2">{alert}</p>
      )}

      {/* Title */}
      <h3 className="mt-1 text-[14px] font-medium text-gray-800 line-clamp-2 h-[38px]">
        {product.title}
      </h3>

      {/* Price */}
      <div className="mt-1 flex justify-center items-center gap-2">
        <span className="text-[15px] font-semibold text-gray-900">
          ₹{price}
        </span>

        {displayCompare && (
          <span className="text-[12px] line-through text-gray-400">
            ₹{displayCompare}
          </span>
        )}
      </div>

    </Link>
  );
};

// ⭐ MAIN LAYOUT — MOBILE = 2 ROW SCROLL / DESKTOP GRID
export function MayAlsoLoveThese({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;

  const items = banners.slice(0, 18);

  return (
    <section className="w-full py-16 bg-[#FFF9F4]">
      <h2 className="text-center text-4xl font-light text-[#4A453F] mb-12">
        You'll Love These
      </h2>

      {/* 📱 MOBILE — 2 ROWS SCROLL */}
      <div className="md:hidden overflow-x-auto scrollbar-hide px-4">
        <div
          className="
            grid 
            grid-flow-col
            grid-rows-2
            auto-cols-max
            gap-x-6
            gap-y-10
            w-max
          "
        >
          {items.map((b) => (
            <ProductCard key={b.id} banner={b} />
          ))}
        </div>
      </div>

      {/* 🖥 DESKTOP — NORMAL GRID */}
      <div className="hidden md:block max-w-screen-2xl mx-auto px-6">
        <div
          className="
            grid 
            gap-10
            grid-cols-2
            sm:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-6
          "
        >
          {items.map((b) => (
            <ProductCard key={b.id} banner={b} />
          ))}
        </div>
      </div>
    </section>
  );
}

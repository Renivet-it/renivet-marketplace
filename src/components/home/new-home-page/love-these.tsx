"use client";

import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";
import { convertPaiseToRupees } from "@/lib/utils";

const PLACEHOLDER_IMAGE_URL =
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

const ProductCard = ({ banner }: { banner: Banner }) => {
  const { product } = banner;
  if (!product) return null;

  const price = convertPaiseToRupees(
    product.variants?.[0]?.price ?? product.price ?? 0
  );

  const imageUrl =
    product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

  const productUrl = `/products/${product.slug}`;

  return (
    <Link
      href={productUrl}
      className="block w-[160px] sm:w-[200px] cursor-pointer"
    >
      <div className="relative w-full h-[220px] bg-gray-50 rounded-md overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="pt-3">
        <h3 className="text-[14px] text-gray-800 line-clamp-2 h-10 font-normal">
          {product.title}
        </h3>

        <span className="text-[15px] font-semibold text-gray-900">
          ₹{price}
        </span>
      </div>
    </Link>
  );
};

// ============================================================
// ⭐ MOBILE = 2 ROWS + HORIZONTAL SCROLL
// ⭐ DESKTOP = NORMAL GRID (18 items)
// ============================================================
export function LoveThese({ banners }: { banners: Banner[] }) {
  if (!banners.length) return null;

  const shownProducts = banners.slice(0, 18);

  return (
    <section className="w-full py-16 bg-[#FFF9F4]">
      <h2 className="text-center text-4xl font-light text-[#4A453F] mb-14">
        You May Like
      </h2>

      {/* MOBILE VERSION — SCROLLABLE 2 ROWS */}
      <div className="md:hidden px-4 overflow-x-auto scrollbar-hide">
        <div
          className="
            grid 
            grid-flow-col 
            auto-cols-max 
            grid-rows-2 
            gap-x-6 
            gap-y-6
            w-max
          "
        >
          {shownProducts.map((item) => (
            <ProductCard key={item.id} banner={item} />
          ))}
        </div>
      </div>

      {/* DESKTOP VERSION — STANDARD 18 PRODUCT GRID */}
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
          {shownProducts.map((item) => (
            <ProductCard key={item.id} banner={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

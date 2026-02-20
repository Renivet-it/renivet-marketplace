"use client";

import { convertPaiseToRupees } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

// ============================================================
// ⭐ PRODUCT CARD (FIXED DISCOUNT & PRICE LOGIC)
// ============================================================
const ProductCard = ({ banner }: { banner: Banner }) => {
    const { product } = banner;
    if (!product) return null;

    // ----- PRICE -----
    const variant = product.variants?.[0];

    const rawPrice = Number(variant?.price ?? product.price ?? 0);
    const price = convertPaiseToRupees(rawPrice);

    const rawOriginal = Number(
        variant?.compareAtPrice ?? product.compareAtPrice ?? 0
    );

    const originalConverted =
        rawOriginal > 0 ? convertPaiseToRupees(rawOriginal) : null;

    // ----- DISCOUNT -----
    const discount =
        rawOriginal > rawPrice
            ? Math.round(((rawOriginal - rawPrice) / rawOriginal) * 100)
            : null;

    // ----- IMAGE -----
    const imageUrl =
        product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

    const productUrl = `/products/${product.slug}`;

    return (
        <Link href={productUrl} className="block w-[173px] cursor-pointer">
            {/* IMAGE */}
            <div className="relative h-[230px] w-full overflow-hidden bg-gray-50">
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    sizes="173px"
                    className="object-cover"
                />

                {/* ⭐ DISCOUNT BADGE */}
                {discount && (
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-[2px] text-[11px] font-medium text-white">
                        {discount}% OFF
                    </span>
                )}
            </div>

            {/* TEXT */}
            <div className="pt-2">
                <h3 className="line-clamp-2 h-10 text-[14px] font-normal text-gray-800">
                    {product.title}
                </h3>

                {/* PRICE ROW */}
                <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-gray-900">
                        ₹{price}
                    </span>

                    {originalConverted && (
                        <span className="text-[13px] text-gray-400 line-through">
                            ₹{originalConverted}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

// ============================================================
// ⭐ FULL COMPONENT
// ============================================================
export function MobileBottom({ banners }: { banners: Banner[] }) {
    if (!banners.length) return null;

    const shownProducts = banners.slice(0, 18);

    return (
        <section className="w-full bg-[#FCFBF4] py-8 md:hidden">
            <h2 className="mb-4 text-center text-2xl font-light text-[#4A453F]">
                Intentional finds
            </h2>

            {/* ⭐ MOBILE — HORIZONTAL SCROLL */}
            <div className="scrollbar-hide overflow-x-auto px-4 md:hidden">
                <div className="grid w-max auto-cols-max grid-flow-col grid-rows-2 gap-x-6 gap-y-6">
                    {shownProducts.map((item) => (
                        <ProductCard key={item.id} banner={item} />
                    ))}
                </div>
            </div>

            {/* ⭐ DESKTOP GRID
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
      </div> */}
        </section>
    );
}

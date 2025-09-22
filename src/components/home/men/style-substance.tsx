"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button-general";

interface Variant {
  id: string;
  price: number;
  compareAtPrice: number;
  costPerItem: number;
}

interface Product {
  id: number;
  media: { mediaItem: { url: string } }[];
  brand: { name: string };
  title: string;
  variants?: Variant[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  slug: string;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
}

export function StyleWithSubstance({ className, products, ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products) || products.length === 0) return null;

  const getPricing = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0];
      const discountedPrice = variant.price || variant.costPerItem;
      const originalPrice = variant.compareAtPrice || variant.costPerItem;
      const discount = originalPrice - discountedPrice;
      return {
        discountedPrice: convertPaiseToRupees(discountedPrice),
        originalPrice: convertPaiseToRupees(originalPrice),
        discount: convertPaiseToRupees(discount),
      };
    }
    return {
      discountedPrice: convertPaiseToRupees(product.discountedPrice),
      originalPrice: convertPaiseToRupees(product.originalPrice),
      discount: convertPaiseToRupees(product.discount),
    };
  };

  const visibleProducts = products.slice(0, 3);

  return (
    <section
      className={cn("p-2 sm:p-8 bg-[FCFBFA] md:bg-[#ded6d6]", className)}
      {...props}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-normal sm:font-bold text-black font-serif">
          Style With Substance
        </h2>
        <Link href="/products">
          <Button className="bg-white text-black sm:bg-gray-800 sm:text-white px-4 py-2 rounded-md hover:bg-gray-100 sm:hover:bg-gray-700 text-sm">
            Show all
          </Button>
        </Link>
      </div>

      {/* ---------- Desktop View ---------- */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-2">
        {visibleProducts.map((item) => {
          const { discountedPrice } = getPricing(item.product);
          return (
            <Link
              key={item.product.id}
              href={`/products/${item.product.slug}`}
              className="min-w-[455px] h-[145px] bg-white rounded-lg shadow-sm overflow-hidden flex flex-row flex-shrink-0"
            >
              <div className="w-[145px] h-full relative flex-shrink-0">
                <Image
                  src={item.product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw"
                />
              </div>
              <div className="flex-1 p-4 flex flex-col justify-center" style={{ backgroundColor: "#ede6df" }}>
                <h3 className="text-lg font-medium text-gray-800 mb-2">{item.product.title}</h3>
                <p className="text-xl font-bold text-black">₹{discountedPrice}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ---------- Mobile View ---------- */}
      <div className="flex md:hidden gap-3 overflow-x-auto pb-2 px-2 scrollbar-hide">
        {visibleProducts.map((item) => {
          const { discountedPrice } = getPricing(item.product);
          return (
            <Link
              key={item.product.id}
              href={`/products/${item.product.slug}`}
              className="min-w-[180px] h-[65px] bg-white rounded-lg shadow-sm flex flex-row flex-shrink-0"
            >
              <div className="w-[100px] h-full relative flex-shrink-0">
                <Image
                  src={item.product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-center" style={{ backgroundColor: "#ede6df" }}>
                <h3 className="text-xs font-normal text-gray-500 mb-1">{item.product.title}</h3>
                <p className="text-sm font-bold text-black">₹{discountedPrice}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

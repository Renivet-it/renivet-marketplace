"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  brand: { name: string };
  title: string;
  variants?: {
    price: number;
    compareAtPrice?: number;
  }[];
  price?: number;
  compareAtPrice?: number;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGrid({
  className,
  products,
  title = "Kids",
  ...props
}: ProductGridProps) {
  if (!products || !Array.isArray(products)) return null;

  return (
    <div className={cn("bg-[#F4F0EC] py-2 sm:py-8", className)} {...props}>
     {/* ----------------- MOBILE VIEW : Horizontal scroll with 3 items fitting the screen ----------------- */}
<div className="md:hidden w-full px-3">
  <h1 className="text-lg font-normal text-gray-800 mb-4">{title}</h1>

  <div className="flex overflow-x-auto gap-3 scrollbar-hide">
    {products.map(({ product }) => {
      const price = convertPaiseToRupees(
        product.variants?.[0]?.price || product.price || 0
      );
      const originalPrice =
        product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
      const convertedOriginalPrice = originalPrice
        ? convertPaiseToRupees(originalPrice)
        : null;

      return (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col w-1/3 flex-shrink-0"
        >
          {/* Product Image */}
          <div className="relative w-full h-36">
            <Link href={`/products/${product.slug}`}>
              <Image
                src={
                  product.media[0]?.mediaItem?.url ||
                  "/placeholder-product.jpg"
                }
                alt={product.title}
                fill
                className="object-cover rounded-t-lg"
              />
            </Link>
          </div>

          {/* Product Info */}
          <div className="p-2">
            <h3 className="text-xs font-medium text-gray-800 truncate">
              {product.title}
            </h3>
            <span className="text-[10px] text-gray-500 block">
              {product.brand.name}
            </span>
            <div className="mt-1">
              <span className="text-sm font-semibold text-gray-800">
                ₹{price}
              </span>
              {convertedOriginalPrice && (
                <span className="text-xs text-gray-500 line-through ml-1">
                  ₹{convertedOriginalPrice}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>


      {/* ----------------- DESKTOP VIEW (Centered Grid) ----------------- */}
      <div className="hidden md:block max-w-screen-2xl mx-auto px-14">
        {/* Header */}
        <div className="mb-8">
          <div className="border-b-2 border-blue-500 inline-block">
            <h1 className="text-xl font-semibold text-gray-800 pb-2">
              {title}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.slice(0, 5).map(({ product }) => {
            const price = convertPaiseToRupees(
              product.variants?.[0]?.price || product.price || 0
            );

            return (
              <div key={product.id} className="w-full">
                <div className="bg-[#dcddd7] rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
                  {/* Product Image */}
                  <div className="w-full h-64 bg-[#dcddd7] p-4">
                    <div className="border border-gray-200 w-full h-full relative rounded-md overflow-hidden">
                      <Link
                        href={`/products/${product.slug}`}
                        className="block w-full h-full"
                      >
                        <Image
                          src={
                            product.media[0]?.mediaItem?.url ||
                            "/placeholder-product.jpg"
                          }
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </Link>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                      {product.title}
                    </h3>
                    <span className="text-xs text-gray-500 mb-2">
                      {product.brand.name}
                    </span>
                    <div className="mt-auto">
                      <span className="text-lg font-semibold text-gray-800">
                        ₹{price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

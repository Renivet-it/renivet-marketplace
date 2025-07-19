"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button-general";

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

export function ProductGrid({ className, products, title = "Little Renivet", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products)) return null;

  return (
    <section className={cn("w-full px-4 py-6 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 underline">
            Show all
          </Link>
        </div>

        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex space-x-4 w-max">
            {products.slice(0, 3).map(({ product }) => {
              const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);
              const originalPrice = product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
              const convertedOriginalPrice = originalPrice ? convertPaiseToRupees(originalPrice) : null;

              return (
                <div key={product.id} className="w-[160px] flex-shrink-0">
                  <div className="border border-gray-200 rounded-lg bg-white h-full flex flex-col hover:bg-[#d9d9d2] transition-colors">
                    <div className="relative aspect-square">
                      <Link href={`/products/${product.slug}`} className="block h-full">
                        <Image
                          src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                          alt={product.title}
                          fill
                          className="object-cover rounded-t-lg"
                          sizes="160px"
                        />
                      </Link>
                    </div>

                    <div className="p-3 flex-grow flex flex-col">
                      <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
                      <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold">₹{price}</span>
                        {convertedOriginalPrice && (
                          <span className="text-xs text-gray-500 line-through">₹{convertedOriginalPrice}</span>
                        )}
                      </div>
                      <Button className="w-full bg-black text-white rounded-md py-2 text-xs font-medium">
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map(({ product }) => {
            const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);
            const originalPrice = product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
            const convertedOriginalPrice = originalPrice ? convertPaiseToRupees(originalPrice) : null;

            return (
              <div key={product.id} className="w-full">
                <div className="border border-gray-200 rounded-lg bg-white h-full flex flex-col hover:bg-[#d9d9d2] transition-colors">
                  <div className="relative aspect-square">
                    <Link href={`/products/${product.slug}`} className="block h-full">
                      <Image
                        src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                        alt={product.title}
                        fill
                        className="object-cover rounded-t-lg"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    </Link>
                  </div>

                  <div className="p-4 flex-grow flex flex-col">
                    <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-bold">₹{price}</span>
                      {convertedOriginalPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{convertedOriginalPrice}</span>
                      )}
                    </div>
                    <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-md py-2 text-sm font-medium">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
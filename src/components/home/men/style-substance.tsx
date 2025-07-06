"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button-general";
import { convertPaiseToRupees } from "@/lib/utils";

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
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const getPricing = (product: Product) => {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variant = product.variants[0];
      const discountedPrice = variant.price || variant.costPerItem;
      const originalPrice = variant.compareAtPrice || variant.costPerItem;
      const discount = originalPrice - discountedPrice;
      return { 
        discountedPrice: convertPaiseToRupees(discountedPrice),
        originalPrice: convertPaiseToRupees(originalPrice),
        discount: convertPaiseToRupees(discount)
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
    <section className={cn("p-8 pt-10", className)}
      style={{ backgroundColor: "#ded6d6" }}
      {...props}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black">Style, With Substance</h2>
        <Link href="/products">
          <Button className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-gray-700 text-sm">
            Show all
          </Button>
        </Link>
      </div>

      <div className="flex flex-row gap-4 overflow-x-auto pb-2">
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
    </section>
  );
}
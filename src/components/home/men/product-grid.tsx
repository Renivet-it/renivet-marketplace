"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

export function ProductGrid({ className, products, ...props }: ProductGridProps) {
  if (!products?.length) return null;

  const getPricing = (product: Product) => {
    if (product.variants?.length) {
      const v = product.variants[0];
      const discounted = v.price || v.costPerItem;
      const original = v.compareAtPrice || v.costPerItem;
      const discountValue = original - discounted;
      const discountPercent = Math.round((discountValue / original) * 100);
      return {
        discountedPrice: convertPaiseToRupees(discounted),
        originalPrice: convertPaiseToRupees(original),
        discountPercent,
      };
    }
    const discountValue = product.originalPrice - product.discountedPrice;
    const discountPercent = Math.round(
      (discountValue / product.originalPrice) * 100
    );
    return {
      discountedPrice: convertPaiseToRupees(product.discountedPrice),
      originalPrice: convertPaiseToRupees(product.originalPrice),
      discountPercent,
    };
  };

  const visibleProducts = products.slice(0, 10);
  const hasMoreProducts = products.length > 10;

  // Reusable card renderer
  const renderCard = (product: Product) => {
    const { discountedPrice, originalPrice, discountPercent } = getPricing(product);
    return (
      <Link key={product.id} href={`/products/${product.slug}`} className="block">
        <Card className="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 hover:shadow-md transition">
          <CardHeader className="p-0 relative">
            <div className="relative w-full h-40">
              <Image
                src={product.media[0]?.mediaItem?.url || "/placeholder.jpg"}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 25vw"
              />
            </div>
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-100 text-green-800 text-[10px]">🌿</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="text-[11px] font-medium text-gray-700 uppercase mb-1">
              {product.brand.name}
            </div>
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
              {product.title}
            </h3>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              <span className="text-red-600 font-semibold text-base leading-none">
                ₹{discountedPrice}
              </span>
              <span className="text-gray-500 text-xs line-through leading-none">
                ₹{originalPrice}
              </span>
              <span className="text-orange-600 text-[11px] font-medium leading-none">
                {discountPercent}% OFF
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <section
    className={cn("sm:py-4 py-2 sm:py-10bg-[#fcfbfa] md:bg-[#f4f0ec]", className)}
    {...props}
  >
    <h2 className="text-lg sm:text-2xl font-semibold text-center mb-1 sm:mb-4 
    font-serif sm:font-sans
    text-gray-900">
      Featured Products
    </h2>

      {/* ---------- MOBILE VIEW: 2-COLUMN GRID ---------- */}
      <div className="sm:hidden px-4">
        <div className="grid grid-cols-2 gap-3">
          {visibleProducts.map(({ product }) => renderCard(product))}
        </div>
      </div>

      {/* ---------- DESKTOP VIEW: 4-COLUMN GRID ---------- */}
      <div className="hidden sm:block px-6">
        <div className="grid grid-cols-4 gap-6 max-w-6xl mx-auto">
          {visibleProducts.map(({ product }) => renderCard(product))}
        </div>
      </div>

      {hasMoreProducts && (
        <div className="text-center mt-4">
          <Link href="/products">
            <Button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
              Explore More Products
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}

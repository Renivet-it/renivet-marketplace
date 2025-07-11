// components/home/women/ProductGrid.jsx
"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general"; // Assuming Shadcn UI Button component

interface Variant {
  id: string;
  price: number;
  compareAtPrice: number;
  costPerItem: number;
}

interface Product {
  id: number;
  media: string;
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
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const getPricing = (product: Product) => {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variant = product.variants[0];
      const discountedPrice = variant.price || variant.costPerItem;
      const originalPrice = variant.compareAtPrice || variant.costPerItem;
      const discount = originalPrice - discountedPrice;
      return { discountedPrice, originalPrice, discount };
    }
    return {
//@ts-ignore
      discountedPrice: product.compareAtPrice,
//@ts-ignore
      originalPrice: product.price,
//@ts-ignore
      discount:  product.price - product.compareAtPrice,
    };
  };

  const visibleProducts = products.slice(0, 10); // Limit to 10 products
  const hasMoreProducts = products.length > 10; // Check if there are more than 10 products

  return (
    <section className={cn("pt-4 pb-10 bg-gray-50", className)} {...props}>
      <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">Featured Products</h2>
      <div className="grid grid-cols-2 gap-3 px-2">
        {visibleProducts.map((item) => {
          const { discountedPrice, originalPrice, discount } = getPricing(item.product);
          return (
            <Card
              key={item.product.id}
              className="overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200 max-w-[180px]"
            >
              <CardHeader className="p-0 relative">
                <Link href={`/products/${item.product.slug}`} className="block">
                  <div className="relative w-full h-40 overflow-hidden">
                    <Image
                    // @ts-ignore
                      src={item.product.media[0]?.mediaItem?.url}
                      fill alt={""}/>
                  </div>
                </Link>
                <div className="absolute top-1 left-1">
                  <Badge className="bg-green-100 text-green-800 text-[10px]">
                    🌿 {/* Placeholder for brand logo/icon */}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 bg-gray-50">
                <div className="text-[11px] font-medium text-gray-700 uppercase mb-1">
                  {item.product.brand.name}
                </div>
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {item.product.title}
                </h3>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="text-red-600 font-semibold text-base leading-none">
                    ₹{discountedPrice}
                  </span>
                  <span className="text-gray-500 text-xs line-through leading-none">
                    ₹{originalPrice}
                  </span>
                  <span className="text-orange-600 text-[11px] font-medium leading-none">
                    {discount} OFF
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {hasMoreProducts && (
        <div className="text-center mt-4">
          <Link href="/products">
            <Button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Explore More Products
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
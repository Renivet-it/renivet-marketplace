"use client";

import { cn } from "@/lib/utils";
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
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const getPricing = (product: Product) => {
    //@ts-ignore
    if (product.variants?.length > 0) {
    //@ts-ignore
      const variant = product.variants[0];
      return {
        discountedPrice: variant.price || variant.costPerItem,
        originalPrice: variant.compareAtPrice || variant.costPerItem,
        discount: (variant.compareAtPrice || variant.costPerItem) - (variant.price || variant.costPerItem)
      };
    }
    return {
      discountedPrice: product.discountedPrice,
      originalPrice: product.originalPrice,
      discount: product.discount
    };
  };

  const visibleProducts = products.slice(0, 10);
  const hasMoreProducts = products.length > 10;

  return (
    <section
      className={cn("pt-4 pb-10", className)}
      style={{ backgroundColor: "#f4f0ec" }}
      {...props}
    >
      <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">Featured Products</h2>
      <div className="grid grid-cols-2 gap-3 px-1">
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
                      src={item.product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw"
                    />
                  </div>
                </Link>
                <div className="absolute top-1 left-1">
                  <Badge className="bg-green-100 text-green-800 text-[10px]">
                    🌿
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 bg-white">
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
                    {Math.round((discount/originalPrice)*100)}% OFF
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
            <Button className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
              Explore More Products
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
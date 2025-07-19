"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Star } from "lucide-react";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  variants?: {
    price: number;
  }[];
  price?: number;
  rating?: number;
  reviewCount?: number;
  stockStatus?: string;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGridNewArrivals({ className, products, title = "New Arrival", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const productRows = [];
  for (let i = 0; i < products.length; i += 3) {
    productRows.push(products.slice(i, i + 3));
  }

  return (
    <section className={cn("w-full px-4 py-12 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-[1360px] mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-500">iam ornare. Tellus m eget vestibulum e.</p>
        </div>

        <div className="md:hidden">
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 5000 })]}
            className="w-full"
          >
            <CarouselContent>
              {products.map(({ product }) => (
                <CarouselItem key={product.id}>
                  <MobileProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="hidden md:block">
          {productRows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {row.map(({ product }) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);
  const rating = product.rating || 4.1;
  const reviewCount = product.reviewCount || 4100;
  const stockStatus = product.stockStatus || "Almost Sold Out";

  return (
    <div className="w-full group">
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-0 bg-white rounded-lg overflow-hidden">
        <CardHeader className="p-0 relative">
          <div className="relative w-full h-[320px] bg-[#F4F0EC] flex items-center justify-center">
            <Link href={`/products/${product.slug}`} className="block w-full h-full">
              <Image
                src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                alt={product.title}
                width={385}
                height={320}
                className="object-contain w-full h-full p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                priority
              />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.title}</h3>
          <div className="flex items-center mb-1">
          </div>
          <div className="flex justify-between items-end mt-2">
            <div className="text-lg font-semibold text-gray-900">
              ₹{typeof price === "number" ? price.toFixed(2) : price}
            </div>
            <div className="text-sm text-red-500">{stockStatus}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MobileProductCard({ product }: { product: Product }) {
  const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);
  const rating = product.rating || 4.1;
  const reviewCount = product.reviewCount || 4100;
  const stockStatus = product.stockStatus || "Almost Sold Out";

  return (
    <div className="w-full px-2">
      <Card className="border-0 shadow-none p-0 bg-transparent">
        <CardHeader className="p-0 relative group">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F4F0EC] flex items-center justify-center">
            <Link href={`/products/${product.slug}`} className="block w-full h-full">
              <Image
                src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                alt={product.title}
                width={320}
                height={320}
                className="object-contain w-full h-full p-2"
                priority
              />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-2">
          <h3 className="text-base font-semibold text-gray-900 mb-1">{product.title}</h3>
          <div className="flex items-center mb-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
            <span className="text-xs text-gray-500 ml-1">({(reviewCount / 1000).toFixed(1)}k) Reviews</span>
          </div>
          <div className="flex justify-between items-end">
            <div className="text-base font-semibold text-gray-900">
              ₹{typeof price === "number" ? price.toFixed(2) : price}
            </div>
            <div className="text-xs text-red-500">{stockStatus}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
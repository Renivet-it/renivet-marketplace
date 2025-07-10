"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button-general";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  variants?: {
    price: number;
  }[];
  price?: number;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGridNewArrivals({ className, products, title = "New Arrival", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  const getProductPrice = (product: Product) => {
    const priceInPaise = product.variants?.[0]?.price || product.price || 0;
    return convertPaiseToRupees(priceInPaise);
  };

  return (
    <section className={cn("w-full px-4 py-12 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-[1360px] mx-auto">
        {/* Centered Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-500">iam ornare. Tellus m eget vestibulum e.</p>
        </div>

        {products.length <= 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            {products.slice(0, 2).map(({ product }) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="relative px-4">
            <Carousel
              opts={{
                align: "start",
                loop: true,
                slidesToScroll: 2
              }}
              plugins={[
                Autoplay({
                  delay: 5000,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {products.map(({ product }) => (
                  <CarouselItem key={product.id} className="pl-4 basis-[640px]">
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);

  return (
    <div className="w-full">
      <Card className="border-0 shadow-none p-0 h-[780px] bg-transparent">
        <CardHeader className="p-0 relative h-[640px]">
          <Link href={`/products/${product.slug}`} className="block h-full">
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
                alt={product.title}
                fill
                className="object-cover"
                sizes="640px"
              />
            </div>
          </Link>
        </CardHeader>

        <CardContent className="p-0 pt-6 h-[140px]">
          <h3 className="text-xl font-medium text-gray-900 mb-4">
            {product.title}
          </h3>
          <div className="text-xl font-medium text-gray-900">
            {/* @ts-ignore */}
            ₹{typeof price === "number" ? price.toFixed(2) : price}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
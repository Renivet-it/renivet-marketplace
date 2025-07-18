"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button-general";
import { useRouter } from "next/navigation";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface Product {
  slug: string;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  subtitle?: string;
  description?: string;
  variants?: {
    price: number;
  }[];
  price?: number;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGridNewArrivals({
  className,
  products,
  title = "NEW ARRIVALS",
  ...props
}: ProductGridProps) {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  return (
    <section className={cn("w-full px-4 py-8 bg-[#F4F0EC]", className)} {...props}>
      <div className="max-w-[1360px] mx-auto">
        {/* Header with View All link */}
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-2xl font-bold uppercase tracking-wider">{title}</h1>
          <Link href="#" className="text-sm font-medium underline hover:text-gray-600">
            See All
          </Link>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {products.map(({ product }) => (
                <CarouselItem key={product.id} className="basis-[80%] pl-4">
                  <MobileProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop Carousel */}
        <div className="hidden md:block">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {products.map(({ product }) => (
                <CarouselItem key={product.id} className="basis-[25%] pl-4">
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);

  const handleAddToBag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.slug}`);
  };

  return (
    <Link href={`/products/${product.slug}`} passHref>
      <Card className="border-0 shadow-none p-0 bg-transparent hover:cursor-pointer h-full flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square mb-4 overflow-hidden">
          <Image
            src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Product Info */}
        <CardContent className="flex flex-col flex-1 justify-between items-center p-0">
          <div className="w-full flex flex-col items-center">
            {/* Product Name */}
            <h3 className="text-base font-semibold text-gray-900 text-center mb-2">
              {product.title}
            </h3>
            {/* Price */}
            <div className="text-lg font-bold text-gray-900 text-center mb-6">
              {/* @ts-ignore */}
              {typeof price === "number" ? price.toFixed(2) : price}
            </div>
          </div>
          {/* Full-width View Button */}
          <Button
            variant="outline"
            className="w-full text-base py-2 px-3 h-12 border border-black hover:bg-[#F4F0EC] hover:text-black"
            onClick={handleAddToBag}
          >
            View
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

function MobileProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price || 0);

  const handleAddToBag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.slug}`);
  };

  return (
    <Link href={`/products/${product.slug}`} passHref>
      <Card className="border-0 shadow-none p-0 bg-transparent hover:cursor-pointer">
        {/* Product Image */}
        <div className="relative aspect-square mb-3 overflow-hidden">
          <Image
            src={product.media[0]?.mediaItem?.url || "/placeholder-product.jpg"}
            alt={product.title}
            fill
            className="object-cover"
            sizes="80vw"
          />
        </div>

        {/* Product Info */}
        <CardContent className="p-0">
          {/* Brand Name */}
          <div className="text-xs font-bold uppercase tracking-wider mb-1">
            {product.title.split(" ")[0]}
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {product.subtitle || product.title}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price and Add to Bag - INLINE */}
          <div className="flex justify-between items-center">
            <div className="text-base font-bold text-gray-900">
              {/* @ts-ignore */}
              ${typeof price === "number" ? price.toFixed(2) : price}
            </div>
            <Button
              variant="outline"
              className="text-xs py-1 px-3 h-8 border border-black hover:bg-black hover:text-white"
              onClick={handleAddToBag}
            >
              Add To Bag
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  variants?: { price: number }[];
  price?: number;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
}

export function ProductGrid({ className, products, title = "Gentle on Skin. Kinder to Earth", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products)) return null;

  return (
    <div className={cn("bg-[#fcfbf4] py-8", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* Header */}
             <h2
  className="
    text-center
    text-[18px]         /* mobile smaller */
    md:text-[32px]      /* desktop bigger */
    font-light
    text-[#3B3B3B]
    mb-8
    tracking-wide
    whitespace-nowrap   /* forces one line */
  "
>
          {title}
        </h2>
        {/* 🚀 UNIVERSAL CAROUSEL (Mobile + Desktop) */}
        <div className="overflow-x-auto scrollbar-hide pb-3">
          <div className="flex gap-4 w-max">
            {products.map(({ product }) => {
              const price = convertPaiseToRupees(
                product.variants?.[0]?.price || product.price || 0
              );

              const imageUrl =
                product.media[0]?.mediaItem?.url ||
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

              return (
               <div
  key={product.id}
  className="
    w-[90px]            /* show 4 cards per view on mobile */
    sm:w-[120px]        /* tablet */
    md:w-[150px]        /* desktop - normal */
    flex-shrink-0
  "
>
  <Link href={`/products/${product.slug}`}>
    {/* IMAGE */}
    <div className="relative w-full h-[120px] sm:h-[160px] md:h-[200px] bg-white overflow-hidden">
      <Image
        src={imageUrl}
        alt={product.title}
        fill
        className="object-cover"
      />
    </div>

    {/* TITLE */}
    <h3 className="text-[11px] sm:text-xs md:text-sm mt-2 font-medium text-gray-800 line-clamp-2">
      {product.title}
    </h3>

    {/* PRICE */}
    <p className="text-xs md:text-sm font-semibold text-gray-900">
      ₹{price}
    </p>
  </Link>
</div>

              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

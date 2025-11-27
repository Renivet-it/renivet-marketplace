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

export function ProductGrid({ className, products, title = "Kids", ...props }: ProductGridProps) {
  if (!products || !Array.isArray(products)) return null;

  return (
    <div className={cn("bg-[#F4F0EC] py-8", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 border-b-2 border-blue-500 inline-block pb-2">
            {title}
          </h1>
        </div>

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
                <div key={product.id} className="w-[150px] flex-shrink-0">
                  <Link href={`/products/${product.slug}`}>
                    {/* IMAGE */}
                    <div className="relative w-full h-[200px] bg-white rounded-md overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* TITLE */}
                    <h3 className="text-sm mt-2 font-medium text-gray-800 line-clamp-2">
                      {product.title}
                    </h3>

                    {/* PRICE */}
                    <p className="text-sm font-semibold text-gray-900">
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

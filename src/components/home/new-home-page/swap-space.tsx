"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";

// --- Reusable Product Card Component ---
const ProductCard = ({ banner }: { banner: Banner }) => {
  const { product } = banner;
  const price = convertPaiseToRupees(product.variants?.[0]?.price || product.price);
  const originalPrice = product.variants?.[0]?.compareAtPrice || product.compareAtPrice;
  const displayPrice = originalPrice ? convertPaiseToRupees(originalPrice) : null;
  const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

  return (
    <div className="w-[207px] h-[312px] flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
        {/* Image Container */}
        <div className="w-full h-[180px] bg-white p-2">
          <Link href={productUrl} className="block w-full h-full relative">
            <Image
              src={product.media?.[0]?.mediaItem?.url || "/placeholder-product.jpg"}
              alt={product.title || "Product"}
              fill
              className="object-cover rounded-md"
            />
          </Link>
        </div>

        {/* Details Container */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-sm font-medium text-gray-800 mb-1 truncate">
            {product.title || "Untitled Product"}
          </h3>
          {product.brand && (
            <span className="text-xs text-gray-500 mb-1">{product.brand.name}</span>
          )}
          
          {/* ADDED: Product Description (truncated) */}
          {product.description && (
            <p className="text-xs text-gray-600 mb-2 truncate">
              {product.description}
            </p>
          )}

          <div className="mt-auto">
            <span className="text-lg font-semibold text-gray-800">₹{price}</span>
            {displayPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ₹{displayPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main SwapSpace Component ---
interface PageProps extends React.HTMLAttributes<HTMLElement> {
  banners: Banner[];
  className?: string;
}

export function SwapSpace({ className, banners, ...props }: PageProps) {
  if (!banners || banners.length === 0) return null;

  const backgroundImageUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN3wy7IOl64McafQHoWsZUzihAkJ3DF5EGgPpY";

  return (
    <section
      className={cn("w-full py-10 md:py-16 bg-center bg-cover bg-no-repeat px-4", className )}
      style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      {...props}
    >
      <div className="max-w-screen-2xl px-4 md:px-14">
        <div className="mb-8"></div>

        {/* Mobile horizontal scroll */}
        <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex space-x-4 w-max">
            {banners.map((item) => (
              <ProductCard key={item.id} banner={item} />
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {banners.slice(0, 6).map((item) => (
            <ProductCard key={item.id} banner={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

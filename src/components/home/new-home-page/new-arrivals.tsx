"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

/* --------------------------------------------------------
   TYPES
-------------------------------------------------------- */

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  brand?: { name: string };
  variants?: {
    id: string;
    price: number;
  }[];
  price?: number;
}

interface ProductWrapper {
  id: string;
  category: string;
  product: Product;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: ProductWrapper[];
  title?: string;
  userId?: string;
}

/* --------------------------------------------------------
   CATEGORY CONSTANT
-------------------------------------------------------- */

const CATEGORIES = [
  "Most Ordered",
  "In Season",
  "Fresh Deals",
  "Limited Offer",
  "Best Value",
];

/* --------------------------------------------------------
   MAIN GRID
-------------------------------------------------------- */

export function ProductGridNewArrivals({
  className,
  products,
  userId,
  ...props
}: ProductGridProps) {
  const [activeTab, setActiveTab] = useState("Most Ordered");

  if (!products?.length) return null;

  const filteredProducts = products.filter(
    (item) => item.category === activeTab
  );

  return (
    <section className={cn("w-full py-8 bg-[#fcfbf4]", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex justify-center border-b border-gray-200 mb-8">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={cn(
                  "py-3 px-1 text-sm sm:text-base font-medium whitespace-nowrap transition-colors duration-200",
                  activeTab === category
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:gap-6">
          {filteredProducts.map(({ product }) => (
            <ProductCard
              key={product.id}
              product={product}
              userId={userId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------
   PRODUCT CARD (PLUS = WISHLIST)
-------------------------------------------------------- */

function ProductCard({
  product,
  userId,
}: {
  product: Product;
  userId?: string;
}) {
  const { addToGuestWishlist } = useGuestWishlist();

  const { mutateAsync: addToWishlist, isLoading } =
    trpc.general.users.wishlist.addProductInWishlist.useMutation({
      onSuccess: () => toast.success("Added to Wishlist!"),
      onError: (err) =>
        toast.error(err.message || "Could not add to wishlist."),
    });

  const rawPrice = product.variants?.[0]?.price || product.price || 0;
  const price = convertPaiseToRupees(rawPrice);

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (userId) {
        // ✅ Logged-in (same as SwipeCard)
        await addToWishlist({
          productId: product.id,
        });
      } else {
        // ✅ Guest (same as SwipeCard)
        addToGuestWishlist({
          productId: product.id,
          variantId: null,
          title: product.title,
          brand: product.brand?.name,
          price: rawPrice,
          image: product.media?.[0]?.mediaItem?.url ?? null,
          sku: null,
          fullProduct: product,
        });
        toast.success("Added to Wishlist!");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not add to wishlist.");
    }
  };

  return (
    <div className="flex-shrink-0 group cursor-pointer bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative w-full aspect-[1/1]">
          <Image
            src={
              product.media?.[0]?.mediaItem?.url ||
              "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
            }
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        </div>

        <div className="p-1.5 sm:p-2 text-center">
          <h3 className="text-xs sm:text-sm font-normal text-gray-700 truncate">
            {product.title}
          </h3>

          <div className="flex justify-center items-center space-x-2 sm:space-x-3 mt-1">
            <p className="text-xs sm:text-sm font-medium text-gray-900">
              ₹{price}
            </p>

            {/* ➕ SAME BUTTON — NOW WISHLIST */}
            <button
              onClick={handleAddToWishlist}
              disabled={isLoading}
              className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Add to wishlist"
            >
              {isLoading ? (
                <Icons.Spinner className="w-3 h-3 animate-spin" />
              ) : (
                <Icons.Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

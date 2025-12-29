"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

interface Product {
  slug: any;
  id: string;
  media: { mediaItem: { url: string } }[];
  title: string;
  variants?: { price: number }[];
  price?: number;
  brand?: { name: string };
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
  products: { product: Product }[];
  title?: string;
  userId?: string;
}

export function ProductGrid({
  className,
  products,
  title = "Gentle on Skin. Kinder to Earth",
  userId,
  ...props
}: ProductGridProps) {
  if (!products || !Array.isArray(products)) return null;

  const { addToGuestWishlist } = useGuestWishlist();

  const { mutateAsync: addToWishlist } =
    trpc.general.users.wishlist.addProductInWishlist.useMutation({
      onSuccess: () => toast.success("Added to Wishlist!"),
      onError: (err) =>
        toast.error(err.message || "Could not add to wishlist."),
    });

  return (
    <div className={cn("bg-[#FCFBF4] py-8", className)} {...props}>
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* Header */}
        <h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-6">
          {title}
        </h2>

        {/* 🚀 UNIVERSAL CAROUSEL */}
        <div className="overflow-x-auto scrollbar-hide pb-3">
          <div className="flex gap-4 w-max">
            {products.map(({ product }) => {
              const price = convertPaiseToRupees(
                product.variants?.[0]?.price || product.price || 0
              );

              const imageUrl =
                product.media[0]?.mediaItem?.url ||
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

              const handleWishlist = async (
                e: React.MouseEvent<HTMLButtonElement>
              ) => {
                e.preventDefault();
                e.stopPropagation();

                if (userId) {
                  await addToWishlist({ productId: product.id });
                } else {
                  addToGuestWishlist({
                    productId: product.id,
                    variantId: null,
                    title: product.title,
                    brand: product.brand?.name,
                    price,
                    image: imageUrl,
                    sku: null,
                    fullProduct: product,
                  });
                  toast.success("Added to Wishlist!");
                }
              };

              return (
                <div
                  key={product.id}
                  className="
                    relative
                    w-[90px]
                    sm:w-[120px]
                    md:w-[150px]
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

                      {/* ❤️ WISHLIST */}
                      <button
                        onClick={handleWishlist}
                        className="
                          absolute top-2 right-2 z-10
                          flex h-7 w-7 items-center justify-center
                          rounded-full bg-white/90 shadow
                          hover:bg-black hover:text-white transition
                        "
                      >
                        <Icons.Heart className="h-3.5 w-3.5" />
                      </button>
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

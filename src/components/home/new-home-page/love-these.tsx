"use client";

import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";
import { convertPaiseToRupees } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

const PLACEHOLDER_IMAGE_URL =
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

export const ProductCard = ({
  banner,
  userId,
}: {
  banner: Banner;
  userId?: string;
}) => {
  const { product } = banner;
  if (!product) return null;

  const { addToGuestWishlist } = useGuestWishlist();

  const { mutateAsync: addToWishlist } =
    trpc.general.users.wishlist.addProductInWishlist.useMutation({
      onSuccess: () => toast.success("Added to Wishlist!"),
      onError: (err) =>
        toast.error(err.message || "Could not add to wishlist."),
    });

  const price = convertPaiseToRupees(
    product.variants?.[0]?.price ?? product.price ?? 0
  );

  const imageUrl =
    product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

  const productUrl = `/products/${product.slug}`;

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
    <Link
      href={productUrl}
      className="relative block w-[120px] sm:w-[200px]"
    >
      {/* IMAGE */}
      <div className="relative w-full h-[180px] sm:h-[220px] bg-gray-50 overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          className="object-cover"
        />

        {/* ❤️ WISHLIST BUTTON */}
        <button
          onClick={handleWishlist}
          className="
            absolute top-2 right-2 z-10
            flex h-8 w-8 items-center justify-center
            rounded-full bg-white/90 shadow
            hover:bg-black hover:text-white transition
          "
        >
          <Icons.Heart className="h-4 w-4" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="pt-2">
        <h3 className="text-[12px] sm:text-[14px] text-gray-800 line-clamp-2 h-9 font-normal">
          {product.title}
        </h3>

        <span className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
          ₹{price}
        </span>
      </div>
    </Link>
  );
};


// ============================================================
// ⭐ MOBILE = 2 ROWS + HORIZONTAL SCROLL
// ⭐ DESKTOP = NORMAL GRID (18 items)
// ============================================================
export function LoveThese({
  banners,
  userId,
}: {
  banners: Banner[];
  userId?: string;
}) {
  if (!banners.length) return null;

  const shownProducts = banners.slice(0, 18);

  return (
    <section className="w-full py-4 bg-[#FCFBF4]">
      <h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-6">
        You May Like
      </h2>

      {/* MOBILE */}
      <div className="md:hidden px-4 overflow-x-auto scrollbar-hide">
        <div className="grid grid-flow-col auto-cols-max grid-rows-2 gap-x-4 gap-y-5 w-max">
          {shownProducts.map((item) => (
            <ProductCard
              key={item.id}
              banner={item}
              userId={userId}
            />
          ))}
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block max-w-screen-2xl mx-auto px-6">
        <div className="grid gap-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {shownProducts.map((item) => (
            <ProductCard
              key={item.id}
              banner={item}
              userId={userId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


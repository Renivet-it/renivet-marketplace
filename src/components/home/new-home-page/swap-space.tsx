"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";
import React, { useRef, useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

/* =============================
   ⭐ GUEST CART HOOK (UNCHANGED)
============================= */
function useGuestCart() {
  const [guestCart, setGuestCart] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("guest_cart");
      if (stored) setGuestCart(JSON.parse(stored));
    } catch {
      setGuestCart([]);
    }
  }, []);

  const addToGuestCart = (item: any) => {
    setGuestCart((prev) => {
      const existing = prev.find(
        (x) =>
          x.productId === item.productId &&
          (x.variantId || null) === (item.variantId || null)
      );

      const updated = existing
        ? prev.map((x) =>
            x.productId === item.productId &&
            (x.variantId || null) === (item.variantId || null)
              ? { ...x, quantity: x.quantity + item.quantity }
              : x
          )
        : [...prev, item];

      localStorage.setItem("guest_cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("guestCartUpdated"));
      toast.success(existing ? "Updated Cart" : "Added to Cart!");
      return updated;
    });
  };

  return { guestCart, addToGuestCart };
}

const PLACEHOLDER_IMAGE_URL =
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

/* =============================
   ⭐ PRODUCT CARD
============================= */

interface ProductCardProps {
  banner: Banner;
  userId?: string;
}

const ProductCard = ({ banner, userId }: ProductCardProps) => {
  const { product } = banner;
  const router = useRouter();

  const { addToGuestCart } = useGuestCart();
  const { addToGuestWishlist } = useGuestWishlist();

  const [isWishlisted, setIsWishlisted] = useState(false);

  /* CART MUTATION (UNCHANGED) */
  const { mutateAsync: addToCart, isLoading } =
    trpc.general.users.cart.addProductToCart.useMutation();

  /* WISHLIST MUTATION (NEW – SAME AS SWIPECARD) */
  const { mutateAsync: addToWishlist } =
    trpc.general.users.wishlist.addProductInWishlist.useMutation({
      onSuccess: () => toast.success("Added to Wishlist!"),
      onError: (err) =>
        toast.error(err.message || "Could not add to wishlist"),
    });

  if (!product) return null;

  const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
  const price = convertPaiseToRupees(rawPrice);

  const originalPrice =
    product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;

  const displayPrice = originalPrice
    ? convertPaiseToRupees(originalPrice)
    : null;

  const discount =
    displayPrice && price
      ? Math.round(
          ((Number(displayPrice) - Number(price)) /
            Number(displayPrice)) *
            100
        )
      : null;

  const imageUrl =
    product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

  const variantId = product.variants?.[0]?.id || null;
  const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

  /* =============================
     🛒 CART HANDLER (UNCHANGED)
  ============================= */
  const handleAddToCart = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (userId) {
        await addToCart({
          productId: product.id,
          variantId,
          quantity: 1,
          userId,
        });
        toast.success("Added to Cart!");
      } else {
        addToGuestCart({
          productId: product.id,
          variantId,
          quantity: 1,
          title: product.title,
          brand: product.brand?.name,
          price: rawPrice,
          image: imageUrl,
          fullProduct: product,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not add to cart");
    }
  };

  /* =============================
     ❤️ WISHLIST HANDLER (REAL)
  ============================= */
  const handleAddToWishlist = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (userId) {
        await addToWishlist({ productId: product.id });
      } else {
        addToGuestWishlist({
          productId: product.id,
          variantId: null,
          title: product.title,
          brand: product.brand?.name,
          price: rawPrice,
          image: imageUrl,
          sku: null,
          fullProduct: product,
        });
        toast.success("Added to Wishlist!");
      }

      setIsWishlisted(true);
    } catch (err: any) {
      toast.error(err.message || "Could not add to wishlist");
    }
  };

  return (
    <div
      className="
        group flex-shrink-0 cursor-pointer
        w-[146px] md:w-[260px]
        md:h-[520px] md:flex md:flex-col
      "
    >
      <Link href={productUrl}>
        <div
          className="
            relative bg-gray-50 overflow-hidden
            w-[156px] h-[223px]
            md:w-full md:h-[350px]
          "
        >
          {/* ❤️ MOBILE WISHLIST (REAL LOGIC) */}
          <button
            onClick={handleAddToWishlist}
            className="
              md:hidden absolute top-2 right-2 z-20
              bg-white/80 backdrop-blur-md
              p-2 rounded-full shadow-md
              flex items-center justify-center
            "
          >
            {isWishlisted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-red-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
                4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
                14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
                3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <Icons.Heart className="w-5 h-5 text-gray-700" />
            )}
          </button>
          {/* ❤️ DESKTOP WISHLIST (SAME LOGIC) */}
<button
  onClick={handleAddToWishlist}
className="
  hidden md:flex absolute top-3 right-3 z-20
  bg-white/90 backdrop-blur-md
  p-2 rounded-full shadow-md
  items-center justify-center
"

>
  {isWishlisted ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 text-red-500"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42
      4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81
      14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0
      3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <Icons.Heart className="w-5 h-5 text-gray-700" />
  )}
</button>


          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 146px, 350px"
          />
        </div>
      </Link>

      {/* TITLE */}
      <div className="pt-3 pb-2 text-left h-[42px] md:h-[48px] overflow-hidden">
        <Link href={productUrl}>
          <h3 className="text-[14px] md:text-[15px] font-normal text-gray-700 leading-tight line-clamp-2">
            {product.title}
          </h3>
        </Link>
      </div>

      {/* PRICE ROW */}
      <div className="flex items-center gap-2 h-[26px]">
        <span className="text-lg font-semibold text-gray-900">₹{price}</span>

        {displayPrice ? (
          <span className="text-sm text-gray-400 line-through">
            ₹{displayPrice}
          </span>
        ) : (
          <span className="text-sm opacity-0">₹0000</span>
        )}

        <span className="hidden md:inline text-sm text-red-600">
          {discount ? `${discount}% off` : ""}
        </span>
      </div>

      {/* MOBILE DISCOUNT */}
      <div className="md:hidden h-[18px]">
        {discount ? (
          <span className="text-sm text-red-600">{discount}% off</span>
        ) : (
          <span className="opacity-0 text-sm">0% off</span>
        )}
      </div>

      {/* 🛒 ADD TO CART (UNCHANGED) */}
      <div className="mt-2">
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="w-full border border-gray-700 text-gray-700 hover:bg-gray-800 hover:text-white text-sm font-medium py-2 transition-colors flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? (
            <Icons.Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Add to Cart"
          )}
        </button>
      </div>
    </div>
  );
};

/* =============================
   ⭐ SWAPSPACE (UNCHANGED)
============================= */

interface SwapSpaceProps {
  banners: Banner[];
  userId?: string;
  className?: string;
}

export function SwapSpace({ banners, userId, className }: SwapSpaceProps) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  if (!banners.length) return null;

  const scroll = (ref: any, direction: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -400 : 400,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className={cn("w-full py-6 bg-[#FCFBF4]", className)}>
<h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-6">
        Best Sellers
      </h2>

      {/* DESKTOP */}
      <div className="hidden md:block relative max-w-screen-3xl mx-auto px-6">
        <button
          onClick={() => scroll(desktopRef, "left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md w-10 h-10 flex items-center justify-center z-20"
        >
          <Icons.ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>

        <div
          ref={desktopRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
        >
          <div className="flex space-x-6 w-max">
            {banners.map((item) => (
              <ProductCard
                key={item.id}
                banner={item}
                userId={userId}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => scroll(desktopRef, "right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md w-10 h-10 flex items-center justify-center z-20"
        >
          <Icons.ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* MOBILE */}
      <div className="md:hidden overflow-x-auto scrollbar-hide px-4">
        <div ref={mobileRef} className="flex space-x-6">
          {banners.map((item) => (
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

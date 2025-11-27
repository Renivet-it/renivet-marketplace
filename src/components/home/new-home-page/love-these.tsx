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

// =============================
// ⭐ GUEST CART HOOK
// =============================
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

const PLACEHOLDER_IMAGE_URL = "/placeholder-product.jpg";

// =============================
// ⭐ PRODUCT CARD (Matches your screenshot design)
// =============================
interface ProductCardProps {
  banner: Banner;
  userId?: string;
}

const ProductCard = ({ banner, userId }: ProductCardProps) => {
  const { product } = banner;
  const router = useRouter();
  const { addToGuestCart } = useGuestCart();

  const { mutateAsync: addToCart, isLoading } =
    trpc.general.users.cart.addProductToCart.useMutation();

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
      ? Math.round(((Number(displayPrice) - Number(price)) / Number(displayPrice)) * 100)
      : null;

  const imageUrl =
    product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;

  const variantId = product.variants?.[0]?.id || null;
  const productUrl = product.slug ? `/products/${product.slug}` : "/shop";

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

  return (
    <div className="group w-[260px] flex-shrink-0 cursor-pointer">
      <Link href={productUrl}>
        {/* Product Image */}
        <div className="relative w-full h-[350px] bg-gray-50 rounded-md overflow-hidden">
          <Image src={imageUrl} alt={product.title} fill className="object-cover" />
        </div>
      </Link>

      {/* Product Content */}
      <div className="pt-3 pb-5 text-left">
        <Link href={productUrl}>
          <h3 className="text-[15px] font-normal text-gray-700 leading-tight line-clamp-2 h-10">
            {product.title}
          </h3>
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-gray-900">₹{price}</span>
          {displayPrice && (
            <span className="text-sm text-gray-400 line-through">₹{displayPrice}</span>
          )}
          {discount && <span className="text-sm text-green-600">{discount}% off</span>}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="mt-3 w-full border border-gray-700 text-gray-700 hover:bg-gray-800 hover:text-white text-sm font-medium rounded-md py-2 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isLoading ? <Icons.Spinner className="h-4 w-4 animate-spin" /> : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

// =============================
// ⭐ SWAPSPACE (New What's New Design)
// =============================
interface SwapSpaceProps {
  banners: Banner[];
  userId?: string;
  className?: string;
}

export function LoveThese({ banners, userId, className }: SwapSpaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (!banners.length) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section className={cn("w-full py-16 bg-[#FFF9F4]", className)}>
      {/* Title */}
      <h2 className="text-center text-3xl font-light text-[#4A453F] mb-12">
        What's New
      </h2>

      {/* DESKTOP CAROUSEL (Not grid anymore) */}
      <div className="hidden md:block relative max-w-screen-3xl mx-auto px-6">

        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center z-20"
        >
          <Icons.ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>

        {/* Scroll Row */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
        >
          <div className="flex space-x-6 w-max">
            {banners.map((item) => (
              <ProductCard key={item.id} banner={item} userId={userId} />
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full w-10 h-10 flex items-center justify-center z-20"
        >
          <Icons.ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* MOBILE CAROUSEL */}
      <div className="md:hidden overflow-x-auto scrollbar-hide px-4">
        <div ref={scrollRef} className="flex space-x-6">
          {banners.map((item) => (
            <ProductCard key={item.id} banner={item} userId={userId} />
          ))}
        </div>
      </div>
    </section>
  );
}

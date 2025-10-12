"use client";

import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Banner } from "@/lib/validations";
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons"; // Assuming you have an Icons component

// ==========================================================
// 🔹 GUEST CART HOOK (For guest user functionality)
// ==========================================================
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
      window.dispatchEvent(new Event("guestCartUpdated")); // To notify other components like the cart icon
      toast.success(existing ? "Increased quantity in Cart" : "Added to Cart!");
      return updated;
    });
  };

  return { guestCart, addToGuestCart };
}


const PLACEHOLDER_IMAGE_URL = "/placeholder-product.jpg";
const BACKGROUND_IMAGE_URL =
  "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN3wy7IOl64McafQHoWsZUzihAkJ3DF5EGgPpY";

// ---------------- Product Card (With Add to Cart Logic ) ----------------
interface ProductCardProps {
  banner: Banner;
  userId?: string; // Accept userId as a prop
}

const ProductCard = ({ banner, userId }: ProductCardProps) => {
  const { product } = banner;
  const { addToGuestCart } = useGuestCart();
  const router = useRouter();

  // tRPC mutation for logged-in users
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
  const productUrl = product.slug ? `/products/${product.slug}` : "/shop";
  const imageUrl =
    product.media?.[0]?.mediaItem?.url || PLACEHOLDER_IMAGE_URL;
  const variantId = product.variants?.[0]?.id || null;

  const discount =
    displayPrice && price
      ? Math.round(((Number(displayPrice) - Number(price)) / Number(displayPrice)) * 100)
      : null;

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (userId) {
        // --- LOGGED-IN USER ---
        await addToCart({
          productId: product.id,
          variantId: variantId,
          quantity: 1,
          userId,
        });
        toast.success("Added to Cart!");
      } else {
        // --- GUEST USER ---
        addToGuestCart({
          productId: product.id,
          variantId: variantId,
          quantity: 1,
          title: product.title,
          brand: product.brand?.name,
          price: rawPrice,
          image: imageUrl,
          fullProduct: product,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Could not add to cart.");
    }
  };

  return (
    <div className="group w-[220px] flex-shrink-0 cursor-pointer">
      <Link href={productUrl}>
        <div className="relative w-full h-[220px] bg-gray-100 rounded-md overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.title || "Product image"}
            fill
            className="object-cover"
          />
        </div>
      </Link>

      <div className="pt-2 pb-3 text-left">
        <Link href={productUrl}>
          <h3 className="text-sm font-normal text-gray-700 leading-tight line-clamp-2 h-10">
            {product.title}
          </h3>
        </Link>

        <div className="mt-1 flex items-baseline space-x-2">
          <span className="text-base font-bold text-gray-900">₹{price}</span>
          {displayPrice && (
            <span className="text-sm text-gray-400 line-through">
              ₹{displayPrice}
            </span>
          )}
          {discount && (
            <span className="text-sm font-semibold text-green-600">
              {discount}% off
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="mt-3 w-full border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white text-sm font-medium rounded-md py-2 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Icons.Spinner className="h-4 w-4 animate-spin" />
          ) : (
            "Add to Cart"
          )}
        </button>
      </div>
    </div>
  );
};

// ---------------- SwapSpace (Updated to pass userId) ----------------
interface SwapSpaceProps extends React.HTMLAttributes<HTMLElement> {
  banners: Banner[];
  userId?: string; // Accept userId
}

export function SwapSpace({ className, banners, userId, ...props }: SwapSpaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (!banners || banners.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    const container = scrollRef.current;
    if (container) {
      const scrollAmount = dir === "left" ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section
      className={cn(
        "w-full py-12 md:py-20 bg-center bg-cover bg-no-repeat relative",
        className
      )}
      style={{ backgroundImage: `url('${BACKGROUND_IMAGE_URL}')` }}
      aria-labelledby="swapspace-heading"
      {...props}
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-10 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Best Deals on Top Picks
          </h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View All →
          </Link>
        </div>

        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-md hover:shadow-lg rounded-full w-10 h-10 items-center justify-center z-20 border"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>

        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide scroll-smooth"
        >
          <div className="flex space-x-5 w-max">
            {banners.map((item) => (
              <ProductCard key={item.id} banner={item} userId={userId} />
            ))}
          </div>
        </div>

        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-md hover:shadow-lg rounded-full w-10 h-10 items-center justify-center z-20 border"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>
    </section>
  );
}

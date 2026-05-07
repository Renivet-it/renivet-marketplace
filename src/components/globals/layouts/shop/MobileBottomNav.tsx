"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

type CartItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

// Unified cart hook
function useUnifiedCart() {
  const { userId } = useAuth();
  const utils = trpc.useUtils();

  // ✅ Only call query when userId exists
  const {
    data: userCart,
    isLoading: isUserCartLoading,
    error,
  } = trpc.general.users.cart.getCartForUser.useQuery(
    { userId: userId as string },
    {
      enabled: !!userId,
      retry: false,
    }
  );

  // Console log the API response
  useEffect(() => {
    if (userId) {
      console.log("🛒 User Cart Data:", userCart);
      console.log("📊 Is Array?:", Array.isArray(userCart));
      console.log("🔢 Cart Length:", Array.isArray(userCart) ? userCart.length : "Not an array");
    }
  }, [userCart, userId]);

  const addToUserCartMutation = trpc.general.users.cart.addProductToCart.useMutation({
    onSuccess: () => {
      toast.success("Added to Cart!");
      utils.general.users.cart.getCartForUser.invalidate({ userId: userId as string });
    },
    onError: (err) => toast.error(err.message || "Failed to add item."),
  });

  // Guest cart logic
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!userId) {
      try {
        const stored = localStorage.getItem("guest_cart");
        if (stored) {
          setGuestCart(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to parse guest cart from localStorage", error);
        localStorage.removeItem("guest_cart");
      }
    }
  }, [userId]);

  // Unified addToCart
  const addToCart = (item: CartItem) => {
    if (userId) {
      addToUserCartMutation.mutate(item);
    } else {
      setGuestCart((prev) => {
        const existing = prev.find(
          (x) => x.productId === item.productId && (x.variantId || null) === (item.variantId || null)
        );
        let updated: CartItem[];
        if (existing) {
          updated = prev.map((x) =>
            x.productId === item.productId && (x.variantId || null) === (item.variantId || null)
              ? { ...x, quantity: x.quantity + item.quantity }
              : x
          );
          toast.success("Increased quantity in Cart");
        } else {
          updated = [...prev, item];
          toast.success("Added to Cart!");
        }
        localStorage.setItem("guest_cart", JSON.stringify(updated));
        window.dispatchEvent(new Event("guestCartUpdated"));
        return updated;
      });
    }
  };

  // Handle userCart being an array directly
  const cartItems = userId
    ? (Array.isArray(userCart) ? userCart : userCart?.items ?? [])
    : guestCart;
  // Show number of unique items, not total quantity
  const cartItemCount = cartItems.length;

  return {
    cartItemCount,
    addToCart,
    isUserCartLoading,
    error,
  };
}

// Mobile navigation
export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartItemCount } = useUnifiedCart();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/mycart", icon: ShoppingBag, label: "Cart", count: cartItemCount },
    { href: "/profile/wishlist", icon: Heart, label: "Wishlist" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  if (
    pathname === "/shop" ||
    pathname.startsWith("/shop/") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  ) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#eadfce] bg-white/95 pb-[max(env(safe-area-inset-bottom),0px)] shadow-[0_-8px_24px_rgba(57,48,33,0.08)] backdrop-blur-xl md:hidden">
      <div className="mx-auto w-full max-w-sm px-3">
          <div className="grid h-[74px] grid-cols-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold tracking-[0.08em] transition-all duration-200",
                  pathname === item.href
                    ? "bg-[linear-gradient(180deg,#31401f_0%,#263018_100%)] text-white shadow-[0_14px_26px_rgba(49,64,31,0.28)]"
                    : item.label === "Cart"
                      ? "text-primary"
                      : "text-[#726a58]"
                )}
              >
                {pathname === item.href && (
                  <span className="absolute inset-x-6 top-1 h-[3px] rounded-full bg-[#f0e0b6]" />
                )}
                <div
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-full border transition-all",
                    pathname === item.href
                      ? "border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : item.label === "Cart"
                        ? "border-[#e7d9bb] bg-[linear-gradient(180deg,#fffdf8_0%,#f3ead7_100%)] text-primary shadow-[0_12px_26px_rgba(184,160,115,0.24)]"
                        : "border-[#efe5d2] bg-white/60 text-[#5e584b]"
                  )}
                >
                  <item.icon className="size-[21px]" />
                  {item.label === "Cart" && item.count > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[#fbf6ec] bg-[#ff5a52] px-1 text-[10px] font-bold text-white shadow-sm">
                      {item.count}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "truncate leading-none",
                    pathname === item.href
                      ? "text-white"
                      : item.label === "Cart"
                        ? "text-primary"
                        : "text-[#726a58]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
      </div>
    </nav>
  );
}

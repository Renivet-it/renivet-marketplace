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

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-transparent md:hidden">
      <div className="mx-auto mb-2 mt-1 w-[90%] max-w-sm rounded-full bg-neutral-900 text-white shadow-lg">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                pathname === item.href ? "text-white" : "text-neutral-400 hover:text-white"
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {item.label === "Cart" && item.count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
function useGuestCart() {
  const [guestCart, setGuestCart] = useState<any[]>([]);

  // Load guest cart from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("guest_cart");
    if (stored) setGuestCart(JSON.parse(stored));
  }, []);

  // 🔥 Listen for custom events to update cart
  useEffect(() => {
    const handleCartUpdate = () => {
      const stored = localStorage.getItem("guest_cart");
      setGuestCart(stored ? JSON.parse(stored) : []);
    };

    window.addEventListener("guestCartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("guestCartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

const addToGuestCart = (item: any) => {
  setGuestCart((prev) => {
    const existing = prev.find(
      (x) =>
        x.productId === item.productId &&
        (x.variantId || null) === (item.variantId || null)
    );

    let updated;
    if (existing) {
      updated = prev.map((x) =>
        x.productId === item.productId &&
        (x.variantId || null) === (item.variantId || null)
          ? { ...x, quantity: x.quantity + item.quantity }
          : x
      );
      toast.success("Increased quantity in Cart"); // ✅ toast for guest
    } else {
      updated = [...prev, item];
      toast.success("Added to Cart!"); // ✅ toast for guest
    }

    localStorage.setItem("guest_cart", JSON.stringify(updated));

    // ✅ Defer event so Navbar updates safely
    setTimeout(() => {
      window.dispatchEvent(new Event("guestCartUpdated"));
    }, 0);

    return updated;
  });
};


  const clearGuestCart = () => {
    localStorage.removeItem("guest_cart");
    setGuestCart([]);
    window.dispatchEvent(new Event("guestCartUpdated"));
  };

  return { guestCart, addToGuestCart, clearGuestCart };
}
// A simple hook to get cart count (you can adapt this)
function useCartItemCount() {
  const { userId } = useAuth();

  // For logged-in users
  const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery(undefined, {
    enabled: !!userId,
  });

  // For guest users (assuming you have a hook like this)
  const { guestCart } = useGuestCart();

  if (userId) {
    // If userCart is an array of cart items
    if (Array.isArray(userCart)) {
      return userCart.reduce((acc, item) => acc + item.quantity, 0);
    }
    // If userCart is a single cart item
    if (userCart && typeof userCart.quantity === "number") {
      return userCart.quantity;
    }
    return 0;
  }

  return guestCart.reduce((acc: number, item: any) => acc + item.quantity, 0);
}


export function MobileBottomNav() {
  const pathname = usePathname();
  const cartItemCount = useCartItemCount();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", count: cartItemCount },
    { href: "/wishlist", icon: Heart, label: "Wishlist" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // We don't want to show this on auth pages, etc.
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t bg-background md:hidden">
      {/* This is the floating pill container */}
      <div className="mx-auto mb-2 mt-1 w-[90%] max-w-md rounded-full bg-neutral-900 text-white shadow-lg">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium",
                pathname === item.href ? "text-white" : "text-neutral-400"
              )}
            >
              <item.icon className="h-6 w-6" />
              {/* Cart item count badge */}
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute right-3 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

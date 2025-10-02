"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

// Define a type for cart items for better safety and clarity
type CartItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

// --- START: Combined Cart Hook Logic ---
// This hook manages cart state for both guests and logged-in users.
function useUnifiedCart() {
  const { userId } = useAuth();
  const utils = trpc.useUtils();

  // --- State and Mutations for LOGGED-IN USERS ---
  const { data: userCart, isLoading: isUserCartLoading } = trpc.general.users.cart.getCartForUser.useQuery(undefined, {
    enabled: !!userId, // Only fetch if the user is logged in
  });

  const addToUserCartMutation = trpc.general.users.cart.addProductToCart.useMutation({
    onSuccess: () => {
      toast.success("Added to Cart!");
      utils.general.users.cart.getCartForUser.invalidate(); // Refresh cart from server
    },
    onError: (err) => toast.error(err.message || "Failed to add item."),
  });

  // --- State and Logic for GUEST USERS ---
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);

  // Effect to load guest cart from localStorage (only runs for guests)
  useEffect(() => {
    if (!userId) {
      try {
        const stored = localStorage.getItem("guest_cart");
        if (stored) {
          setGuestCart(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to parse guest cart from localStorage", error);
        localStorage.removeItem("guest_cart"); // Clear corrupted data
      }
    }
  }, [userId]);

  // --- UNIFIED FUNCTIONS (The "Public API" of the hook) ---

  const addToCart = (item: CartItem) => {
    if (userId) {
      // If logged in, use the tRPC mutation
      addToUserCartMutation.mutate(item);
    } else {
      // If a guest, update localStorage
      setGuestCart((prev) => {
        const existing = prev.find(x => x.productId === item.productId && (x.variantId || null) === (item.variantId || null));
        let updated: CartItem[];
        if (existing) {
          updated = prev.map(x => x.productId === item.productId && (x.variantId || null) === (item.variantId || null) ? { ...x, quantity: x.quantity + item.quantity } : x);
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

  // Determine which cart's items and count to expose
  const cartItems = userId ? userCart?.items ?? [] : guestCart;
  const cartItemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  return {
    cartItemCount,
    // You can also return `addToCart` if other components need it, but this one doesn't
  };
}
// --- END: Combined Cart Hook Logic ---


/**
 * A mobile-only bottom navigation bar that is fixed to the viewport.
 * It correctly displays the cart count for both guests and logged-in users.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  // The component now uses the unified hook to get the cart count.
  const { cartItemCount } = useUnifiedCart();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/mycart", icon: ShoppingBag, label: "Cart", count: cartItemCount },
    { href: "/profile/wishlist", icon: Heart, label: "Wishlist" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  // Do not render on auth pages for a cleaner UI
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
                "relative flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                pathname === item.href ? "text-white" : "text-neutral-400 hover:text-white"
              )}
            >
              <item.icon className="h-6 w-6" />
              {/* Cart item count badge */}
              {item.label === "Cart" && item.count > 0 && (
                <span className="absolute right-3 top-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {item.count > 9 ? "9+" : item.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

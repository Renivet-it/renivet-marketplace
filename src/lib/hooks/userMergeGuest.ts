import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

// ==========================================================
// 🔹 useGuestCart Hook (No changes needed here)
// ==========================================================
function useGuestCart() {
  const [guestCart, setGuestCart] = useState<any[]>([]);

  // Load guest cart from localStorage on initial mount
  useEffect(() => {
    const stored = localStorage.getItem("guest_cart");
    if (stored) {
      try {
        setGuestCart(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse guest cart from localStorage", e);
        setGuestCart([]);
      }
    }
  }, []);

  // Listen for external changes to the cart
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

      const updated = existing
        ? prev.map((x) =>
            x.productId === item.productId &&
            (x.variantId || null) === (item.variantId || null)
              ? { ...x, quantity: x.quantity + item.quantity }
              : x
          )
        : [...prev, item];

      localStorage.setItem("guest_cart", JSON.stringify(updated));
      toast.success(existing ? "Increased quantity in Cart" : "Added to Cart!");
      
      setTimeout(() => window.dispatchEvent(new Event("guestCartUpdated")), 0);
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


// ==========================================================
// 🔹 FINAL, CORRECTED useMergeGuestCartOnLogin Hook
// ==========================================================
export function useMergeGuestCartOnLogin() {
  const { userId } = useAuth();
  const { guestCart, clearGuestCart } = useGuestCart();
  const utils = trpc.useUtils();

  const { mutate: mergeGuestCart, isPending } = trpc.general.users.cart.mergeGuestCart.useMutation({
    onSuccess: () => {
      clearGuestCart();
      utils.general.users.cart.getCartForUser.invalidate();
      toast.success("Your guest cart items have been moved to your account.");
    },
    onError: (error) => {
      toast.error(`Failed to merge cart: ${error.message}`);
      // If it fails, clear the session flag to allow a retry
      sessionStorage.removeItem("cart_has_been_merged");
    }
  });

  useEffect(() => {
    // Check for the session flag first. If it exists, do nothing.
    const hasMerged = sessionStorage.getItem("cart_has_been_merged");

    if (userId && guestCart.length > 0 && !isPending && !hasMerged) {
      // Set the flag immediately in sessionStorage to prevent any re-runs
      sessionStorage.setItem("cart_has_been_merged", "true");
      
      mergeGuestCart(
        guestCart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        }))
      );
    }
  }, [userId, guestCart, isPending, mergeGuestCart]); // Keep dependencies simple
}


// ==========================================================
// 🔹 FINAL, CORRECTED useMergeGuestWishlistOnLogin Hook
// ==========================================================
export function useMergeGuestWishlistOnLogin() {
  const { userId } = useAuth();
  const { guestWishlist, clearGuestWishlist } = useGuestWishlist();
  const utils = trpc.useUtils();

  const { mutate: mergeGuestWishlist, isPending } = trpc.general.users.wishlist.mergeGuestWishlist.useMutation({
    onSuccess: () => {
      clearGuestWishlist();
      if (userId) {
        utils.general.users.wishlist.getWishlist.invalidate({ userId });
      }
    },
    onError: () => {
      sessionStorage.removeItem("wishlist_has_been_merged");
    }
  });

  useEffect(() => {
    const hasMerged = sessionStorage.getItem("wishlist_has_been_merged");

    if (userId && guestWishlist.length > 0 && !isPending && !hasMerged) {
      sessionStorage.setItem("wishlist_has_been_merged", "true");

      mergeGuestWishlist(
        guestWishlist.map((item) => ({
          productId: item.productId,
        }))
      );
    }
  }, [userId, guestWishlist, isPending, mergeGuestWishlist]);
}

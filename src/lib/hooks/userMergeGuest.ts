import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useGuestWishlist } from "@/lib/hooks/useGuestWishlist";

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

export function useMergeGuestCartOnLogin() {
  const { userId } = useAuth();
  const { guestCart, clearGuestCart } = useGuestCart();
  const utils = trpc.useUtils(); // ✅ get query utils

  const mergeGuestCart = trpc.general.users.cart.mergeGuestCart.useMutation({
    onSuccess: () => {
      clearGuestCart();
      utils.general.users.cart.getCartForUser.invalidate(); // ✅ refetch cart after merge
    },
  });

  useEffect(() => {
    if (userId && guestCart.length > 0) {
      mergeGuestCart.mutate(
        guestCart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        }))
      );
    }
  }, [userId, guestCart]);
}


export function useMergeGuestWishlistOnLogin() {
  const { userId } = useAuth();
  const { guestWishlist, clearGuestWishlist } = useGuestWishlist();
  const utils = trpc.useUtils();

  const mergeGuestWishlist = trpc.general.users.wishlist.mergeGuestWishlist.useMutation({
    onSuccess: () => {
      clearGuestWishlist();
      if (userId) {
        utils.general.users.wishlist.getWishlist.invalidate({ userId });
      }
    },
  });

  useEffect(() => {
    // run only when user logs in & there is guest data
    if (userId && guestWishlist.length > 0 && !mergeGuestWishlist.isLoading) {
      console.log(mergeGuestWishlist, "mergeGuestWishlist");
      mergeGuestWishlist.mutate(
        guestWishlist.map((item) => ({
          productId: item.productId, // or item.productId if that’s your key
        }))
      );
    }
  }, [userId, guestWishlist]);
}


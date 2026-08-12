"use client";

// hooks/useGuestWishlist.ts
import { useEffect, useState } from "react";

type GuestWishlistItem = {
    productId: string;
    variantId?: string | null;
    [key: string]: unknown;
};

// export function useGuestWishlist() {
//   const [guestWishlist, setGuestWishlist] = useState<any[]>([]);

//   useEffect(() => {
//     const stored = localStorage.getItem("guest_wishlist");
//     if (stored) setGuestWishlist(JSON.parse(stored));
//   }, []);

//   useEffect(() => {
//     const handleWishlistUpdate = () => {
//       const stored = localStorage.getItem("guest_wishlist");
//       setGuestWishlist(stored ? JSON.parse(stored) : []);
//     };

//     window.addEventListener("guestWishlistUpdated", handleWishlistUpdate);
//     window.addEventListener("storage", handleWishlistUpdate);

//     return () => {
//       window.removeEventListener("guestWishlistUpdated", handleWishlistUpdate);
//       window.removeEventListener("storage", handleWishlistUpdate);
//     };
//   }, []);

// const addToGuestWishlist = (item: any) => {
//   setGuestWishlist((prev) => {
//     const exists = prev.find(
//       (x) =>
//         x.productId === item.productId &&
//         String(x.variantId ?? '') === String(item.variantId ?? '')
//     );

//     let updated;
//     if (!exists) {
//       updated = [...prev, item];
//       toast.success("Added to Wishlist!");
//     } else {
//       updated = prev.filter(
//         (x) =>
//           !(
//             x.productId === item.productId &&
//             String(x.variantId ?? "") === String(item.variantId ?? "")
//           )
//       );
//       toast.success("Removed from Wishlist!");
//     }

//     localStorage.setItem("guest_wishlist", JSON.stringify(updated));
//     window.dispatchEvent(new Event("guestWishlistUpdated"));
//     return updated;
//   });
// };

//   const clearGuestWishlist = () => {
//     localStorage.removeItem("guest_wishlist");
//     setGuestWishlist([]);
//     window.dispatchEvent(new Event("guestWishlistUpdated"));
//   };

//   return { guestWishlist, addToGuestWishlist, clearGuestWishlist };
// }

export function useGuestWishlist() {
    const [guestWishlist, setGuestWishlist] = useState<GuestWishlistItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("guest_wishlist");
        if (stored) setGuestWishlist(JSON.parse(stored));
    }, []);

    useEffect(() => {
        const handleWishlistUpdate = () => {
            const stored = localStorage.getItem("guest_wishlist");
            setGuestWishlist(stored ? JSON.parse(stored) : []);
        };

        window.addEventListener("guestWishlistUpdated", handleWishlistUpdate);
        window.addEventListener("storage", handleWishlistUpdate);

        return () => {
            window.removeEventListener(
                "guestWishlistUpdated",
                handleWishlistUpdate
            );
            window.removeEventListener("storage", handleWishlistUpdate);
        };
    }, []);

    const addToGuestWishlist = (item: GuestWishlistItem) => {
        let current: GuestWishlistItem[] = [];
        try {
            current = JSON.parse(
                localStorage.getItem("guest_wishlist") || "[]"
            ) as GuestWishlistItem[];
        } catch {
            current = [];
        }

        const exists = current.some(
            (entry) =>
                entry.productId === item.productId &&
                String(entry.variantId ?? "") === String(item.variantId ?? "")
        );
        const updated = exists
            ? current.filter(
                  (entry) =>
                      !(
                          entry.productId === item.productId &&
                          String(entry.variantId ?? "") ===
                              String(item.variantId ?? "")
                      )
              )
            : [...current, item];

        localStorage.setItem("guest_wishlist", JSON.stringify(updated));
        setGuestWishlist(updated);
        window.dispatchEvent(new Event("guestWishlistUpdated"));
    };

    const clearGuestWishlist = () => {
        localStorage.removeItem("guest_wishlist");
        setGuestWishlist([]);
        window.dispatchEvent(new Event("guestWishlistUpdated"));
    };

    return { guestWishlist, addToGuestWishlist, clearGuestWishlist };
}

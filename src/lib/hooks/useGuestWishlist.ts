// hooks/useGuestWishlist.ts
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  const [guestWishlist, setGuestWishlist] = useState<any[]>([]);

  // ✅ Only read and set after mount
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
      window.removeEventListener("guestWishlistUpdated", handleWishlistUpdate);
      window.removeEventListener("storage", handleWishlistUpdate);
    };
  }, []);

  const addToGuestWishlist = (item: any) => {
    // update localStorage, then *schedule* the event
    localStorage.setItem("guest_wishlist", JSON.stringify([...guestWishlist, item]));
    setTimeout(() => {
      window.dispatchEvent(new Event("guestWishlistUpdated"));
    }, 0);  // 👈 important: defer
  };

  return { guestWishlist, addToGuestWishlist };
}

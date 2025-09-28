// app/merge-guest-wishlist.tsx
"use client";

import { useMergeGuestWishlistOnLogin } from "@/lib/hooks/userMergeGuest";

export function MergeGuestWishlist() {
  useMergeGuestWishlistOnLogin();
  return null; // no UI needed
}

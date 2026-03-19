"use client";
// app/merge-guest-wishlist.tsx

import { useMergeGuestWishlistOnLogin } from "@/lib/hooks/userMergeGuest";

export function MergeGuestWishlist() {
  useMergeGuestWishlistOnLogin();
  return null; // no UI needed
}

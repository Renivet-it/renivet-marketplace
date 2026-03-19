"use client";
// app/merge-guest-cart.tsx

import { useMergeGuestCartOnLogin } from "@/lib/hooks/userMergeGuest";

export function MergeGuestCart() {
  useMergeGuestCartOnLogin(); // ✅ runs once after login
  return null; // no UI, just logic
}

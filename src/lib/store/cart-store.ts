import { create } from "zustand";
import { CouponWithCategory } from "@/lib/validations";

interface ShippingAddress {
    id: string;
    alias: string;
    aliasSlug: string;
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    type: string;
    isPrimary: boolean;
}

interface CartStore {
    selectedShippingAddress: ShippingAddress | null;
    appliedCoupon: CouponWithCategory | null;
    setSelectedShippingAddress: (address: ShippingAddress) => void;
    setAppliedCoupon: (coupon: CouponWithCategory | null) => void;
}

export const useCartStore = create<CartStore>((set) => ({
    selectedShippingAddress: null,
    setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
    appliedCoupon: null,
    setSelectedShippingAddress: (address) => set({ selectedShippingAddress: address }),
}));

import { create } from "zustand";

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
    setSelectedShippingAddress: (address: ShippingAddress) => void;
}

export const useCartStore = create<CartStore>((set) => ({
    selectedShippingAddress: null,
    setSelectedShippingAddress: (address) => set({ selectedShippingAddress: address }),
}));

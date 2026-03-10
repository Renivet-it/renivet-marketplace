import { create } from "zustand";

export type GuestPopupMode = "cart" | "welcome";

interface GuestPopupStore {
    isOpen: boolean;
    mode: GuestPopupMode;
    openPopup: (mode?: GuestPopupMode) => void;
    closePopup: () => void;
}

export const useGuestPopupStore = create<GuestPopupStore>((set) => ({
    isOpen: false,
    mode: "cart",
    openPopup: (mode = "cart") => set({ isOpen: true, mode }),
    closePopup: () => set({ isOpen: false }),
}));

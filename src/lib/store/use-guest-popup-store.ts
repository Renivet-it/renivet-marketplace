import { create } from "zustand";

interface GuestPopupStore {
    isOpen: boolean;
    openPopup: () => void;
    closePopup: () => void;
}

export const useGuestPopupStore = create<GuestPopupStore>((set) => ({
    isOpen: false,
    openPopup: () => set({ isOpen: true }),
    closePopup: () => set({ isOpen: false }),
}));

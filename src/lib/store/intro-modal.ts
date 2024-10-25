import { create } from "zustand";

interface IntroModalState {
    isOpen: boolean;
    setIsOpen: (state: boolean) => void;
}

export const useIntroModalStore = create<IntroModalState>((set) => ({
    isOpen: false,
    setIsOpen: (state) => set({ isOpen: state }),
}));

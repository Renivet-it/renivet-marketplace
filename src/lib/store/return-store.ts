import { OrderWithItemAndBrand } from "@/lib/validations";
import { create } from "zustand";
import type { ReturnOrderPayload } from "./validation/return-store-validation";

interface ReturnStoreState {
    step: number;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    selectedReturnItem: OrderWithItemAndBrand["items"][number] | null;
    returnItemPayload: Partial<ReturnOrderPayload> | null;
    setReturnItemPayload: (payload: Partial<ReturnOrderPayload>) => void;
    setReturnItem: (item: OrderWithItemAndBrand["items"][number]) => void;
    clearReturnItem: () => void;
    reset: () => void;
}

export const useReturnStore = create<ReturnStoreState>((set) => ({
    step: 1,
    setStep: (step) => set({ step }),
    nextStep: () => set((state) => ({ step: state.step + 1 })),
    prevStep: () => set((state) => ({ step: state.step - 1 })),
    selectedReturnItem: null,
    returnItemPayload: null,
    setReturnItemPayload: (payload) =>
        set((state) => ({
            returnItemPayload: {
                ...state.returnItemPayload,
                ...payload,
            },
        })),
    setReturnItem: (item) => set({ selectedReturnItem: item }),
    clearReturnItem: () => set({ selectedReturnItem: null }),
    reset: () =>
        set({
            step: 1,
            selectedReturnItem: null,
            returnItemPayload: null,
        }),
}));

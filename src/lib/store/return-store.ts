import { create } from "zustand";
import { OrderWithItemAndBrand } from "@/lib/validations";

interface ReturnStoreState {
  selectedReturnItem: OrderWithItemAndBrand["items"][number] | null;
  setReturnItem: (item: OrderWithItemAndBrand["items"][number]) => void;
  clearReturnItem: () => void;
}

export const useReturnStore = create<ReturnStoreState>((set) => ({
  selectedReturnItem: null,
  setReturnItem: (item) => set({ selectedReturnItem: item }),
  clearReturnItem: () => set({ selectedReturnItem: null }),
}));
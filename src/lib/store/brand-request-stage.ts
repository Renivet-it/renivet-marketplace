import { create } from "zustand";

interface BrandRequestStageState {
    stage: number;
    setStage: (stage: number) => void;
}

export const useBrandRequestStageStore = create<BrandRequestStageState>(
    (set) => ({
        stage: 1,
        setStage: (stage) => set({ stage }),
    })
);

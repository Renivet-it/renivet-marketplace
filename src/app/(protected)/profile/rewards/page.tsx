import { RewardSelectionPage } from "@/components/profile/reward-selection-page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Redeem Reward",
    description: "Choose and redeem your unlocked Swap & Reward product",
};

export default function Page() {
    return <RewardSelectionPage />;
}

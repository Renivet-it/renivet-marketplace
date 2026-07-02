import { Button } from "@react-email/components";
import { getAbsoluteURL } from "@/lib/utils";
import Layout from "./layout";

interface Props {
    firstName: string;
}

export default function SwapRewardUnlockedEmail({
    firstName = "there",
}: Props) {
    return (
        <Layout
            preview="Your Renivet reward is ready"
            heading="Reward Unlocked"
        >
            <p>Hi {firstName},</p>
            <p>
                You&apos;ve completed 5 swaps and unlocked a free product worth
                up to <strong>Rs. 1,499</strong>.
            </p>
            <p>Your Swap Card is complete and your reward is ready to redeem.</p>
            <Button
                href={getAbsoluteURL("/profile")}
                className="bg-brand px-10 py-3 text-white"
                style={{
                    marginLeft: "auto",
                    marginRight: "auto",
                    display: "block",
                    width: "fit-content",
                }}
            >
                Redeem Your Reward
            </Button>
        </Layout>
    );
}

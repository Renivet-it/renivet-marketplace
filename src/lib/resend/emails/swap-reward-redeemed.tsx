import { Button } from "@react-email/components";
import { getAbsoluteURL } from "@/lib/utils";
import Layout from "./layout";

interface Props {
    firstName: string;
    productTitle: string;
}

export default function SwapRewardRedeemedEmail({
    firstName = "there",
    productTitle = "your reward",
}: Props) {
    return (
        <Layout
            preview="Your reward order has been placed"
            heading="Reward Redeemed"
        >
            <p>Hi {firstName},</p>
            <p>
                Your Swap &amp; Reward redemption for <strong>{productTitle}</strong>{" "}
                has been placed successfully.
            </p>
            <p>Your stamp card has reset, and your next reward cycle starts now.</p>
            <Button
                href={getAbsoluteURL("/profile/orders")}
                className="bg-brand px-10 py-3 text-white"
                style={{
                    marginLeft: "auto",
                    marginRight: "auto",
                    display: "block",
                    width: "fit-content",
                }}
            >
                View Orders
            </Button>
        </Layout>
    );
}

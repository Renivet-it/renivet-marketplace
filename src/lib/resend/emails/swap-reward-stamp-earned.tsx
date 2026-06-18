import { Button } from "@react-email/components";
import { getAbsoluteURL } from "@/lib/utils";
import Layout from "./layout";

interface Props {
    firstName: string;
    stampCount: number;
}

export default function SwapRewardStampEarnedEmail({
    firstName = "there",
    stampCount = 1,
}: Props) {
    return (
        <Layout
            preview="You've earned a new Renivet stamp"
            heading="A New Stamp Is On Your Card"
        >
            <p>Hi {firstName},</p>
            <p>
                You&apos;ve earned a new Renivet stamp. You now have{" "}
                <strong>{stampCount} out of 5</strong> stamps on your Swap Card.
            </p>
            <p>Keep swapping to unlock your thoughtful reward.</p>
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
                View Swap Card
            </Button>
        </Layout>
    );
}

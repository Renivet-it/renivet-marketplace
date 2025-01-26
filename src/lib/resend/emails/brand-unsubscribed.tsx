import {
    convertPaiseToRupees,
    formatPriceTag,
    getAbsoluteURL,
} from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    brand: {
        id: string;
        name: string;
    };
    plan: {
        name: string;
        amount: number;
    };
}

export default function BrandUnsubscribed({
    brand = {
        id: "9a49e106-67d0-458c-a441-02bdcf46dd81",
        name: "Brand",
    },
    plan = {
        name: "Plan 1",
        amount: 50000,
    },
}: Props) {
    return (
        <Layout
            preview="You have cancelled your subscription"
            heading="Subscription Cancelled"
        >
            <p>Hi {brand.name},</p>

            <p>
                You have successfully unsubscribed from the{" "}
                <strong>
                    &ldquo;{plan.name}
                    &rdquo;
                </strong>{" "}
                plan for {formatPriceTag(+convertPaiseToRupees(plan.amount))}.
                Your subscription has been cancelled.
            </p>

            <p>
                Sorry to see you go! If you have any feedback or need
                assistance, feel free to reach out to us.
            </p>

            <div className="mt-10">
                <Button
                    href={getAbsoluteURL(
                        `/dashboard/brands/${brand.id}/memberships`
                    )}
                    className="bg-brand px-10 py-3 text-white"
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "block",
                        width: "fit-content",
                    }}
                >
                    Manage Subscription
                </Button>
            </div>
        </Layout>
    );
}

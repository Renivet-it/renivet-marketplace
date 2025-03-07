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

export default function BrandSubscribed({
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
            preview="You have subscribed to a plan"
            heading="You are now subscribed to Renivet"
        >
            <p>Hi {brand.name},</p>

            <p>
                You have successfully subscribed to the{" "}
                <strong>
                    &ldquo;{plan.name}
                    &rdquo;
                </strong>{" "}
                plan for {formatPriceTag(+convertPaiseToRupees(plan.amount))}.
                Your subscription is now active.
            </p>

            <p>
                You can now enjoy the benefits of the plan. If you have any
                queries or need assistance, feel free to reach out to us.
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

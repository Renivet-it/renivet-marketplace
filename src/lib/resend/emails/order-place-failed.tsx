import { siteConfig } from "@/config/site";
import {
    convertPaiseToRupees,
    formatPriceTag,
    getAbsoluteURL,
} from "@/lib/utils";
import { Button } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    order: {
        id: string;
        amount: number;
    };
}

export default function OrderPlaceFailed({
    user = { name: "John Doe" },
    order = { id: "123", amount: 591826 },
}: Props) {
    return (
        <Layout preview="Order placement failed" heading="Order Payment Failed">
            <p>Hi {user.name},</p>

            <p>
                We regret to inform you that the payment for your order (ID:{" "}
                {order.id}) of{" "}
                {formatPriceTag(+convertPaiseToRupees(order.amount))} on{" "}
                {siteConfig.name} has failed.
            </p>

            <p>
                Don&apos;t worry! You can try placing the order again by
                clicking the button below.
            </p>

            <div className="mt-10">
                <Button
                    href={getAbsoluteURL(`/orders/${order.id}`)}
                    className="bg-brand px-10 py-3 text-white"
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "block",
                        width: "fit-content",
                    }}
                >
                    Try Again
                </Button>
            </div>

            <p>
                If you continue to face issues, please contact our support team
                for assistance.
            </p>
        </Layout>
    );
}

import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
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

export default function OrderRefundFailed({
    user = { name: "John Doe" },
    order = { id: "123", amount: 591826 },
}: Props) {
    return (
        <Layout preview="Refund processing failed" heading="Refund Failed">
            <p>Hi {user.name},</p>

            <p>
                We regret to inform you that we encountered an issue while
                processing your refund of{" "}
                <strong>
                    {formatPriceTag(+convertPaiseToRupees(order.amount))}
                </strong>{" "}
                for order <strong>{order.id}</strong>.
            </p>

            <p>
                Our team has been notified and is working to resolve this issue.
                We will reinitiate the refund process as soon as possible.
            </p>

            <p>
                If you have any concerns, please don&apos;t hesitate to contact
                our support team. We apologize for any inconvenience caused.
            </p>
        </Layout>
    );
}

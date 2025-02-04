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

export default function OrderRefundInitiated({
    user = { name: "John Doe" },
    order = { id: "123", amount: 591826 },
}: Props) {
    return (
        <Layout
            preview="Order refund initiated"
            heading="Order Refund Initiated"
        >
            <p>Hi {user.name},</p>

            <p>
                We regret to inform you that your order{" "}
                <strong>(ID: {order.id})</strong> has been cancelled due to
                insufficient stock of one or more items. A refund of{" "}
                <strong>
                    {formatPriceTag(+convertPaiseToRupees(order.amount))}
                </strong>{" "}
                has been initiated to your original payment method.
            </p>

            <p>
                The refund should be processed within 5-7 business days,
                depending on your payment provider.
            </p>

            <p>
                We sincerely apologize for any inconvenience caused. Please try
                placing your order again with available items.
            </p>

            <p>
                If you have any questions about your refund, please don&apos;t
                hesitate to contact our support team.
            </p>
        </Layout>
    );
}

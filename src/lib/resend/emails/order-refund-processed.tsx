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

export default function OrderRefundProcessed({
    user = { name: "John Doe" },
    order = { id: "123", amount: 591826 },
}: Props) {
    return (
        <Layout
            preview="Refund processed successfully"
            heading="Refund Processed"
        >
            <p>Hi {user.name},</p>

            <p>
                Good news! Your refund of{" "}
                <strong>
                    {formatPriceTag(+convertPaiseToRupees(order.amount))}
                </strong>{" "}
                for order <strong>{order.id}</strong> has been successfully
                processed.
            </p>

            <p>Thank you for your patience and understanding.</p>
        </Layout>
    );
}

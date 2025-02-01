import { siteConfig } from "@/config/site";
import {
    convertPaiseToRupees,
    formatPriceTag,
    getAbsoluteURL,
} from "@/lib/utils";
import { Button, Column, Link, Row } from "@react-email/components";
import Layout from "./layout";

interface Props {
    user: {
        name: string;
    };
    order: {
        id: string;
        shipmentId: string;
        awb: string;
        amount: number;
        items: {
            title: string;
            slug: string;
            quantity: number;
            price: number;
        }[];
    };
}

export default function OrderDelivered({
    user = { name: "John Doe" },
    order = {
        id: "123",
        shipmentId: "456",
        awb: "789",
        amount: 591826,
        items: [
            {
                title: "Unisex Graphic Printed Cotton Activchill Regular T-shirt",
                slug: "unisex-graphic-printed-cotton-activchill-regular-t-shirt",
                quantity: 1,
                price: 199900,
            },
            {
                title: "Tartan Checks Spread Collar Long Sleeves Slim Fit Cotton Casual Shirt",
                slug: "tartan-checks-spread-collar-long-sleeves-slim-fit-cotton-casual-shirt",
                quantity: 2,
                price: 195963,
            },
        ],
    },
}: Props) {
    return (
        <Layout
            preview="Your order has been delivered"
            heading="Order Delivered"
        >
            <p>Hi {user.name},</p>

            <p>Great news! Your order has been delivered successfully.</p>

            <ul className="list-none pl-0">
                <li className="mb-2">
                    <Row>
                        <Column>
                            <strong>Sl.</strong>
                        </Column>
                        <Column>
                            <strong>Item</strong>
                        </Column>
                        <Column className="text-center">
                            <strong>Quantity</strong>
                        </Column>
                        <Column className="text-end">
                            <strong>Price</strong>
                        </Column>
                    </Row>
                </li>

                {order.items.map((item, i) => (
                    <li key={i}>
                        <Row className="mb-2">
                            <Column>{i + 1}.</Column>
                            <Column className="max-w-12">
                                <Link
                                    href={getAbsoluteURL(
                                        `/products/${item.slug}`
                                    )}
                                    className="text-brand underline"
                                >
                                    {item.title}
                                </Link>
                            </Column>
                            <Column className="text-center">
                                x{item.quantity}
                            </Column>
                            <Column className="text-end">
                                {formatPriceTag(
                                    +convertPaiseToRupees(item.price),
                                    true
                                )}
                            </Column>
                        </Row>
                    </li>
                ))}
            </ul>

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
                    View Order Details
                </Button>
            </div>

            <p className="mb-0">
                <strong>Order ID:</strong> {order.id}
            </p>

            <p className="my-0">
                <strong>Shipment ID:</strong> {order.shipmentId}
            </p>

            <p className="my-0">
                <strong>Total Amount:</strong>{" "}
                {formatPriceTag(+convertPaiseToRupees(order.amount))}
            </p>

            <p className="my-0">
                <strong>Tracking ID:</strong> {order.awb}
            </p>

            <p className="mt-6">
                Thank you for shopping with {siteConfig.name}!
            </p>
        </Layout>
    );
}

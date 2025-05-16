import { siteConfig } from "@/config/site";
import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { Column, Row } from "@react-email/components";
import Layout from "./layout";

interface Props {
    brand: {
        name: string;
    };
    order: {
        id: string;
        date: string;
        customerName: string;
        shippingAddress: {
            street: string;
            city: string;
            state: string;
            zip: string;
            country: string;
        };
        items: {
            title: string;
            quantity: number;
            price: number;
        }[];
    };
}

export default function BrandOrderNotification({
    brand = {
        name: "Brand Name",
    },
    order = {
        id: "12345",
        date: "May 17, 2025",
        customerName: "John Doe",
        shippingAddress: {
            street: "123 Main Street, Apt 4B",
            city: "New York",
            state: "NY",
            zip: "10001",
            country: "United States",
        },
        items: [
            {
                title: "Premium T-Shirt",
                quantity: 2,
                price: 250000,
            },
            {
                title: "Eco Tote Bag",
                quantity: 1,
                price: 150000,
            },
        ],
    },
}: Props) {
    return (
        <Layout preview="New order received" heading="New Order Received">
            <p>Hi {brand.name} Team,</p>

            <p>
            We’re pleased to inform you that a new order has been placed for your product on Renivet.
            Please find the order details below:
            </p>

            <h3 style={{ marginTop: "1.5rem" }}>🛒 Order Summary</h3>
            <p className="mb-0">
                <strong>Order ID:</strong> #{order.id}
            </p>
            <p className="my-0">
                <strong>Order Date:</strong> {order.date}
            </p>
            <p className="my-0">
                <strong>Customer Name:</strong> {order.customerName}
            </p>
            <p className="my-0">
                <strong>Shipping Address:</strong>
                <br />
                {order.shippingAddress.street}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
                <br />
                {order.shippingAddress.country}
            </p>

            <h3 style={{ marginTop: "1.5rem" }}>
                📦 Items Ordered from Your Brand
            </h3>
            <ul className="list-none pl-0">
                <li className="mb-2">
                    <Row>
                        <Column>
                            <strong>Product Name</strong>
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
                            <Column>{item.title}</Column>
                            <Column className="text-center">
                                {item.quantity}
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

            <p>
                ✅ Next Steps
                Please log in to your brand dashboard to review the order details and initiate the dispatch process.
                You may select your preferred courier partner and schedule the pickup directly from the Orders tab.
            </p>
            <p>
                🔗 Access Orders Dashboard »
                We kindly request that the order be processed according to the norms, using the official Renivet packaging to ensure consistency and a high-quality customer experience.
                Should you require any assistance, feel free to reach out to our team at support@renivet.com. We are here to support you at every step.
                </p>
                <p>
                Thank you for your continued partnership. Together, we are creating a more transparent and sustainable future for fashion.
                </p>

        </Layout>
    );
}
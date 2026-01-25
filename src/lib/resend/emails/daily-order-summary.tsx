import { siteConfig } from "@/config/site";
import {
    convertPaiseToRupees,
    formatPriceTag,
    getAbsoluteURL,
} from "@/lib/utils";
import { Button, Column, Link, Row, Section } from "@react-email/components";
import { format } from "date-fns";
import Layout from "./layout";

interface OrderSummaryItem {
    id: string;
    user?: {
        firstName: string;
        lastName?: string | null;
    };
    status: string;
    totalAmount: number;
    createdAt: Date;
}

interface Props {
    dateRange: {
        start: Date;
        end: Date;
    };
    statistics: {
        total: number;
        ready_to_pickup: number;
        pickup_scheduled: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        rto: number;
    };
    orders: OrderSummaryItem[];
}

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

export default function DailyOrderSummary({
    dateRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
    },
    statistics = {
        total: 15,
        ready_to_pickup: 3,
        pickup_scheduled: 2,
        shipped: 5,
        delivered: 4,
        cancelled: 1,
        rto: 0,
    },
    orders = [
        {
            id: "ORD-2024-001",
            user: { firstName: "John", lastName: "Doe" },
            status: "delivered",
            totalAmount: 299900,
            createdAt: new Date(),
        },
        {
            id: "ORD-2024-002",
            user: { firstName: "Jane", lastName: "Smith" },
            status: "processing",
            totalAmount: 199900,
            createdAt: new Date(),
        },
        {
            id: "ORD-2024-003",
            user: { firstName: "Mike", lastName: "Johnson" },
            status: "pending",
            totalAmount: 399900,
            createdAt: new Date(),
        },
    ],
}: Props) {
    const formatDate = (date: Date) => {
        return format(date, "MMM dd, yyyy h:mm a");
    };

    return (
        <Layout
            preview="Daily Order Summary Report"
            heading="Daily Order Summary"
        >
            <p>
                <strong>Report Period:</strong> {formatDate(dateRange.start)} -{" "}
                {formatDate(dateRange.end)}
            </p>

            {/* Statistics Card */}
            <Section
                style={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "8px",
                    padding: "20px",
                    marginTop: "20px",
                    marginBottom: "30px",
                }}
            >
                <h2
                    style={{
                        margin: "0 0 15px 0",
                        fontSize: "18px",
                        color: "#2d3121",
                    }}
                >
                    📊 Order Statistics
                </h2>

                <Row style={{ marginBottom: "10px" }}>
                    <Column style={{ width: "50%" }}>
                        <strong>Total Orders:</strong>
                    </Column>
                    <Column style={{ width: "50%", textAlign: "right" }}>
                        {statistics.total}
                    </Column>
                </Row>

                <Row style={{ marginBottom: "10px" }}>
                    <Column style={{ width: "50%" }}>Ready to Pickup:</Column>
                    <Column style={{ width: "50%", textAlign: "right" }}>
                        {statistics.ready_to_pickup}
                    </Column>
                </Row>

                <Row style={{ marginBottom: "10px" }}>
                    <Column style={{ width: "50%" }}>Pickup Scheduled:</Column>
                    <Column style={{ width: "50%", textAlign: "right" }}>
                        {statistics.pickup_scheduled}
                    </Column>
                </Row>

                <Row style={{ marginBottom: "10px" }}>
                    <Column style={{ width: "50%" }}>Shipped:</Column>
                    <Column style={{ width: "50%", textAlign: "right" }}>
                        {statistics.shipped}
                    </Column>
                </Row>

                <Row style={{ marginBottom: "10px" }}>
                    <Column style={{ width: "50%" }}>Delivered:</Column>
                    <Column style={{ width: "50%", textAlign: "right" }}>
                        {statistics.delivered}
                    </Column>
                </Row>

                <Row style={{ marginBottom: "10px" }}>
                    <Column style={{ width: "50%" }}>Cancelled:</Column>
                    <Column style={{ width: "50%", textAlign: "right" }}>
                        {statistics.cancelled}
                    </Column>
                </Row>

                <Row>
                    <Column style={{ width: "50%" }}>RTO:</Column>
                    <Column style={{ width: "50%", textAlign: "right" }}>
                        {statistics.rto}
                    </Column>
                </Row>
            </Section>

            {/* Orders Table */}
            <h2 style={{ fontSize: "18px", marginBottom: "15px" }}>
                📦 Order Details
            </h2>

            {orders.length === 0 ? (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                    No orders were placed during this period.
                </p>
            ) : (
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "14px",
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                backgroundColor: "#2d3121",
                                color: "white",
                            }}
                        >
                            <th
                                style={{
                                    padding: "10px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                }}
                            >
                                Order ID
                            </th>
                            <th
                                style={{
                                    padding: "10px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                }}
                            >
                                Customer
                            </th>
                            <th
                                style={{
                                    padding: "10px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                }}
                            >
                                Status
                            </th>
                            <th
                                style={{
                                    padding: "10px",
                                    textAlign: "right",
                                    borderBottom: "2px solid #ddd",
                                }}
                            >
                                Amount
                            </th>
                            <th
                                style={{
                                    padding: "10px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                }}
                            >
                                Created
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, index) => (
                            <tr
                                key={order.id}
                                style={{
                                    backgroundColor:
                                        index % 2 === 0 ? "#ffffff" : "#f9f9f9",
                                }}
                            >
                                <td
                                    style={{
                                        padding: "10px",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    <Link
                                        href={getAbsoluteURL(
                                            `/dashboard/general/orders?search=${order.id}`
                                        )}
                                        style={{
                                            color: "#2d3121",
                                            textDecoration: "underline",
                                        }}
                                    >
                                        {order.id}
                                    </Link>
                                </td>
                                <td
                                    style={{
                                        padding: "10px",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    {order.user
                                        ? `${order.user.firstName} ${order.user.lastName || ""}`
                                        : "N/A"}
                                </td>
                                <td
                                    style={{
                                        padding: "10px",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    <span
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            backgroundColor:
                                                order.status === "delivered"
                                                    ? "#d4edda"
                                                    : order.status ===
                                                        "cancelled"
                                                      ? "#f8d7da"
                                                      : order.status ===
                                                          "processing"
                                                        ? "#fff3cd"
                                                        : "#d1ecf1",
                                            color:
                                                order.status === "delivered"
                                                    ? "#155724"
                                                    : order.status ===
                                                        "cancelled"
                                                      ? "#721c24"
                                                      : order.status ===
                                                          "processing"
                                                        ? "#856404"
                                                        : "#0c5460",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {STATUS_LABELS[order.status] ||
                                            order.status}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        padding: "10px",
                                        borderBottom: "1px solid #eee",
                                        textAlign: "right",
                                    }}
                                >
                                    {formatPriceTag(
                                        +convertPaiseToRupees(
                                            order.totalAmount
                                        ),
                                        true
                                    )}
                                </td>
                                <td
                                    style={{
                                        padding: "10px",
                                        borderBottom: "1px solid #eee",
                                        fontSize: "12px",
                                        color: "#666",
                                    }}
                                >
                                    {formatDate(order.createdAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div style={{ marginTop: "30px", textAlign: "center" }}>
                <Button
                    href={getAbsoluteURL("/dashboard/general/orders")}
                    style={{
                        backgroundColor: "#2d3121",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "6px",
                        textDecoration: "none",
                        display: "inline-block",
                    }}
                >
                    View All Orders in Dashboard
                </Button>
            </div>

            <p style={{ marginTop: "30px", color: "#666", fontSize: "14px" }}>
                This is an automated daily summary. For any questions or
                concerns, please contact the support team.
            </p>
        </Layout>
    );
}

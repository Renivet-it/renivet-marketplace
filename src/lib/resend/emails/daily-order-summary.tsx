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
    shipmentStatus?: string;
    isPickupScheduled?: boolean;
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

// Function to get detailed status based on order and shipment data
const getDetailedStatus = (
    order: OrderSummaryItem
): { label: string; category: string } => {
    // Handle delivered and cancelled first
    if (order.status === "delivered")
        return { label: "Delivered", category: "delivered" };
    if (order.status === "cancelled")
        return { label: "Cancelled", category: "cancelled" };

    // Handle pending orders
    if (order.status === "pending") {
        if (order.isPickupScheduled && order.shipmentStatus === "pending") {
            return { label: "Pickup Scheduled", category: "pickup_scheduled" };
        }
        return { label: "Ready to Pickup", category: "ready_to_pickup" };
    }

    // Handle processing orders - NEVER show "Processing", always show specific status
    if (order.status === "processing") {
        // Check shipment status for more granular classification
        if (order.shipmentStatus === "pending") {
            // If shipment is pending, check if pickup is scheduled
            if (order.isPickupScheduled) {
                return {
                    label: "Pickup Scheduled",
                    category: "pickup_scheduled",
                };
            }
            return { label: "Ready to Pickup", category: "ready_to_pickup" };
        }

        // Any other shipment status means it's shipped
        if (
            order.shipmentStatus === "in_transit" ||
            order.shipmentStatus === "out_for_delivery"
        ) {
            return { label: "Shipped", category: "shipped" };
        }

        if (order.shipmentStatus && order.shipmentStatus !== "pending") {
            return { label: "Shipped", category: "shipped" };
        }

        // Fallback for processing without shipment data
        return { label: "Ready to Pickup", category: "ready_to_pickup" };
    }

    // Fallback
    return {
        label: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        category: order.status,
    };
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
                                    {(() => {
                                        const statusInfo =
                                            getDetailedStatus(order);
                                        const colors = {
                                            delivered: {
                                                bg: "#d4edda",
                                                text: "#155724",
                                            },
                                            cancelled: {
                                                bg: "#f8d7da",
                                                text: "#721c24",
                                            },
                                            shipped: {
                                                bg: "#cfe2ff",
                                                text: "#084298",
                                            },
                                            pickup_scheduled: {
                                                bg: "#fff3cd",
                                                text: "#856404",
                                            },
                                            ready_to_pickup: {
                                                bg: "#fff3cd",
                                                text: "#856404",
                                            },
                                            processing: {
                                                bg: "#e2e3e5",
                                                text: "#41464b",
                                            },
                                        };
                                        const color = colors[
                                            statusInfo.category as keyof typeof colors
                                        ] || { bg: "#d1ecf1", text: "#0c5460" };

                                        return (
                                            <div>
                                                <span
                                                    style={{
                                                        padding: "6px 10px",
                                                        borderRadius: "4px",
                                                        backgroundColor:
                                                            color.bg,
                                                        color: color.text,
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {statusInfo.label}
                                                </span>
                                                {order.shipmentStatus && (
                                                    <div
                                                        style={{
                                                            fontSize: "10px",
                                                            color: "#666",
                                                            marginTop: "4px",
                                                            fontStyle: "italic",
                                                        }}
                                                    >
                                                        Shipment:{" "}
                                                        {order.shipmentStatus
                                                            .replace(/_/g, " ")
                                                            .replace(
                                                                /\b\w/g,
                                                                (l) =>
                                                                    l.toUpperCase()
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
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

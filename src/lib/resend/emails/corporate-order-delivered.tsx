import { Text } from "@react-email/components";
import { formatINR, getAbsoluteURL } from "@/lib/utils";
import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "./corporate-order-email-shell";

export default function CorporateOrderDeliveredEmail({
    order,
    confirmationHref,
    pdfHref,
}: {
    order: {
        publicOrderId: string;
        companyName: string;
        totalPaise: number;
        advancePaidPaise: number;
        balanceDuePaise: number;
        quantity: number;
    };
    confirmationHref: string;
    pdfHref: string;
}) {
    const paidInFull = order.balanceDuePaise === 0;

    return (
        <CorporateOrderEmailShell
            preview={`Corporate Order Delivered: ${order.publicOrderId}`}
            eyebrow="Corporate Order Delivery"
            title="Your Order Has Been Delivered"
            intro="We are pleased to inform you that your corporate order has been successfully delivered. Below is a summary of the fulfilled order. We hope our craftsmanship and service exceeded your expectations."
            primaryAction={{
                href: confirmationHref,
                label: "View Order Details",
            }}
            secondaryAction={{
                href: pdfHref,
                label: "Download Order Summary",
            }}
            footer={
                <Text
                    style={{
                        margin: 0,
                        fontSize: "12px",
                        lineHeight: "20px",
                        color: "#475569",
                        textAlign: "center" as const,
                    }}
                >
                    Access your corporate orders history anytime at{" "}
                    <a
                        href={getAbsoluteURL("/corporate-orders")}
                        style={{ color: "#2d3121", textDecoration: "underline" }}
                    >
                        {getAbsoluteURL("/corporate-orders")}
                    </a>
                </Text>
            }
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company Name", value: order.companyName },
                    { label: "Total Quantity", value: `${order.quantity} units` },
                    { label: "Final Value", value: formatINR(order.totalPaise) },
                ]}
            />

            <EmailDetailCard
                title="Delivery & Fulfillment Status"
                rows={[
                    { label: "Fulfillment Stage", value: "Delivered & Completed" },
                    {
                        label: "Payment Status",
                        value: paidInFull ? "Paid in Full" : "Outstanding Balance Pending",
                    },
                    {
                        label: "Total Amount Settled",
                        value: formatINR(order.advancePaidPaise + (paidInFull ? order.balanceDuePaise : 0)),
                    },
                ]}
            />

            <EmailNote>
                If you have any feedback regarding the size fitting, print quality, or overall service, please let us know. We look forward to partnering with you on your future corporate merchandise needs.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

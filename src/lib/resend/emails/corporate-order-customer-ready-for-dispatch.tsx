import { Text } from "@react-email/components";
import { formatINR, getAbsoluteURL } from "@/lib/utils";
import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "./corporate-order-email-shell";

export default function CorporateOrderCustomerReadyForDispatchEmail({
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
    return (
        <CorporateOrderEmailShell
            preview={`Corporate Order Ready for Dispatch: ${order.publicOrderId}`}
            eyebrow="Corporate Dispatch Update"
            title="Your Order is Ready for Dispatch"
            intro="We are pleased to inform you that production for your corporate order is now complete and has been marked as ready for dispatch. Below is the final status and billing summary of your order. Once all dispatch logistics are processed, we will coordinate delivery and send you tracking information."
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
                    Track your corporate order anytime at{" "}
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
                    { label: "Order Value", value: formatINR(order.totalPaise) },
                ]}
            />

            <EmailDetailCard
                title="Order Status & Billing Summary"
                rows={[
                    { label: "Fulfillment Stage", value: "Ready for Dispatch" },
                    {
                        label: "Amount Paid (Advance)",
                        value: formatINR(order.advancePaidPaise),
                    },
                    {
                        label: "Outstanding Balance",
                        value: formatINR(order.balanceDuePaise),
                    },
                ]}
            />

            <EmailNote>
                Note: If there is an outstanding balance due on this order, please complete the payment to prevent shipping delays. Our operations team will provide full consignment details and tracking links as soon as the shipment is dispatched.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

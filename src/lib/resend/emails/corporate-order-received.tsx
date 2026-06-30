import { Text } from "@react-email/components";
import { formatINR, getAbsoluteURL } from "@/lib/utils";
import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "./corporate-order-email-shell";

export default function CorporateOrderReceivedEmail({
    order,
    confirmationHref,
    pdfHref,
    expectedTimelineText,
}: {
    order: any;
    confirmationHref: string;
    pdfHref: string;
    expectedTimelineText: string;
}) {
    const paidInFull = order.balanceDuePaise === 0;

    return (
        <CorporateOrderEmailShell
            preview={`Corporate order received: ${order.publicOrderId}`}
            eyebrow="Renivet Corporate Atelier"
            title="Your Corporate Order Is Confirmed"
            intro="Your order has entered the Renivet managed production pipeline. We have captured your commercial summary, files, and delivery workflow for a premium fulfillment experience."
            primaryAction={{
                href: confirmationHref,
                label: "View Corporate Order",
            }}
            secondaryAction={{
                href: pdfHref,
                label: "Download Luxury Summary",
            }}
            footer={
                <Text
                    style={{
                        margin: 0,
                        fontSize: "12px",
                        lineHeight: "20px",
                        color: "#6b7280",
                    }}
                >
                    Review your live corporate workspace anytime at{" "}
                    {getAbsoluteURL("/corporate-orders")}.
                </Text>
            }
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    {
                        label: paidInFull ? "Amount Paid" : "Advance Paid",
                        value: formatINR(order.advancePaidPaise),
                    },
                    { label: "Balance Due", value: formatINR(order.balanceDuePaise) },
                    { label: "Order Value", value: formatINR(order.totalPaise) },
                ]}
            />

            <EmailDetailCard
                title="Fulfillment Snapshot"
                rows={[
                    { label: "Company", value: order.companyName },
                    { label: "Current Status", value: "Inquiry Received" },
                    { label: "Expected Timeline", value: expectedTimelineText },
                    {
                        label: "Payment Structure",
                        value: paidInFull
                            ? "100% payment completed"
                            : "Advance received, balance pending",
                    },
                ]}
            />

            <EmailNote>
                Your corporate files, garment selections, and size allocations are
                preserved inside the order summary. Our team will continue with
                review, production planning, and dispatch updates from here.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

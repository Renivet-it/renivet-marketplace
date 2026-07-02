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
            preview={`Dispatch update: ${order.publicOrderId}`}
            eyebrow="Renivet Corporate Atelier"
            title="Your Corporate Order Is Ready For Dispatch"
            intro="Production is complete and your assigned fulfillment brand has marked the order ready for dispatch. You can review the latest order status and commercial summary from your corporate workspace."
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
                    Track your managed corporate order anytime at{" "}
                    {getAbsoluteURL("/corporate-orders")}.
                </Text>
            }
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company", value: order.companyName },
                    { label: "Quantity", value: String(order.quantity) },
                    { label: "Order Value", value: formatINR(order.totalPaise) },
                ]}
            />

            <EmailDetailCard
                title="Latest Order Status"
                rows={[
                    { label: "Current Stage", value: "Ready for dispatch" },
                    {
                        label: "Advance Paid",
                        value: formatINR(order.advancePaidPaise),
                    },
                    {
                        label: "Balance Due",
                        value: formatINR(order.balanceDuePaise),
                    },
                ]}
            />

            <EmailNote>
                Your order has moved through production successfully. The admin team
                will now continue with final dispatch coordination and shipment
                updates.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

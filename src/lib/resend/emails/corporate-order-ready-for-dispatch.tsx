import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "./corporate-order-email-shell";
import { formatINR } from "@/lib/utils";

export default function CorporateOrderReadyForDispatchEmail({
    order,
    adminHref,
}: {
    order: {
        publicOrderId: string;
        companyName: string;
        quantity: number;
        totalPaise: number;
        advancePaidPaise: number;
        balanceDuePaise: number;
        status: string;
        quoteNumber?: string | null;
        brandName?: string | null;
    };
    adminHref: string;
}) {
    return (
        <CorporateOrderEmailShell
            preview={`[Internal Alert] Corporate Order Ready for Dispatch: ${order.publicOrderId}`}
            eyebrow="Brand Fulfillment Update"
            title="Corporate Order Ready for Dispatch"
            intro="The assigned brand has completed production and marked this corporate order as ready for dispatch. Please review the final details, confirm balance payment receipt, and coordinate shipment handling from the admin workspace."
            primaryAction={{
                href: adminHref,
                label: "Review & Process Order",
            }}
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company Name", value: order.companyName },
                    { label: "Quantity", value: `${order.quantity} units` },
                    { label: "Total Value", value: formatINR(order.totalPaise) },
                ]}
            />

            <EmailDetailCard
                title="Fulfillment & Brand Assignment"
                rows={[
                    { label: "Fulfillment Status", value: order.status },
                    {
                        label: "Assigned Brand",
                        value: order.brandName?.trim() || "Assigned brand",
                    },
                    {
                        label: "Linked Quote ID",
                        value: order.quoteNumber?.trim() || "N/A",
                    },
                ]}
            />

            <EmailDetailCard
                title="Billing Summary"
                rows={[
                    {
                        label: "Advance Payment Received",
                        value: formatINR(order.advancePaidPaise),
                    },
                    {
                        label: "Outstanding Balance",
                        value: formatINR(order.balanceDuePaise),
                    },
                ]}
            />

            <EmailNote>
                Note: This internal notification was generated automatically when the brand production team marked the order status as ready for dispatch in their dashboard.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

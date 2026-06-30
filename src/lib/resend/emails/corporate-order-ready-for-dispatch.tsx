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
            preview={`Ready for dispatch: ${order.publicOrderId}`}
            eyebrow="Brand Fulfillment Update"
            title="Corporate Order Ready For Dispatch"
            intro="The assigned brand has completed production and marked this corporate order as ready for dispatch. Please review the final order and continue with shipment handling from the admin workspace."
            primaryAction={{
                href: adminHref,
                label: "Review Final Order",
            }}
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company", value: order.companyName },
                    { label: "Quantity", value: String(order.quantity) },
                    { label: "Total Value", value: formatINR(order.totalPaise) },
                ]}
            />

            <EmailDetailCard
                title="Dispatch Readiness"
                rows={[
                    { label: "Workflow Status", value: order.status },
                    {
                        label: "Assigned Brand",
                        value: order.brandName?.trim() || "Assigned brand",
                    },
                    {
                        label: "Linked Quote",
                        value: order.quoteNumber?.trim() || "Linked to approved quote",
                    },
                    {
                        label: "Balance Due",
                        value: formatINR(order.balanceDuePaise),
                    },
                ]}
            />

            <EmailDetailCard
                title="Payment Snapshot"
                rows={[
                    {
                        label: "Advance Paid",
                        value: formatINR(order.advancePaidPaise),
                    },
                    {
                        label: "Outstanding Balance",
                        value: formatINR(order.balanceDuePaise),
                    },
                ]}
            />

            <EmailNote>
                This alert was triggered directly from the brand admin corporate
                orders table when the production team marked the final order as ready
                for dispatch.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

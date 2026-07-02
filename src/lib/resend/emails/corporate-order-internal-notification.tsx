import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "./corporate-order-email-shell";
import { formatINR } from "@/lib/utils";

export default function CorporateOrderInternalNotificationEmail({
    order,
    adminHref,
}: {
    order: any;
    adminHref: string;
}) {
    return (
        <CorporateOrderEmailShell
            preview={`New corporate order: ${order.publicOrderId}`}
            eyebrow="Operations Notification"
            title="New Corporate Order Routed To Operations"
            intro="A fresh corporate order has been finalized and is now ready for commercial review, fulfillment planning, and workflow ownership inside the admin console."
            primaryAction={{
                href: adminHref,
                label: "Open In Admin Workspace",
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
                title="Commercial Details"
                rows={[
                    { label: "Contact Person", value: order.contactPersonName },
                    { label: "Email", value: order.emailAddress },
                    { label: "Advance Paid", value: formatINR(order.advancePaidPaise) },
                    { label: "Balance Due", value: formatINR(order.balanceDuePaise) },
                ]}
            />

            <EmailDetailCard
                title="Files Received"
                rows={[
                    {
                        label: "Artwork File",
                        value: String((order.artworkFile as any)?.url ?? "Not available"),
                    },
                    {
                        label: "Employee Size Sheet",
                        value: String(
                            (order.employeeSheetFile as any)?.url ?? "Not available"
                        ),
                    },
                ]}
            />

            <EmailNote>
                This order should now be visible in the corporate operations queue,
                payment tracking, and the assigned brand workspace if the quote linkage
                is present.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

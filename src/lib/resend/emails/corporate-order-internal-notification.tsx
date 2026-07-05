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
            preview={`[Internal Alert] New Corporate Order: ${order.publicOrderId}`}
            eyebrow="Operations Notification"
            title="New Corporate Order Finalized"
            intro="A new corporate order has been finalized by the customer. It is now queued for commercial review, production assignment, and fulfillment tracking within the admin dashboard."
            primaryAction={{
                href: adminHref,
                label: "Open Admin Workspace",
            }}
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company", value: order.companyName },
                    { label: "Quantity", value: `${order.quantity} units` },
                    { label: "Total Value", value: formatINR(order.totalPaise) },
                ]}
            />

            <EmailDetailCard
                title="Client & Billing Details"
                rows={[
                    { label: "Contact Name", value: order.contactPersonName },
                    { label: "Email Address", value: order.emailAddress },
                    { label: "Advance Payment", value: formatINR(order.advancePaidPaise) },
                    { label: "Remaining Balance", value: formatINR(order.balanceDuePaise) },
                ]}
            />

            <EmailDetailCard
                title="Uploaded Documents"
                rows={[
                    {
                        label: "Artwork File (URL)",
                        value: String((order.artworkFile as any)?.url ?? "No document uploaded"),
                    },
                    {
                        label: "Employee Size Sheet (URL)",
                        value: String((order.employeeSheetFile as any)?.url ?? "No document uploaded"),
                    },
                ]}
            />

            <EmailNote>
                Action Required: Please review the customer's design assets, size sheet, and verify payment receipt. Once validated, assign the production workload to the appropriate brand partner.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

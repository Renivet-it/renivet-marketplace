import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "./corporate-order-email-shell";
import { formatINR } from "@/lib/utils";

export default function CorporateOrderBalanceReminderEmail({
    order,
    paymentHref,
}: {
    order: any;
    paymentHref: string;
}) {
    return (
        <CorporateOrderEmailShell
            preview={`Balance Payment Reminder: ${order.publicOrderId}`}
            eyebrow="Payment Reminder"
            title="Outstanding Balance Payment Due"
            intro="Your corporate order is currently progressing through our production pipeline. To prevent any delays with fulfillment and subsequent dispatch milestones, please review the outstanding balance details below and complete the payment using our secure link."
            primaryAction={{
                href: paymentHref,
                label: "Pay Outstanding Balance",
            }}
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company Name", value: order.companyName },
                    { label: "Amount Paid (Advance)", value: formatINR(order.advancePaidPaise) },
                    { label: "Balance Due (Outstanding)", value: formatINR(order.balanceDuePaise) },
                ]}
            />

            <EmailDetailCard
                title="Billing Summary"
                rows={[
                    { label: "Total Order Value", value: formatINR(order.totalPaise) },
                    { label: "Payment Status", value: "Awaiting Balance Payment" },
                    {
                        label: "Advance Payment Reference",
                        value: order.paymentReference || "N/A",
                    },
                ]}
            />

            <EmailNote>
                Note: If your finance department has already initiated the payment transfer, please ignore this message. Once the transaction is cleared, your order status will automatically update and we will begin processing dispatch preparation.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

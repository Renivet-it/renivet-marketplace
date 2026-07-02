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
            preview={`Balance payment reminder for ${order.publicOrderId}`}
            eyebrow="Payment Concierge"
            title="Your Remaining Corporate Balance Is Ready"
            intro="Your order is progressing through the managed corporate pipeline. To keep production and dispatch milestones moving smoothly, please complete the remaining balance payment from the secure payment link below."
            primaryAction={{
                href: paymentHref,
                label: "Pay Remaining Balance",
            }}
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company", value: order.companyName },
                    { label: "Already Paid", value: formatINR(order.advancePaidPaise) },
                    { label: "Balance Due", value: formatINR(order.balanceDuePaise) },
                ]}
            />

            <EmailDetailCard
                title="Payment Summary"
                rows={[
                    { label: "Total Order Value", value: formatINR(order.totalPaise) },
                    { label: "Current Order Status", value: "Awaiting balance payment" },
                    {
                        label: "Payment Reference",
                        value: order.paymentReference || "Will be updated after payment",
                    },
                ]}
            />

            <EmailNote>
                If your finance team has already completed the balance payment, you may
                ignore this reminder. Otherwise, completing payment now will help avoid
                delays in downstream production and dispatch milestones.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

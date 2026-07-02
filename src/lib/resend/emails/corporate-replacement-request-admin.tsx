import {
    CorporateOrderEmailShell,
    EmailDetailCard,
    EmailMetricGrid,
    EmailNote,
} from "./corporate-order-email-shell";

export default function CorporateReplacementRequestAdminEmail({
    order,
    request,
    queueHref,
    orderHref,
}: {
    order: {
        publicOrderId: string;
        companyName: string;
        contactPersonName: string;
        emailAddress: string;
    };
    request: {
        requestedQuantity: number;
        reasonLabel: string;
        reasonDetails?: string | null;
    };
    queueHref: string;
    orderHref: string;
}) {
    return (
        <CorporateOrderEmailShell
            preview={`Replacement request raised for ${order.publicOrderId}`}
            eyebrow="Corporate Replacement Desk"
            title="A New Replacement Request Needs Review"
            intro="A corporate customer has raised a replacement request. Please review the issue details, inspect the uploaded evidence, and decide whether the replacement order should move into fulfillment."
            primaryAction={{
                href: queueHref,
                label: "Open Replacement Queue",
            }}
            secondaryAction={{
                href: orderHref,
                label: "Open Source Order",
            }}
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company", value: order.companyName },
                    {
                        label: "Requested Quantity",
                        value: `${request.requestedQuantity} unit(s)`,
                    },
                    { label: "Issue Type", value: request.reasonLabel },
                ]}
            />

            <EmailDetailCard
                title="Customer Contact"
                rows={[
                    { label: "Contact Person", value: order.contactPersonName },
                    { label: "Email", value: order.emailAddress },
                ]}
            />

            <EmailDetailCard
                title="Replacement Notes"
                rows={[
                    {
                        label: "Customer Message",
                        value:
                            request.reasonDetails?.trim() ||
                            "No additional notes were provided by the customer.",
                    },
                ]}
            />

            <EmailNote>
                Review this request quickly so the team can either approve the
                replacement and generate the new fulfillment order, or respond
                back with the correct next step.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

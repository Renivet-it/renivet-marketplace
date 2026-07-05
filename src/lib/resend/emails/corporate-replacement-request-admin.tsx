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
            preview={`[Internal Alert] Replacement Request: ${order.publicOrderId}`}
            eyebrow="Corporate Replacement Desk"
            title="Replacement Request Submitted"
            intro="A corporate customer has submitted a request for replacement items. Please inspect the details, verify the uploaded evidence and photos, and process the request in the admin replacement queue."
            primaryAction={{
                href: queueHref,
                label: "Open Replacement Queue",
            }}
            secondaryAction={{
                href: orderHref,
                label: "View Source Order",
            }}
        >
            <EmailMetricGrid
                items={[
                    { label: "Order ID", value: order.publicOrderId },
                    { label: "Company Name", value: order.companyName },
                    {
                        label: "Requested Quantity",
                        value: `${request.requestedQuantity} units`,
                    },
                    { label: "Reason Code", value: request.reasonLabel },
                ]}
            />

            <EmailDetailCard
                title="Client Contact Information"
                rows={[
                    { label: "Contact Name", value: order.contactPersonName },
                    { label: "Email Address", value: order.emailAddress },
                ]}
            />

            <EmailDetailCard
                title="Customer Comments"
                rows={[
                    {
                        label: "Comments / Message",
                        value:
                            request.reasonDetails?.trim() ||
                            "No additional notes were provided by the customer.",
                    },
                ]}
            />

            <EmailNote>
                Action Required: Please review the submission in the admin dashboard promptly. Approved replacement requests will trigger a new zero-value fulfillment order for the brand partner.
            </EmailNote>
        </CorporateOrderEmailShell>
    );
}

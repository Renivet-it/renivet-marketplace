const rewearPickupRequestsHref = "/dashboard/general/rewear-requests";

export function buildRewearPickupAdminNotification(
    request: {
        id: string;
        fullName: string;
        mobileNumber: string;
        locality: string;
        garmentCount: string;
        contactMethod: string;
        categoryNote: string | null;
    }
) {
    return {
        type: "rewear_pickup_request",
        title: "New ReWear pickup request",
        body: `${request.fullName} submitted a pickup request.`,
        href: rewearPickupRequestsHref,
        emailSubject: `New ReWear pickup request: ${request.fullName}`,
        emailIntro: `A new ReWear pickup request has been submitted. Please review the details below and contact ${request.fullName} to coordinate collection.`,
        emailDetails: [
            `Customer: ${request.fullName}`,
            `Phone number: ${request.mobileNumber}`,
            `Pickup area: ${request.locality}`,
            `Approximate garment count: ${request.garmentCount}`,
            `Preferred contact method: ${request.contactMethod}`,
            `Clothing notes: ${request.categoryNote || "No additional notes"}`,
        ],
        emailActionLabel: "Review pickup request",
        emailEyebrow: "REWEAR PICKUP REQUEST",
        emailDetailsHeading: "Customer details",
        emailFooterNote:
            "Please use the customer's preferred contact method to arrange collection.",
        metadata: { requestId: request.id },
    };
}

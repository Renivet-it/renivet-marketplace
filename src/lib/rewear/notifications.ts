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
        emailSubject: `A new ReWear pickup request from ${request.fullName}`,
        emailIntro: `${request.fullName} has asked us to collect some garments. Here are the details to help you follow up and arrange the pickup.`,
        emailDetails: [
            `Customer: ${request.fullName}`,
            `Phone number: ${request.mobileNumber}`,
            `Pickup area: ${request.locality}`,
            `Approximate garment count: ${request.garmentCount}`,
            `Preferred contact method: ${request.contactMethod}`,
            `Clothing notes: ${request.categoryNote || "No additional notes"}`,
        ],
        emailActionLabel: "Review pickup request",
        emailEyebrow: "REWEAR PICKUP",
        emailDetailsHeading: "Customer details",
        emailFooterNote:
            "Thanks for helping give these garments a second life.",
        metadata: { requestId: request.id },
    };
}

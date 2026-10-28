import { expect, test } from "bun:test";
import { buildRewearPickupAdminNotification } from "./notifications";

test("builds an admin notification that links to the pickup request page", () => {
    expect(
        buildRewearPickupAdminNotification({
            id: "pickup-123",
            fullName: "Ayan Khan",
            mobileNumber: "+91 9876543210",
            locality: "Indiranagar - 560038",
            garmentCount: "6-10 garments",
            contactMethod: "WhatsApp",
            categoryNote: "Mostly shirts and trousers",
        })
    ).toEqual({
        type: "rewear_pickup_request",
        title: "New ReWear pickup request",
        body: "Ayan Khan submitted a pickup request.",
        href: "/dashboard/general/rewear-requests",
        emailSubject: "New ReWear pickup request: Ayan Khan",
        emailIntro:
            "A new ReWear pickup request has been submitted. Please review the details below and contact Ayan Khan to coordinate collection.",
        emailDetails: [
            "Customer: Ayan Khan",
            "Phone number: +91 9876543210",
            "Pickup area: Indiranagar - 560038",
            "Approximate garment count: 6-10 garments",
            "Preferred contact method: WhatsApp",
            "Clothing notes: Mostly shirts and trousers",
        ],
        emailActionLabel: "Review pickup request",
        emailEyebrow: "REWEAR PICKUP REQUEST",
        emailDetailsHeading: "Customer details",
        emailFooterNote:
            "Please use the customer's preferred contact method to arrange collection.",
        metadata: { requestId: "pickup-123" },
    });

    const notification = buildRewearPickupAdminNotification({
        id: "pickup-123",
        fullName: "Ayan Khan",
        mobileNumber: "+91 9876543210",
        locality: "Indiranagar - 560038",
        garmentCount: "6-10 garments",
        contactMethod: "WhatsApp",
        categoryNote: "Mostly shirts and trousers",
    });
    expect(
        [notification.emailSubject, notification.emailIntro, ...notification.emailDetails].join(" ")
    ).not.toContain("pickup-123");
    expect(notification.metadata).toEqual({ requestId: "pickup-123" });
});

test("uses an explicit fallback when a pickup request has no optional note", () => {
    const notification = buildRewearPickupAdminNotification({
        id: "pickup-124",
        fullName: "Ayan Khan",
        mobileNumber: "+91 9876543210",
        locality: "Indiranagar - 560038",
        garmentCount: "6-10 garments",
        contactMethod: "Phone call",
        categoryNote: null,
    });

    expect(notification.emailDetails.at(-1)).toBe(
        "Clothing notes: No additional notes"
    );
});

import { expect, test } from "bun:test";
import {
    createRewearPickupRequestSchema,
} from "@/lib/validations/rewear";

test("accepts a complete Rewear pickup request", () => {
    const result = createRewearPickupRequestSchema.safeParse({
        fullName: "Ayan Khan",
        mobileNumber: "+91 9876543210",
        locality: "Indiranagar - 560038",
        garmentCount: "6-10 garments",
        contactMethod: "WhatsApp",
        categoryNote: "Mostly shirts and trousers",
        consent: true,
    });

    expect(result.success).toBe(true);
});

test("rejects a pickup request without valid contact details or consent", () => {
    const result = createRewearPickupRequestSchema.safeParse({
        fullName: "",
        mobileNumber: "123",
        locality: "Indiranagar",
        garmentCount: "6-10 garments",
        contactMethod: "WhatsApp",
        consent: false,
    });

    expect(result.success).toBe(false);
});

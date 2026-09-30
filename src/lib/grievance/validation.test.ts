import { describe, expect, test } from "bun:test";
import {
    grievanceSubmissionSchema,
    normalizeIndianGrievancePhone,
    normalizeGrievanceSubmission,
} from "./validation";

describe("grievance identity validation", () => {
    test("normalizes Indian phone formats to ten digits", () => {
        expect(normalizeIndianGrievancePhone("+91 98765-43210")).toBe("9876543210");
        expect(normalizeIndianGrievancePhone("91 9876543210")).toBe("9876543210");
        expect(normalizeIndianGrievancePhone("09876543210")).toBe("9876543210");
    });

    test("rejects non-Indian or malformed phone numbers", () => {
        expect(() => normalizeIndianGrievancePhone("1234567890")).toThrow(
            "Enter a valid 10-digit Indian phone number."
        );
        expect(() => normalizeIndianGrievancePhone("+14155552671")).toThrow(
            "Enter a valid 10-digit Indian phone number."
        );
    });

    test("normalizes email and preserves existing grievance fields", () => {
        const result = normalizeGrievanceSubmission({
            name: "  Ayan Ganguly ",
            phone: "+91 98765 43210",
            email: "  AYAN@GMAIL.COM ",
            orderId: "ORDER-1",
            category: "order_issue",
            description: "The delivered item is damaged.",
            accountCreationConsent: false,
        });

        expect(result).toMatchObject({
            name: "Ayan Ganguly",
            phone: "9876543210",
            email: "ayan@gmail.com",
            orderId: "ORDER-1",
            accountCreationConsent: false,
        });
    });

    test("reports field-level email and phone errors", () => {
        const parsed = grievanceSubmissionSchema.safeParse({
            name: "Ayan",
            phone: "123",
            email: "not-an-email",
            category: "order_issue",
            description: "A sufficiently long grievance description.",
            accountCreationConsent: false,
        });

        expect(parsed.success).toBe(false);
        if (parsed.success) return;

        expect(parsed.error.flatten().fieldErrors.phone).toContain(
            "Enter a valid 10-digit Indian phone number."
        );
        expect(parsed.error.flatten().fieldErrors.email).toContain(
            "Enter a valid email address."
        );
    });

    test("rejects placeholder email domains", () => {
        const parsed = grievanceSubmissionSchema.safeParse({
            name: "Ayan",
            phone: "9876543210",
            email: "AYAN@TEST.COM",
            category: "order_issue",
            description: "A sufficiently long grievance description.",
            accountCreationConsent: false,
        });

        expect(parsed.success).toBe(false);
        if (parsed.success) return;

        expect(parsed.error.flatten().fieldErrors.email).toContain(
            "Enter an email address with a valid domain."
        );
    });
});

import {
    assertBrandInvoiceReviewTransition,
    buildFulfillmentTaxSnapshot,
    validateBrandTaxInvoice,
} from "@/lib/finance/corporate-brand-invoice-validation";
import { describe, expect, test } from "bun:test";

const expected = {
    foReference: "FO-2627-0001",
    quantity: 100,
    unitRatePaise: 45000,
    taxableValuePaise: 4_500_000,
    gstRateBps: 500,
    cgstPaise: 112_500,
    sgstPaise: 112_500,
    igstPaise: 0,
    totalAmountPaise: 4_725_000,
    supplierGstin: "29AASCM3828R1ZB",
    recipientGstin: "29AANCR5687A1ZG",
    hsnCode: "61099010",
};

describe("REN-182 brand tax invoice enforcement", () => {
    test("snapshots intra-state FO tax deterministically in paise", () => {
        expect(
            buildFulfillmentTaxSnapshot({
                foReference: " FO-2627-0001 ",
                quantity: 100,
                unitRatePaise: 45000,
                gstRateBps: 500,
                supplierGstin: "29aascm3828r1zb",
                recipientGstin: "29aancr5687a1zg",
                hsnCode: "6109 9010",
            })
        ).toEqual(expected);
    });

    test("uses IGST for inter-state supply and rounds GST once", () => {
        expect(
            buildFulfillmentTaxSnapshot({
                foReference: "FO-1",
                quantity: 3,
                unitRatePaise: 101,
                gstRateBps: 500,
                supplierGstin: "27AASCM3828R1ZB",
                recipientGstin: "29AANCR5687A1ZG",
                hsnCode: "6109",
            })
        ).toMatchObject({
            taxableValuePaise: 303,
            cgstPaise: 0,
            sgstPaise: 0,
            igstPaise: 15,
            totalAmountPaise: 318,
        });
    });

    test("holds a mismatch and reports every failed material check", () => {
        const result = validateBrandTaxInvoice(expected, {
            ...expected,
            supplierGstin: "27AASCM3828R1ZB",
            quantity: 99,
            totalAmountPaise: 1,
        });

        expect(result.status).toBe("held");
        expect(result.issues).toEqual([
            "Supplier GSTIN does not match the Fulfillment Order snapshot",
            "Quantity does not match the Fulfillment Order",
            "Invoice total does not match the Fulfillment Order",
            "Taxable value plus GST does not equal total",
        ]);
    });

    test("accepts a fully matching structured invoice", () => {
        expect(validateBrandTaxInvoice(expected, expected)).toEqual({
            status: "accepted",
            issues: [],
        });
    });

    test("requires a reason and current version to accept a held mismatch", () => {
        expect(() =>
            assertBrandInvoiceReviewTransition({
                currentStatus: "held",
                requestedStatus: "accepted",
                validationIssues: ["Quantity mismatch"],
                reviewReason: "",
                expectedVersion: 2,
                currentVersion: 2,
            })
        ).toThrow("BRAND_INVOICE_OVERRIDE_REASON_REQUIRED");

        expect(() =>
            assertBrandInvoiceReviewTransition({
                currentStatus: "held",
                requestedStatus: "accepted",
                validationIssues: ["Quantity mismatch"],
                reviewReason: "Approved against corrected supporting records",
                expectedVersion: 1,
                currentVersion: 2,
            })
        ).toThrow("BRAND_INVOICE_STALE_REVIEW");
    });
});

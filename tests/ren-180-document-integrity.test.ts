import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
    getCorporateTaxDataMissingFields,
    resolveCorporateDocumentDate,
    assertCorporateTaxData,
} from "@/lib/utils/corporate-document-integrity";

describe("REN-180 corporate document integrity", () => {
    test("uses authoritative dates and rejects malformed values", () => {
        expect(
            resolveCorporateDocumentDate("2026-09-01", "2026-08-31")
                .toISOString()
                .slice(0, 10)
        ).toBe("2026-09-01");
        expect(() => resolveCorporateDocumentDate("not-a-date")).toThrow(
            "CORPORATE_DOCUMENT_DATE_INVALID"
        );
    });

    test("requires customer GSTIN and every taxable line HSN", () => {
        expect(() =>
            assertCorporateTaxData("", [{ hsnCode: "6109", taxable: true }])
        ).toThrow("CORPORATE_DOCUMENT_TAX_DATA_INCOMPLETE");
        expect(() =>
            assertCorporateTaxData("29AASCM3828R1ZB", [
                { hsnCode: null, taxable: true },
            ])
        ).toThrow("CORPORATE_DOCUMENT_TAX_DATA_INCOMPLETE");
        expect(() =>
            assertCorporateTaxData("29AASCM3828R1ZB", [
                { hsnCode: null, taxable: false },
            ])
        ).not.toThrow();
    });

    test("identifies the missing tax fields for a blocked document download", () => {
        expect(getCorporateTaxDataMissingFields("", [{ hsnCode: "", taxable: true }])).toEqual([
            "customer_gstin",
            "hsn_code",
        ]);
    });

    test("proforma identifies the brand as supplier and Renivet only as facilitator", () => {
        const route = readFileSync(
            new URL(
                "../src/app/api/corporate-proforma-invoices/[id]/download/route.tsx",
                import.meta.url
            ),
            "utf8"
        );

        expect(route).toContain('fromLabel: "From (Supplier)"');
        expect(route).toContain("facilitatedBy:");
        expect(route).toContain("quote?.profile.shippingAddress");
        expect(route).toContain("shippingAddress || billingAddress || \"Not provided\"");
    });

    test("fulfillment orders show size-wise production and GST-inclusive commercial details", () => {
        const route = readFileSync(
            new URL(
                "../src/app/api/corporate-orders/[id]/vendor-po.pdf/route.tsx",
                import.meta.url
            ),
            "utf8"
        );
        const template = readFileSync(
            new URL(
                "../src/components/pdf/corporate-commercial-document-template.tsx",
                import.meta.url
            ),
            "utf8"
        );

        expect(route).toContain("sizeBreakdown");
        expect(route).toContain("gstRateBps: vendorPo.gstRateBps");
        expect(route).toContain("gstAmountPaise");
        expect(route).toContain('description: "Customization / Extras"');
        expect(route).toContain('unit: "lot"');
        expect(route).toContain('title: "Brand Fulfillment Order"');
        expect(template).toContain("SIZE-WISE PRODUCTION BREAKDOWN");
        expect(template).toContain("data.subtitle && !isFulfillmentOrder");
        expect(template).toContain("Agreed rate per piece (excl. GST)");
        expect(template).toContain("Grand total incl. GST");
    });

    test("labels the Renivet FO issuer block as fulfilled by", () => {
        const route = readFileSync(
            new URL(
                "../src/app/api/corporate-orders/[id]/vendor-po.pdf/route.tsx",
                import.meta.url
            ),
            "utf8"
        );

        expect(route).toContain('fromLabel: "Fulfilled By"');
        expect(route).not.toContain('fromLabel: "Issued By (Platform)"');
    });

    test("keeps the FO expected delivery reference visible when populated", () => {
        const route = readFileSync(
            new URL(
                "../src/app/api/corporate-orders/[id]/vendor-po.pdf/route.tsx",
                import.meta.url
            ),
            "utf8"
        );

        expect(route).toContain('label: "Expected delivery"');
        expect(route).toContain('vendorPo.expectedDeliveryDate || ""');
    });

    test("keeps customization pricing out of the base row and marks its HSN as not applicable", () => {
        const route = readFileSync(
            new URL(
                "../src/app/api/corporate-orders/[id]/vendor-po.pdf/route.tsx",
                import.meta.url
            ),
            "utf8"
        );

        expect(route).toContain("const itemDetail = specsSummary ||");
        expect(route).toContain('description: "Customization / Extras"');
        expect(route).toContain('hsn: "NA"');
    });
});

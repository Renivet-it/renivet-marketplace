import { describe, expect, test } from "bun:test";
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
});

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { requireCorporateTaxClassification } from "./corporate-tax-classification";

describe("corporate tax classification", () => {
    test("rejects a missing HSN instead of applying a default", () => {
        expect(() =>
            requireCorporateTaxClassification({
                hsnCode: null,
                gstRateBps: null,
            })
        ).toThrow("Corporate tax classification is required");
    });

    test("rejects a missing GST rate instead of applying a default", () => {
        expect(() =>
            requireCorporateTaxClassification({
                hsnCode: "6109",
                gstRateBps: null,
            })
        ).toThrow("Corporate tax classification is required");
    });

    test("returns the explicit authoritative classification", () => {
        expect(
            requireCorporateTaxClassification({
                hsnCode: "61091000",
                gstRateBps: 500,
                sourceId: "hsn-row-1",
            })
        ).toEqual({
            hsnCode: "61091000",
            gstRateBps: 500,
            sourceId: "hsn-row-1",
        });
    });

    test("does not retain product tax fallbacks in document or invoice paths", () => {
        const template = readFileSync(
            new URL("../../components/pdf/corporate-tax-invoice-template.tsx", import.meta.url),
            "utf8"
        );
        const invoiceService = readFileSync(
            new URL("../services/corporate-platform.ts", import.meta.url),
            "utf8"
        );
        expect(template).not.toContain('"6109"');
        expect(template).not.toContain("?? 500");
        expect(template).not.toContain("gstRateBps: 1800");
        expect(invoiceService).not.toContain('|| "6109"');
    });
});

import { describe, expect, test } from "bun:test";
import {
    resolveGstExportInvoiceNumber,
    resolveGstExportReference,
} from "./gst-invoice-number";

describe("GST export invoice identity", () => {
    test("uses the stored authoritative invoice number", () => {
        expect(
            resolveGstExportInvoiceNumber({
                invoiceNumber: "INV-AB12-CD34-EF56-GH78-90KL-MN",
                orderId: "order-internal-id",
            })
        ).toBe("INV-AB12-CD34-EF56-GH78-90KL-MN");
    });

    test("does not synthesize a legal invoice number for a missing historical value", () => {
        expect(() =>
            resolveGstExportInvoiceNumber({
                invoiceNumber: null,
                orderId: "order-internal-id",
            })
        ).toThrow("Authoritative invoice number is missing");
    });

    test("keeps the internal order id in a separately labeled reference", () => {
        expect(resolveGstExportReference("order-internal-id")).toEqual({
            label: "Order reference",
            value: "order-internal-id",
        });
    });
});

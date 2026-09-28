import { describe, expect, test } from "bun:test";
import { createAuthoritativeInvoiceNumber } from "./order-invoice-number";

describe("authoritative invoice number generation", () => {
    test("creates a fixed professional token without embedding the order identity", () => {
        const invoiceNumber = createAuthoritativeInvoiceNumber({
            randomToken: () => "ab12cd34ef56gh78ij90klmn",
        });

        expect(invoiceNumber).toBe("INV-AB12-CD34-EF56-GH78-IJ90-KLMN");
        expect(invoiceNumber).toMatch(/^INV(?:-[A-Z0-9]{4}){6}$/);
    });

    test("uses the injected entropy source and does not include a timestamp, brand, or sequence", () => {
        const invoiceNumber = createAuthoritativeInvoiceNumber({
            randomToken: () => "000011112222333344445555",
        });

        expect(invoiceNumber).toBe("INV-0000-1111-2222-3333-4444-5555");
        expect(invoiceNumber).not.toContain("2026");
        expect(invoiceNumber).not.toContain("TERRA");
        expect(invoiceNumber).not.toContain("00001");
    });

    test("rejects an entropy source that cannot produce the required token", () => {
        expect(() =>
            createAuthoritativeInvoiceNumber({ randomToken: () => "too-short" })
        ).toThrow("Invoice token must contain at least 24 safe characters");
    });
});

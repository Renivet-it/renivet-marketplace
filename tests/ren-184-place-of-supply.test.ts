import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";
import {
    resolveCorporatePlaceOfSupply,
    splitCorporateGstByPlaceOfSupply,
} from "../src/lib/finance/corporate-place-of-supply";

test("delivery state overrides billing and registration for goods", () => {
    const result = resolveCorporatePlaceOfSupply({
        deliveryState: "Karnataka",
        billingState: "Maharashtra",
        registeredState: "Tamil Nadu",
    });
    expect(result).toEqual({
        stateCode: "29",
        stateName: "Karnataka",
        source: "delivery_address",
    });
});

test("missing delivery state uses recorded billing fallback without blocking", () => {
    const result = resolveCorporatePlaceOfSupply({
        billingState: "Bihar",
        registeredState: "Tamil Nadu",
    });
    expect(result.source).toBe("billing_address");
    expect(result.stateCode).toBe("10");
});

test("GST split uses place of supply, not customer GSTIN prefix", () => {
    const tax = splitCorporateGstByPlaceOfSupply({
        taxableValuePaise: 100_01,
        gstRateBps: 500,
        supplierStateCode: "10",
        placeOfSupplyStateCode: "29",
    });
    expect(tax.igstPaise).toBe(500);
    expect(tax.cgstPaise).toBe(0);
    expect(tax.sgstPaise).toBe(0);
});

test("same-state place of supply keeps CGST plus SGST paise reconciliation", () => {
    const tax = splitCorporateGstByPlaceOfSupply({
        taxableValuePaise: 100_01,
        gstRateBps: 500,
        supplierStateCode: "29",
        placeOfSupplyStateCode: "29",
    });
    expect(tax.cgstPaise + tax.sgstPaise + tax.igstPaise).toBe(500);
    expect(tax.igstPaise).toBe(0);
});

test("document routes use delivery state and the shared resolver", async () => {
    const [invoice, commission, orderSchema] = await Promise.all([
        readFile(
            new URL(
                "../src/app/api/corporate-orders/[id]/invoice.pdf/route.tsx",
                import.meta.url
            ),
            "utf8"
        ),
        readFile(
            new URL(
                "../src/app/api/corporate-orders/[id]/commission-invoice.pdf/route.tsx",
                import.meta.url
            ),
            "utf8"
        ),
        readFile(
            new URL("../src/lib/db/schema/corporate-order.ts", import.meta.url),
            "utf8"
        ),
    ]);
    expect(invoice).toContain("order.deliveryState");
    expect(commission).toContain("splitCorporateGstByPlaceOfSupply");
    expect(orderSchema).toContain('deliveryState: text("delivery_state")');
});

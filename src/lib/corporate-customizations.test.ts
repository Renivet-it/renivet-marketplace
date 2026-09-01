import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import {
    buildCorporateCustomizationRows,
    type CorporateCustomizationInput,
} from "./corporate-customizations";

describe("corporate customization model", () => {
    test("preserves multiple customization rows and their tax treatment", () => {
        const rows: CorporateCustomizationInput[] = [
            {
                name: "Logo printing",
                description: "Front chest logo",
                amountPaise: 200000,
                quantity: 1,
                basis: "per_order",
                productionInstruction: "Use supplied artwork",
                taxTreatment: "included_in_product_supply",
                displayOrder: 1,
            },
            {
                name: "Sleeve print",
                amountPaise: 50000,
                quantity: 1,
                basis: "per_order",
                taxTreatment: "separate_supply",
                hsnCode: "9988",
                displayOrder: 2,
            },
        ];

        expect(buildCorporateCustomizationRows(rows)).toEqual(rows);
    });

    test("represents an old scalar customization as a legacy row", () => {
        expect(buildCorporateCustomizationRows([], 125000)).toEqual([
            expect.objectContaining({
                name: "Legacy Customization",
                amountPaise: 125000,
                metadata: { legacy: true },
            }),
        ]);
    });

    test("keeps the customization snapshot on every corporate document", () => {
        const schema = readFileSync(
            new URL("./db/schema/corporate-platform.ts", import.meta.url),
            "utf8"
        );
        for (const table of [
            "corporateProformaInvoices",
            "corporateFulfillmentOrders",
            "corporateTaxInvoices",
            "corporateSettlementStatements",
        ]) {
            expect(schema).toContain(`export const ${table}`);
        }
        expect(
            schema.match(/customizations: jsonb\("customizations"\)/g)?.length
        ).toBeGreaterThanOrEqual(6);
    });
});

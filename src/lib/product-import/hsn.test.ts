import { describe, expect, test } from "bun:test";
import {
    normalizeHsnImportRows,
    resolveHsnImportRows,
} from "./hsn";
import { readFile } from "node:fs/promises";

describe("HSN product import", () => {
    test("normalizes the CSV HS Code header and skips blank HSN values", () => {
        const result = normalizeHsnImportRows([
            { SKU: " SKU-1 ", "HS Code": "62044200" },
            { SKU: "SKU-2", "HS Code": "" },
        ]);

        expect(result.rows).toEqual([{ sku: "SKU-1", hsCode: "62044200" }]);
        expect(result.errors).toEqual([
            { row: 3, sku: "SKU-2", code: "blank_hsn", message: "HSN code is blank" },
        ]);
    });

    test("rejects duplicate input SKUs instead of choosing a row", () => {
        const result = normalizeHsnImportRows([
            { SKU: "SKU-1", "HS Code": "62044200" },
            { SKU: "SKU-1", "HS Code": "62044300" },
        ]);

        expect(result.rows).toHaveLength(1);
        expect(result.errors[0]).toMatchObject({ code: "duplicate_sku", sku: "SKU-1" });
    });

    test("reports product and variant SKU collisions as ambiguous", () => {
        const result = resolveHsnImportRows(
            [{ sku: "SKU-1", hsCode: "62044200" }],
            [{ id: "product-1", sku: "SKU-1", hsCode: null }],
            [{ id: "variant-1", sku: "SKU-1", productId: "product-1", hsCode: null }]
        );

        expect(result).toEqual([
            expect.objectContaining({ sku: "SKU-1", status: "ambiguous" }),
        ]);
    });

    test("matches uploaded SKU against a native SKU when the canonical SKU is empty", () => {
        const result = resolveHsnImportRows(
            [{ sku: "NATIVE-1", hsCode: "62044200" }],
            [{ id: "product-1", sku: null, nativeSku: "NATIVE-1", hsCode: null }],
            []
        );

        expect(result).toEqual([
            expect.objectContaining({ sku: "NATIVE-1", status: "product", id: "product-1" }),
        ]);
    });

    test("keeps valid rows eligible when other input rows are invalid", async () => {
        const source = await readFile("src/components/dashboard/general/settings/product-hsn-import-workspace.tsx", "utf8");

        expect(source).toContain("disabled={!validPreviewCount || applyMutation.isPending || previewMutation.isPending}");
        expect(source).not.toContain("hasBlockingErrors");
    });
});

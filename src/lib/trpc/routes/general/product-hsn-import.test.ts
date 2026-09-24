import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("product HSN import route", () => {
    test("keeps preview and apply behind the admin procedure and updates both targets", async () => {
        const source = await readFile("src/lib/trpc/routes/general/finance.ts", "utf8");

        expect(source).toContain("previewProductHsnImport: adminProcedure");
        expect(source).toContain("applyProductHsnImport: adminProcedure");
        expect(source).toContain("hsCode: match.hsCode");
        expect(source).toContain("hsnMasterId: hsnMasterByCode.get(match.hsCode) ?? null");
        expect(source).toContain("Duplicate SKU is not accepted");
        expect(source).toContain("previewToken");
        expect(source).toContain("Preview is stale. Generate a new preview before applying.");
    });
});

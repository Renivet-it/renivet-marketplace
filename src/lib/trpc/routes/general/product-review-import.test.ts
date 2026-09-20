import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("admin bulk product import", () => {
    test("submits product-aware batches through the admin endpoint", async () => {
        const source = await readFile(
            "src/components/globals/modals/dashboard/product-add-admin.tsx",
            "utf8"
        );

        expect(source).toContain("createProductImportBatches(products)");
        expect(source).toContain("for (const [index, batch] of batches.entries())");
        expect(source).toContain("products: batch");
    });

    test("returns a compact response instead of full product records", async () => {
        const source = await readFile(
            "src/lib/trpc/routes/general/product-review.ts",
            "utf8"
        );

        expect(source).toContain("createdCount: newData.length");
        expect(source).toContain(
            "updatedCount: touchedExistingProductIds.size"
        );
        expect(source).not.toContain("return newData;");
    });
});

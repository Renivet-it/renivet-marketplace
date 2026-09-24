import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("bulk product import response", () => {
    test("returns a compact summary instead of embedding-heavy product rows", async () => {
        const source = await readFile(
            "src/lib/trpc/routes/brands/products.ts",
            "utf8"
        );

        expect(source).toContain("createdCount: newData.length");
        expect(source).toContain(
            "updatedCount: touchedExistingProductIds.size"
        );
        expect(source).not.toContain("return newData;");
    });

    test("persists HSN when updating an existing variant", async () => {
        const source = await readFile("src/lib/trpc/routes/brands/products.ts", "utf8");
        expect((source.match(/hsCode: variant\.hsCode/g) ?? []).length).toBeGreaterThanOrEqual(2);
    });
});

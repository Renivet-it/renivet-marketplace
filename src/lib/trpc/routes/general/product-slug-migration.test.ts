import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("REN-230 admin migration route", () => {
    test("keeps preview, status, and apply operations behind adminProcedure", async () => {
        const source = await readFile(
            "src/lib/trpc/routes/general/product-slug-migration.ts",
            "utf8"
        );
        expect(source.match(/adminProcedure/g)?.length).toBeGreaterThanOrEqual(4);
        expect(source).toContain("applyProductSlugMigrationBatch");
        expect(source).toContain("approvedConflictKeys");
    });
});

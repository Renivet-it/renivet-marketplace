import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("REN-230 admin migration route", () => {
    test("keeps preview, status, and apply operations behind finance-admin access", async () => {
        const source = await readFile(
            "src/lib/trpc/routes/general/product-slug-migration.ts",
            "utf8"
        );
        expect(source.match(/slugMigrationAdminProcedure/g)?.length).toBeGreaterThanOrEqual(5);
        expect(source).toContain("hasFinanceAdminAccess");
        expect(source).toContain("applyProductSlugMigrationBatch");
        expect(source).toContain("approvedConflictKeys");
    });
});

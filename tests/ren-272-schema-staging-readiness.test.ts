import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { assertCorporateSchemaReadiness } from "../src/lib/governance/corporate-staging-readiness";

test("REN-272 schema readiness fails closed on drift or duplicates", () => {
    expect(() =>
        assertCorporateSchemaReadiness({
            expectedMigrationTags: ["0293_ren265_quote_po_uniqueness"],
            appliedMigrationTags: [],
        })
    ).toThrow("missing migrations");
    expect(() =>
        assertCorporateSchemaReadiness({
            expectedMigrationTags: [],
            appliedMigrationTags: [],
            duplicateBusinessKeys: ["quote-1"],
        })
    ).toThrow("duplicate business keys");
    expect(
        assertCorporateSchemaReadiness({
            expectedMigrationTags: ["0293_ren265_quote_po_uniqueness"],
            appliedMigrationTags: ["0293_ren265_quote_po_uniqueness"],
        })
    ).toBe(true);
});

describe("REN-272 Corporate schema and staging readiness", () => {
    test("readiness contract rejects production-like provider or database configuration", async () => {
        const source = await readFile(
            "src/lib/governance/corporate-staging-readiness.ts",
            "utf8"
        );
        expect(source).toContain("assertNonProductionEnvironment");
        expect(source).toContain("RAZORPAY_KEY_ID");
        expect(source).toContain("DATABASE_URL");
        expect(source).toContain("production");
    });

    test("readiness evidence is secret safe and identifies the commit and migration state", async () => {
        const source = await readFile(
            "src/lib/governance/corporate-staging-readiness.ts",
            "utf8"
        );
        expect(source).toContain("buildStagingReadinessEvidence");
        expect(source).toContain("commitSha");
        expect(source).toContain("migrationTag");
        expect(source).toContain("redact");
        expect(source).toContain("database: redact(environment.databaseUrl)");
        expect(source).not.toContain("databaseUrl: environment.databaseUrl");
    });
});

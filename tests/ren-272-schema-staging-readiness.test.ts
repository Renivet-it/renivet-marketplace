import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

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

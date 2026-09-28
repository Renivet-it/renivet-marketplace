import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

describe("REN-209 Terra Luna commercial configuration", () => {
    test("seeds only the confirmed Terra Luna category rates with no holdback", async () => {
        const migration = await read("drizzle/0288_ren209_terra_luna_commercial_rules.sql");
        expect(migration).toContain("lower(name) = 'terra luna'");
        expect(migration).toContain("'Terra Luna Fashion/Clothing'");
        expect(migration).toContain("'Terra Luna Personal Care'");
        expect(migration).toContain("2500");
        expect(migration).toContain("2000");
        expect(migration).toContain("'sourceStatus', 'no_source_document_on_file'");
        expect(migration).toContain("'approverName', 'Akshay'");
        expect(migration).toContain("holdback_percent_bps");
    });

    test("keeps commission configuration admin-only and holdback inactive", async () => {
        const route = await read("src/lib/trpc/routes/general/finance.ts");
        expect(route).toContain("listCommissionRules: adminProcedure");
        expect(route).toContain("holdbackPercentBps: z.literal(0).default(0)");
        expect(route).toContain("holdbackPercentBps: 0");
        expect(route).toContain("agreementVersionId");
        expect(route).toContain("sourceStatus");
    });
});

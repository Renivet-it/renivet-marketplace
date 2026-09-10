import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";

const source = readFileSync(
    new URL("../src/lib/trpc/routes/general/finance.ts", import.meta.url),
    "utf8"
);

test("REN-103 finance router removes unsafe any annotations and casts", () => {
    expect(source).toContain('import type { Context } from "@/lib/trpc/context"');
    expect(source).not.toMatch(/:\s*any\b|\bas\s+any\b|\bany\[\]/);
});

test("REN-103 preserves finance type and compatibility boundaries", () => {
    for (const marker of [
        '"brand_fault"',
        '"renivet_fault"',
        '"customer_fault"',
        '"carrier_fault"',
        '"matched"',
        '"discrepancy"',
        '"critical"',
        '"ghost"',
        "z.any()",
        "writeFinanceAuditEvent",
        'code: "UNAUTHORIZED"',
        'code: "FORBIDDEN"',
    ]) expect(source).toContain(marker);
});

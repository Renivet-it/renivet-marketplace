import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";

const source = readFileSync(
    new URL("../src/lib/trpc/routes/general/finance.ts", import.meta.url),
    "utf8"
);
const productSource = readFileSync(
    new URL("../src/lib/db/queries/product.ts", import.meta.url),
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

test("REN-103 product quantity helper preserves normalization boundaries", () => {
    const helper = productSource.slice(
        productSource.indexOf("const toNonNegativeInt"),
        productSource.indexOf("const parseProductArraySafely")
    );
    expect(helper).not.toMatch(/:\s*any\b|\bas\s+any\b|\bany\[\]/);
    for (const marker of [
        "Number(value)",
        "Number.isFinite(numeric)",
        "Math.trunc(numeric)",
        "Math.max(0,",
        "product.quantity === null",
        "product.quantity === undefined",
        "Array.isArray(product.variants)",
    ]) expect(helper).toContain(marker);
});

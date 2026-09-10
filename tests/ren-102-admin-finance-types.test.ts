import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";

const source = readFileSync(
    new URL("../src/components/corporate-platform/admin-finance-queue.tsx", import.meta.url),
    "utf8"
);

test("REN-102 finance queue uses inferred router types without unsafe any casts", () => {
    expect(source).toContain("inferRouterOutputs<AppRouter>");
    expect(source).toContain('["listAdminFinance"]');
    expect(source).not.toMatch(/:\s*any\b|\bas\s+any\b|\bany\[\]/);
    expect(source).not.toMatch(/\bas\s+unknown\s+as\b/);
});

test("REN-102 preserves finance queue behavior markers", () => {
    for (const marker of [
        'quote.status === "approved"',
        '["po_uploaded", "po_review"].includes(purchaseOrder.status)',
        "Math.max(0, order.balanceDuePaise ?? 0)",
        "total + (payment.amountPaise ?? 0)",
        "const PAGE_SIZE = 8",
        "setPage(1)",
    ]) expect(source).toContain(marker);
});

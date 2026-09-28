import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(path, "utf8");

describe("REN-226 refund source-of-truth wiring", () => {
    test("refund webhook writes through the canonical event boundary", async () => {
        const source = await read("src/app/api/webhooks/razorpay/refunds/route.ts");

        expect(source).toContain("refundQueries.recordRefundEvent");
        expect(source).toContain("if (!recorded.statusChanged) break;");
    });

    test("all application refund initiators use the canonical writer", async () => {
        const paths = [
            "src/app/api/webhooks/razorpay/payments/route.ts",
            "src/lib/support/cancel-order-helper.ts",
            "src/lib/trpc/routes/general/orders.ts",
            "src/lib/finance/refunds.ts",
        ];
        const sources = await Promise.all(paths.map(read));

        for (const source of sources) {
            expect(source).toContain("recordRefundEvent");
        }
    });

    test("reconciliation is cron-protected and supports targeted case reports", async () => {
        const route = await read("src/app/api/cron/refund-reconciliation/route.ts");

        expect(route).toContain("requireCronSecret");
        expect(route).toContain('getAll("orderId")');
        expect(route).toContain("runRefundReconciliation");
    });
});

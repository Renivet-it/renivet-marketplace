import { describe, expect, test } from "bun:test";
import { ensureInvoiceWithRetry } from "./invoice-availability";

describe("ensureInvoiceWithRetry", () => {
    test("retries a transient invoice persistence failure", async () => {
        let attempts = 0;

        const result = await ensureInvoiceWithRetry({
            issue: async () => {
                attempts += 1;
                if (attempts < 3) throw new Error("temporary database failure");
                return { invoiceNumber: "SUI/2627/00001" };
            },
            maxAttempts: 3,
            delayMs: 0,
        });

        expect(result).toEqual({ invoiceNumber: "SUI/2627/00001" });
        expect(attempts).toBe(3);
    });

    test("reports an exhausted failure for admin alerting", async () => {
        const failures: Array<{ attempts: number; error: Error }> = [];

        await expect(
            ensureInvoiceWithRetry({
                issue: async () => {
                    throw new Error("database unavailable");
                },
                maxAttempts: 2,
                delayMs: 0,
                onFailure: async (error, attempts) => {
                    failures.push({ attempts, error });
                },
            })
        ).rejects.toThrow("database unavailable");

        expect(failures).toHaveLength(1);
        expect(failures[0]?.attempts).toBe(2);
    });
});

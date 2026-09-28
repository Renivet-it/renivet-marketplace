import { describe, expect, test } from "bun:test";

describe("REN-206 execution-gate integration contract", () => {
    test("runs the gate before the external payout provider and before the brand loop", async () => {
        const source = await Bun.file(new URL("./payouts.ts", import.meta.url)).text();
        const executeStart = source.indexOf("export async function executePayoutCycle");
        const gate = source.indexOf("evaluateAndAuditPayoutExecutionGate", executeStart);
        const brandLoop = source.indexOf("for (const brand of brands)", executeStart);
        const provider = source.indexOf("createRazorpayPayout({", executeStart);

        expect(executeStart).toBeGreaterThanOrEqual(0);
        expect(gate).toBeGreaterThan(executeStart);
        expect(gate).toBeLessThan(brandLoop);
        expect(gate).toBeLessThan(provider);
    });

    test("exposes clearance recording and revocation only through protected finance routes", async () => {
        const source = await Bun.file(
            new URL("../trpc/routes/general/finance.ts", import.meta.url)
        ).text();

        expect(source).toContain("recordPayoutExecutionClearance: adminProcedure");
        expect(source).toContain("revokePayoutExecutionClearance: adminProcedure");
        expect(source).toContain('assertFinanceAccess(ctx, "payouts", "manage")');
    });

    test("requires override approval regardless of amount", async () => {
        const source = await Bun.file(new URL("./payouts.ts", import.meta.url)).text();
        const createStart = source.indexOf("export async function createPayoutOverride");
        const createEnd = source.indexOf("export async function approvePayoutOverride", createStart);
        const createSource = source.slice(createStart, createEnd);

        expect(createSource).toContain("Every payout override requires a second admin approver.");
        expect(createSource).not.toContain("Math.abs(input.amountPaise) > 50_000");
    });

    test("persists the clearance record with an additive migration", async () => {
        const schema = await Bun.file(
            new URL("../db/schema/finance-compliance.ts", import.meta.url)
        ).text();
        const migration = await Bun.file(
            new URL("../../../drizzle/0286_payout_execution_clearances.sql", import.meta.url)
        ).text();

        expect(schema).toContain("payoutExecutionClearances");
        expect(schema).toContain("transactionValidatedAt");
        expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"payout_execution_clearances\"");
    });
});

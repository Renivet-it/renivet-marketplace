import { describe, expect, test } from "bun:test";
import {
    canRecalculatePayoutCycle,
    getPayoutExecutionReference,
    shouldSkipPayoutBrandExecution,
} from "./payouts";
import { requireCommissionRule } from "./payout-commission";
import { hasPayoutStatementAccess } from "./access";
import { isPayoutExecutionSeparated } from "./payout-execution-gate";

describe("REN-253 payout containment", () => {
    test("allows recalculation only for draft and calculated cycles", () => {
        expect(canRecalculatePayoutCycle("draft")).toBe(true);
        expect(canRecalculatePayoutCycle("calculated")).toBe(true);
        expect(canRecalculatePayoutCycle("approved")).toBe(false);
        expect(canRecalculatePayoutCycle("processing")).toBe(false);
        expect(canRecalculatePayoutCycle("completed")).toBe(false);
        expect(canRecalculatePayoutCycle("failed")).toBe(false);
    });

    test("fails closed when no approved commission rule matches", () => {
        expect(() =>
            requireCommissionRule({
                brandId: "brand-1",
                targetDate: new Date("2026-01-01T00:00:00.000Z"),
                rules: [],
            })
        ).toThrow("No approved commission rule");
    });

    test("allows payout statements only with finance view or manage access", () => {
        expect(hasPayoutStatementAccess({ canView: true, canManage: false })).toBe(true);
        expect(hasPayoutStatementAccess({ canView: false, canManage: true })).toBe(true);
        expect(hasPayoutStatementAccess({ canView: false, canManage: false })).toBe(false);
    });

    test("rejects execution by the clearance actor", () => {
        expect(
            isPayoutExecutionSeparated({
                executorId: "finance-1",
                clearedBy: "finance-1",
                approvedBy: "finance-2",
            })
        ).toBe(false);
        expect(
            isPayoutExecutionSeparated({
                executorId: "finance-3",
                clearedBy: "finance-1",
                approvedBy: "finance-2",
            })
        ).toBe(true);
    });

    test("deduplicates completed or submitted cycle-and-brand execution", () => {
        expect(shouldSkipPayoutBrandExecution("completed")).toBe(true);
        expect(shouldSkipPayoutBrandExecution("submitted")).toBe(true);
        expect(shouldSkipPayoutBrandExecution("awaiting_manual_confirmation")).toBe(true);
        expect(shouldSkipPayoutBrandExecution("processing")).toBe(false);
        expect(getPayoutExecutionReference("cycle-2026-09", "brand-1")).toBe(
            "cycle-2026-09-brand-1"
        );
    });

    test("keeps RTO fault-owner changes on the lock-aware audited path", async () => {
        const source = await Bun.file(
            new URL("../trpc/routes/general/order-ops.ts", import.meta.url)
        ).text();
        expect(source).toContain("RTO fault-owner changes must use Return/Replace setRtoAttribution");
        const updateStart = source.indexOf(".onConflictDoUpdate({");
        const updateEnd = source.indexOf(".returning()", updateStart);
        expect(source.slice(updateStart, updateEnd)).not.toContain(
            "faultOwner: input.faultOwner"
        );
    });
});

import { describe, expect, test } from "bun:test";
import {
    calculateCommissionPaise,
    resolveCommissionRuleFromCandidates,
    type CommissionRuleCandidate,
} from "./payout-commission";

const deliveredAt = new Date("2026-06-20T12:00:00.000Z");

function rule(
    overrides: Partial<CommissionRuleCandidate> = {}
): CommissionRuleCandidate {
    return {
        id: "rule-1",
        brandId: "brand-1",
        categoryId: null,
        productTypeId: null,
        commissionPercentBps: 2500,
        holdbackPercentBps: 500,
        ruleName: "terra-luna-general",
        priority: 100,
        effectiveFrom: null,
        effectiveTo: null,
        ...overrides,
    };
}

describe("REN-203 commission calculation", () => {
    test("calculates commission using canonical basis points", () => {
        expect(calculateCommissionPaise(10_000, 2500)).toBe(2500);
        expect(calculateCommissionPaise(10_000, 2000)).toBe(2000);
    });

    test("rejects a rate outside the basis-point percentage range", () => {
        expect(() => calculateCommissionPaise(10_000, -1)).toThrow(
            "Invalid commission rate"
        );
        expect(() => calculateCommissionPaise(10_000, 10_001)).toThrow(
            "Invalid commission rate"
        );
    });

    test("selects the effective scoped rule before the general rule", () => {
        const winner = resolveCommissionRuleFromCandidates({
            brandId: "brand-1",
            categoryId: "category-personal-care",
            productTypeId: "product-type-1",
            targetDate: deliveredAt,
            rules: [
                rule(),
                rule({
                    id: "rule-2",
                    categoryId: "category-personal-care",
                    commissionPercentBps: 2000,
                    ruleName: "terra-luna-personal-care",
                }),
            ],
        });

        expect(winner?.commissionPercentBps).toBe(2000);
        expect(winner?.ruleName).toBe("terra-luna-personal-care");
    });

    test("ignores rules outside their effective date window", () => {
        const winner = resolveCommissionRuleFromCandidates({
            brandId: "brand-1",
            targetDate: deliveredAt,
            rules: [
                rule({
                    id: "future",
                    effectiveFrom: "2026-07-01",
                    commissionPercentBps: 2000,
                }),
                rule({ id: "current", commissionPercentBps: 2500 }),
            ],
        });

        expect(winner?.id).toBe("current");
    });

    test("returns no rule instead of applying an unapproved fallback", () => {
        const winner = resolveCommissionRuleFromCandidates({
            brandId: "brand-without-approved-rule",
            targetDate: deliveredAt,
            rules: [],
        });

        expect(winner).toBeNull();
    });

    test("payout calculation does not contain the legacy silent commission fallback", async () => {
        const source = await Bun.file(new URL("./payouts.ts", import.meta.url)).text();

        expect(source).not.toContain("category?.commissionRate");
        expect(source).not.toContain('ruleName: "default_20_percent"');
    });
});

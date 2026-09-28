import { describe, expect, test } from "bun:test";
import {
    analyzeCommissionRulePreview,
    type CommissionRuleAdminCandidate,
} from "./commission-rule-admin";

function rule(
    overrides: Partial<CommissionRuleAdminCandidate> = {}
): CommissionRuleAdminCandidate {
    return {
        id: "rule-1",
        brandId: "brand-1",
        categoryId: "category-1",
        productTypeId: null,
        ruleName: "general",
        commissionPercentBps: 2500,
        holdbackPercentBps: 0,
        priority: 100,
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-12-31",
        isActive: true,
        ...overrides,
    };
}

describe("commission rule admin preview", () => {
    test("blocks an exact active scope and date overlap", () => {
        const result = analyzeCommissionRulePreview({
            candidate: rule({ id: undefined }),
            rules: [rule()],
        });

        expect(result.kind).toBe("conflict");
        expect(result.conflicts[0]?.reason).toBe("exact_scope_overlap");
    });

    test("warns for a broader overlapping scope and reports the resolver winner", () => {
        const result = analyzeCommissionRulePreview({
            candidate: rule({ id: undefined, productTypeId: null, priority: 90 }),
            rules: [
                rule({ id: "specific", productTypeId: "product-1", priority: 100 }),
            ],
        });

        expect(result.kind).toBe("ambiguous");
        expect(result.winner?.id).toBe("specific");
    });

    test("returns no conflict and no fallback winner when no active rule matches", () => {
        const result = analyzeCommissionRulePreview({
            candidate: rule({ id: undefined, brandId: "brand-2" }),
            rules: [rule()],
        });

        expect(result.kind).toBe("none");
        expect(result.winner).toBeNull();
        expect(result.fallback).toBeNull();
    });
});

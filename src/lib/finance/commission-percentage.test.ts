import { describe, expect, test } from "bun:test";
import {
    formatMarketplaceCommissionPercentage,
    resolveMarketplaceCommissionPercentage,
} from "./commission-percentage";

describe("marketplace commission percentage source", () => {
    test("formats the resolved commission_rules basis points exactly", () => {
        expect(formatMarketplaceCommissionPercentage(1250)).toBe("12.50%");
        expect(formatMarketplaceCommissionPercentage(3333)).toBe("33.33%");
    });

    test("returns an explicit unconfigured state when no rule is resolved", () => {
        expect(resolveMarketplaceCommissionPercentage(null)).toEqual({
            configured: false,
            label: "Unconfigured",
            commissionPercentBps: null,
        });
    });

    test("rejects malformed or out-of-range rule values", () => {
        expect(() => formatMarketplaceCommissionPercentage(-1)).toThrow(
            "Invalid marketplace commission rate"
        );
        expect(() => formatMarketplaceCommissionPercentage(10_001)).toThrow(
            "Invalid marketplace commission rate"
        );
        expect(() => formatMarketplaceCommissionPercentage(12.5)).toThrow(
            "Invalid marketplace commission rate"
        );
    });
});

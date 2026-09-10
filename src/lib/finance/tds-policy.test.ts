import { describe, expect, test } from "bun:test";
import { computeTdsDeduction } from "./calculations";
import {
    auditBrandTdsTrackingRows,
    LEGACY_SECTION_194_O_THRESHOLD_PAISE,
    SECTION_194_O_THRESHOLD_PAISE,
} from "./tds-policy";

describe("Section 194-O policy", () => {
    test("uses gross sales at below, exact, and above threshold boundaries", () => {
        expect(
            computeTdsDeduction({
                cumulativeSalesPaise: 0,
                cycleSalesPaise: SECTION_194_O_THRESHOLD_PAISE - 1,
                thresholdPaise: SECTION_194_O_THRESHOLD_PAISE,
            }).deductiblePaise
        ).toBe(0);
        expect(
            computeTdsDeduction({
                cumulativeSalesPaise: 0,
                cycleSalesPaise: SECTION_194_O_THRESHOLD_PAISE,
                thresholdPaise: SECTION_194_O_THRESHOLD_PAISE,
            }).deductiblePaise
        ).toBe(0);
        expect(
            computeTdsDeduction({
                cumulativeSalesPaise: SECTION_194_O_THRESHOLD_PAISE,
                cycleSalesPaise: 10_000,
                thresholdPaise: SECTION_194_O_THRESHOLD_PAISE,
            }).deductiblePaise
        ).toBe(10);
    });

    test("classifies legacy rows without mutating them", () => {
        const rows = [
            {
                brandId: "brand-1",
                financialYear: "FY2026-27",
                thresholdPaise: LEGACY_SECTION_194_O_THRESHOLD_PAISE,
                annualSalesYtdPaise: 4_000_000,
                tdsDeductedYtdPaise: 10_000,
                thresholdCrossedAt: new Date("2026-05-01"),
                lastAppliedCycleId: "cycle-1",
            },
        ];

        expect(auditBrandTdsTrackingRows(rows).legacyRows).toBe(1);
        expect(rows[0].thresholdPaise).toBe(
            LEGACY_SECTION_194_O_THRESHOLD_PAISE
        );
    });
});

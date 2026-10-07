import { describe, expect, test } from "bun:test";
import {
    assertApprovedCorporateQuote,
    assertAllocationMatchesQuantity,
} from "../src/lib/services/corporate-commercial-integrity";

describe("REN-265 commercial truth", () => {
    test("rejects non-approved and expired quotes", () => {
        expect(() =>
            assertApprovedCorporateQuote({ status: "draft", validUntil: "2099-01-01" })
        ).toThrow("approved");
        expect(() =>
            assertApprovedCorporateQuote({ status: "approved", validUntil: "2020-01-01" }, new Date("2026-10-08"))
        ).toThrow("expired");
    });

    test("accepts an approved quote through its validity date", () => {
        expect(
            assertApprovedCorporateQuote(
                { status: "approved", validUntil: "2026-10-08" },
                new Date("2026-10-08T12:00:00Z")
            )
        ).toBe(true);
    });

    test("requires size allocation to equal approved quantity", () => {
        expect(() => assertAllocationMatchesQuantity({ S: 2, M: 3 }, 4)).toThrow(
            "allocation"
        );
        expect(assertAllocationMatchesQuantity({ S: 2, M: 3 }, 5)).toBe(true);
    });
});

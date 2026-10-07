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

    test("adds a non-destructive database uniqueness guard for quote POs", async () => {
        const schema = await Bun.file("src/lib/db/schema/corporate-platform.ts").text();
        const migration = await Bun.file(
            "drizzle/0293_ren265_quote_po_uniqueness.sql"
        ).text();
        expect(schema).toContain("corporate_purchase_orders_quote_unique");
        expect(migration).toContain("REN-265 migration blocked");
        expect(migration).toContain("CREATE UNIQUE INDEX");
        expect(migration).not.toContain("DELETE FROM");
    });
});

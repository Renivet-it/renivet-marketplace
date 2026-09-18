import { describe, expect, test } from "bun:test";
import {
    agreementMetadataSchema,
    getNextAgreementVersion,
} from "./validation";

describe("brand agreement validation", () => {
    test("accepts valid metadata and rejects an expiry before the effective date", () => {
        expect(
            agreementMetadataSchema.safeParse({
                signedDate: "2026-01-01",
                effectiveDate: "2026-01-01",
                expiryDate: "2027-01-01",
                status: "active",
            }).success
        ).toBe(true);

        expect(
            agreementMetadataSchema.safeParse({
                signedDate: "2026-01-01",
                effectiveDate: "2027-01-01",
                expiryDate: "2026-01-01",
                status: "active",
            }).success
        ).toBe(false);
    });

    test("allocates the next append-only version", () => {
        expect(getNextAgreementVersion([])).toBe(1);
        expect(getNextAgreementVersion([{ version: 1 }, { version: 4 }])).toBe(5);
    });
});

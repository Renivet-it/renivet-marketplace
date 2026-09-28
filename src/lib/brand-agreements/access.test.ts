import { describe, expect, test } from "bun:test";
import { canReadAgreement } from "./access";

describe("brand agreement access", () => {
    test("allows admins and the owning brand only", () => {
        expect(canReadAgreement({ isAdmin: true, userBrandId: null, agreementBrandId: "brand-a" })).toBe(true);
        expect(canReadAgreement({ isAdmin: false, userBrandId: "brand-a", agreementBrandId: "brand-a" })).toBe(true);
        expect(canReadAgreement({ isAdmin: false, userBrandId: "brand-b", agreementBrandId: "brand-a" })).toBe(false);
        expect(canReadAgreement({ isAdmin: false, userBrandId: null, agreementBrandId: "brand-a" })).toBe(false);
    });
});

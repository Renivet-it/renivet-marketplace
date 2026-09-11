import { describe, expect, test } from "bun:test";
import { guestJourneys, validateTargetOrigin } from "../../scripts/e2e/guest-journeys";

describe("REN-121 guest journey suite", () => {
    test("contains exactly ten read-only journeys", () => {
        expect(guestJourneys).toHaveLength(10);
        expect(guestJourneys.every((journey) => journey.readOnly)).toBe(true);
        expect(guestJourneys.every((journey) => journey.path.startsWith("/"))).toBe(true);
    });

    test("identifies login-wall journeys without payment actions", () => {
        const wallJourneys = guestJourneys.filter((journey) => journey.expected === "login_wall");
        expect(wallJourneys.map((journey) => journey.id)).toEqual([
            "protected-profile",
            "guest-cart",
            "guest-checkout",
        ]);
        expect(guestJourneys.some((journey) => journey.actions.includes("submit_payment"))).toBe(false);
    });

    test("rejects production and unknown origins", () => {
        expect(() => validateTargetOrigin("https://renivet.com", ["https://staging.example.com"]))
            .toThrow("blocked");
        expect(() => validateTargetOrigin("https://unknown.example.com", ["https://staging.example.com"]))
            .toThrow("blocked");
    });

    test("accepts loopback and explicitly allowlisted staging origins", () => {
        expect(validateTargetOrigin("http://localhost:3000", [])).toBe("http://localhost:3000");
        expect(validateTargetOrigin("https://staging.example.com", ["https://staging.example.com"]))
            .toBe("https://staging.example.com");
    });
});

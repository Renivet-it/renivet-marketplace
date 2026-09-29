import { describe, expect, test } from "bun:test";
import {
    createGrievanceClaimToken,
    hashGrievanceClaimToken,
    isGrievanceClaimExpired,
} from "./claims";

describe("grievance claim tokens", () => {
    test("creates an opaque token whose stored hash is not the raw token", () => {
        const token = createGrievanceClaimToken();

        expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
        expect(hashGrievanceClaimToken(token)).not.toBe(token);
        expect(hashGrievanceClaimToken(token)).toBe(hashGrievanceClaimToken(token));
    });

    test("expires claims at or after their expiry time", () => {
        const expiresAt = new Date("2026-09-30T10:00:00.000Z");

        expect(isGrievanceClaimExpired(new Date("2026-09-30T09:59:59.999Z"), expiresAt)).toBe(false);
        expect(isGrievanceClaimExpired(expiresAt, expiresAt)).toBe(true);
    });
});

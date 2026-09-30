import { describe, expect, test } from "bun:test";
import {
    canAuthenticatedUserConsumeClaim,
    createGrievanceClaimToken,
    hashGrievanceClaimToken,
    isGrievanceClaimExpired,
} from "./claims";

describe("grievance claim tokens", () => {
    test("creates an opaque token whose stored hash is not the raw token", () => {
        const token = createGrievanceClaimToken();

        expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
        expect(hashGrievanceClaimToken(token)).not.toBe(token);
        expect(hashGrievanceClaimToken(token)).toBe(
            hashGrievanceClaimToken(token)
        );
    });

    test("expires claims at or after their expiry time", () => {
        const expiresAt = new Date("2026-09-30T10:00:00.000Z");

        expect(
            isGrievanceClaimExpired(
                new Date("2026-09-30T09:59:59.999Z"),
                expiresAt
            )
        ).toBe(false);
        expect(isGrievanceClaimExpired(expiresAt, expiresAt)).toBe(true);
    });

    test("allows only the matched existing account to consume its claim", () => {
        const claim = {
            expectedUserId: "user-1",
            email: "owner@gmail.com",
            phone: "9876543210",
        };

        expect(
            canAuthenticatedUserConsumeClaim(claim, {
                id: "user-1",
                email: "owner@gmail.com",
                phone: "9876543210",
            })
        ).toBe(true);
        expect(
            canAuthenticatedUserConsumeClaim(claim, {
                id: "user-2",
                email: "owner@gmail.com",
                phone: "9876543210",
            })
        ).toBe(false);
    });

    test("allows a newly verified account to consume an unassigned claim", () => {
        const claim = {
            expectedUserId: null,
            email: "new@gmail.com",
            phone: "9988776655",
        };

        expect(
            canAuthenticatedUserConsumeClaim(claim, {
                id: "new-user",
                email: "new@gmail.com",
                phone: null,
            })
        ).toBe(true);
        expect(
            canAuthenticatedUserConsumeClaim(claim, {
                id: "wrong-user",
                email: "wrong@gmail.com",
                phone: "9000000000",
            })
        ).toBe(false);
    });
});

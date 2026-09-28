import { describe, expect, test } from "bun:test";
import {
    evaluatePayoutExecutionGate,
    isPayoutOverrideApproved,
} from "./payout-execution-gate";

const now = new Date("2026-09-18T12:00:00.000Z");

function checks(overrides: Record<string, boolean> = {}) {
    return {
        commissionValidation: true,
        eligibilityGating: true,
        paymentStateGating: true,
        holdbackSuspension: true,
        realTransactionValidation: true,
        humanClearance: {
            clearedBy: "manager-1",
            evidenceReference: "approval-ticket-1",
            clearedAt: "2026-09-18T10:00:00.000Z",
            expiresAt: "2026-09-19T10:00:00.000Z",
            revokedAt: null,
        },
        ...overrides,
    };
}

describe("REN-206 payout execution gate", () => {
    test("blocks each failed prerequisite with a named reason", () => {
        for (const check of [
            "commissionValidation",
            "eligibilityGating",
            "paymentStateGating",
            "holdbackSuspension",
            "realTransactionValidation",
        ]) {
            const result = evaluatePayoutExecutionGate(
                checks({ [check]: false }),
                now
            );

            expect(result.allowed).toBe(false);
            expect(result.reasons.some((reason) => reason.code)).toBe(true);
        }
    });

    test("requires recorded human clearance even when technical checks pass", () => {
        const result = evaluatePayoutExecutionGate(
            checks({ humanClearance: null }),
            now
        );

        expect(result.allowed).toBe(false);
        expect(result.reasons).toContainEqual({
            code: "human_clearance_missing",
            message: "BIZ-3 human clearance is missing.",
        });
    });

    test("rejects expired or revoked clearance", () => {
        expect(
            evaluatePayoutExecutionGate(
                checks({
                    humanClearance: {
                        clearedBy: "manager-1",
                        evidenceReference: "approval-ticket-1",
                        clearedAt: "2026-09-17T10:00:00.000Z",
                        expiresAt: "2026-09-18T11:00:00.000Z",
                        revokedAt: null,
                    },
                }),
                now
            ).reasons
        ).toContainEqual({
            code: "human_clearance_expired",
            message: "BIZ-3 human clearance is expired.",
        });
        expect(
            evaluatePayoutExecutionGate(
                checks({
                    humanClearance: {
                        clearedBy: "manager-1",
                        evidenceReference: "approval-ticket-1",
                        clearedAt: "2026-09-18T10:00:00.000Z",
                        expiresAt: "2026-09-19T10:00:00.000Z",
                        revokedAt: "2026-09-18T11:00:00.000Z",
                    },
                }),
                now
            ).reasons
        ).toContainEqual({
            code: "human_clearance_revoked",
            message: "BIZ-3 human clearance is revoked.",
        });
    });

    test("allows only a valid clearance with all controls passing", () => {
        expect(evaluatePayoutExecutionGate(checks(), now)).toEqual({
            allowed: true,
            reasons: [],
        });
    });

    test("requires an approver for every override and rejects self-approval", () => {
        expect(
            isPayoutOverrideApproved({ createdBy: "maker", approvedBy: null })
        ).toBe(false);
        expect(
            isPayoutOverrideApproved({ createdBy: "maker", approvedBy: "maker" })
        ).toBe(false);
        expect(
            isPayoutOverrideApproved({ createdBy: "maker", approvedBy: "checker" })
        ).toBe(true);
    });
});

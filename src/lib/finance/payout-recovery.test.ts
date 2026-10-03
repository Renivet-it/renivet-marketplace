import { describe, expect, test } from "bun:test";
import {
    PayoutPersistenceAfterAcceptanceError,
    PayoutProviderRejectedError,
    PayoutProviderUnknownOutcomeError,
    classifyPriorBrandPayout,
    findPriorPayoutBlocks,
    priorPayoutDiagnostic,
} from "./payout-recovery";

const sale = (id: string) => ({ lineType: "sale", referenceId: id });

describe("REN-253 N-2 cross-cycle paid-ness", () => {
    test("classifies what a brand entry in another cycle means", () => {
        expect(classifyPriorBrandPayout({ brandId: "b", executionStatus: "completed" })).toBe("paid");
        expect(classifyPriorBrandPayout({ brandId: "b", executionStatus: "failed", transactionId: "pout_1" })).toBe("paid");
        expect(classifyPriorBrandPayout({ brandId: "b", executionStatus: "awaiting_manual_confirmation" })).toBe("in_flight");
        expect(classifyPriorBrandPayout({ brandId: "b", executionStatus: "processing" })).toBe("in_flight");
        expect(
            classifyPriorBrandPayout({
                brandId: "b",
                executionStatus: "processing",
                metadata: { providerOutcome: "unknown" },
            })
        ).toBe("unresolved");
        expect(
            classifyPriorBrandPayout({
                brandId: "b",
                executionStatus: "failed",
                metadata: { providerOutcome: "rejected" },
            })
        ).toBe("none");
        // a failure with no recorded rejection (older records, unknown cause) stays unresolved
        expect(classifyPriorBrandPayout({ brandId: "b", executionStatus: "failed" })).toBe("unresolved");
        for (const status of ["approved", "pending_review", "skipped"]) {
            expect(classifyPriorBrandPayout({ brandId: "b", executionStatus: status })).toBe("none");
        }
    });

    test("blocks are per brand and order, strongest class wins, the current cycle is ignored, cycle status and date are irrelevant", () => {
        const cycles = [
            {
                id: "other-failed-cycle",
                status: "failed",
                calculationSummary: {
                    brands: [
                        { brandId: "b1", executionStatus: "completed", lineItems: [sale("o1"), { lineType: "tds" }] },
                        { brandId: "b2", executionStatus: "processing", metadata: { providerOutcome: "unknown" }, lineItems: [sale("o1")] },
                    ],
                },
            },
            {
                id: "current",
                status: "calculated",
                calculationSummary: { brands: [{ brandId: "b1", executionStatus: "completed", lineItems: [sale("o9")] }] },
            },
            { id: "draft", status: "draft", calculationSummary: {} },
        ];
        const blocks = findPriorPayoutBlocks(cycles, "current");
        expect(blocks.get("b1:o1")).toBe("paid");
        expect(blocks.get("b2:o1")).toBe("unresolved");
        expect(blocks.has("b1:o9")).toBe(false);
        expect(blocks.size).toBe(2);
    });

    test("diagnostics: paid and in-flight orders are excluded, unresolved orders are held", () => {
        expect(priorPayoutDiagnostic("paid")).toEqual({ disposition: "excluded", reason: "prior_cycle_settled" });
        expect(priorPayoutDiagnostic("in_flight")).toEqual({ disposition: "excluded", reason: "prior_payout_in_flight" });
        expect(priorPayoutDiagnostic("unresolved")).toEqual({ disposition: "held", reason: "prior_payout_unresolved" });
    });
});

describe("REN-253 N-2 provider outcome errors", () => {
    test("carry what is needed to classify without leaking details", () => {
        expect(new PayoutProviderRejectedError(422).status).toBe(422);
        expect(new PayoutProviderUnknownOutcomeError("HTTP 504").reason).toBe("HTTP 504");
        const error = new PayoutPersistenceAfterAcceptanceError("cycle-1", "brand-1", "pout_1");
        expect(error.message).toContain("pout_1");
        expect(error.message).toContain("unresolved");
    });
});

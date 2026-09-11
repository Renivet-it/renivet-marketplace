import { expect, test } from "bun:test";
import {
    buildCancellationPayload,
    appendCancellationEvidence,
    extractDelhiveryShipmentStatus,
    isExplicitCancellationSuccess,
    isTerminalCancellationStatus,
} from "@/lib/delhivery/cancellation";

test("REN-173 builds the documented Delhivery cancellation payload", () => {
    expect(buildCancellationPayload("AWB-1")).toEqual({
        waybill: "AWB-1",
        cancellation: "true",
    });
});

test("REN-173 retains bounded versioned cancellation evidence", () => {
    let evidence: unknown = { ordinaryTracking: true };
    for (let index = 0; index < 22; index++) {
        evidence = appendCancellationEvidence(evidence, {
            attemptId: "shipment:awb",
            phase: "verification",
            recordedAt: String(index),
            response: { index },
        });
    }
    const result = evidence as {
        ordinaryTracking: boolean;
        cancellationReconciliation: { version: number; events: unknown[] };
    };
    expect(result.ordinaryTracking).toBe(true);
    expect(result.cancellationReconciliation.version).toBe(1);
    expect(result.cancellationReconciliation.events).toHaveLength(20);
});

test("REN-173 extracts the carrier shipment status", () => {
    expect(
        extractDelhiveryShipmentStatus({
            ShipmentData: [{ Shipment: { Status: { Status: "Returned" } } }],
        })
    ).toBe("Returned");
    expect(extractDelhiveryShipmentStatus({})).toBe("");
});

test("REN-173 accepts only explicit cancellation success", () => {
    expect(isExplicitCancellationSuccess({ status: "Success" })).toBe(true);
    expect(isExplicitCancellationSuccess({ Status: "Cancelled" })).toBe(true);
    expect(isExplicitCancellationSuccess({ message: "accepted" })).toBe(false);
    expect(isExplicitCancellationSuccess({ status: "error" })).toBe(false);
    expect(isExplicitCancellationSuccess(null)).toBe(false);
});

test("REN-173 recognizes only terminal carrier cancellation states", () => {
    expect(isTerminalCancellationStatus("Cancelled")).toBe(true);
    expect(isTerminalCancellationStatus("Returned")).toBe(true);
    expect(isTerminalCancellationStatus("Active")).toBe(false);
    expect(isTerminalCancellationStatus(undefined)).toBe(false);
});

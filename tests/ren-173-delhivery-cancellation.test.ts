import { expect, test } from "bun:test";
import {
    buildCancellationPayload,
    isExplicitCancellationSuccess,
    isTerminalCancellationStatus,
} from "@/lib/delhivery/cancellation";

test("REN-173 builds the documented Delhivery cancellation payload", () => {
    expect(buildCancellationPayload("AWB-1")).toEqual({
        waybill: "AWB-1",
        cancellation: "true",
    });
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

import { expect, test } from "bun:test";
import { isExternalSideEffectsEnabled } from "./external-side-effects";

test("always enables external side effects in production", () => {
    expect(isExternalSideEffectsEnabled(true, false)).toBe(true);
});

test("defaults to enabled outside production but respects an admin kill switch", () => {
    expect(isExternalSideEffectsEnabled(false, undefined)).toBe(true);
    expect(isExternalSideEffectsEnabled(false, true)).toBe(true);
    expect(isExternalSideEffectsEnabled(false, false)).toBe(false);
});

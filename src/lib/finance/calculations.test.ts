import { describe, expect, test } from "bun:test";
import { deriveGstRateBps } from "./calculations";

describe("deriveGstRateBps", () => {
    test("selects the apparel rate from the net base price of one piece", () => {
        expect(
            deriveGstRateBps({
                hsnCode: "6109",
                unitPricePaise: 99_900,
            })
        ).toBe(500);
        expect(
            deriveGstRateBps({
                hsnCode: "6109",
                unitPricePaise: 100_100,
            })
        ).toBe(1200);
    });

    test("keeps the configured rate for an HSN without an apparel threshold", () => {
        expect(
            deriveGstRateBps({
                hsnCode: "9988",
                unitPricePaise: 10_000,
                fallbackRateBps: 1800,
            })
        ).toBe(1800);
    });
});

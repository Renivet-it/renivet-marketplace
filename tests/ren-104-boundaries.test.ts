import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { createRouteErrorLog } from "../src/lib/route-error";

describe("REN-104 route recovery boundaries", () => {
    test("logs only the boundary marker, segment, and digest", () => {
        expect(
            createRouteErrorLog("checkout", {
                digest: "next-digest",
                message: "payment token must never be logged",
                stack: "sensitive stack trace",
            })
        ).toEqual({
            event: "app-route-boundary",
            segment: "checkout",
            digest: "next-digest",
        });
    });

    test("registers recovery boundaries for every approved purchase segment", () => {
        for (const path of [
            "src/app/global-error.tsx",
            "src/app/(protected)/checkout/error.tsx",
            "src/app/(protected)/checkout/loading.tsx",
            "src/app/(protected)/mycart/error.tsx",
            "src/app/(protected)/mycart/loading.tsx",
            "src/app/(protected)/orders/error.tsx",
            "src/app/(protected)/orders/loading.tsx",
        ]) {
            expect(existsSync(path)).toBe(true);
        }
    });
});

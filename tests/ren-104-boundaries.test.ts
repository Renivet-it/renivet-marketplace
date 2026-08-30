import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { createRouteErrorLog, logRouteError } from "../src/lib/route-error";
import { runRouteRecovery } from "../src/lib/route-error-recovery";

async function source(path: string) {
    return Bun.file(new URL(`../${path}`, import.meta.url)).text();
}

describe("REN-104 route recovery boundaries", () => {
    test("logs only the boundary marker, segment, and digest", () => {
        expect(
            createRouteErrorLog(
                "checkout",
                Object.assign(new Error("payment token must never be logged"), {
                    digest: "next-digest",
                })
            )
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

    test("uses only a full page reload for global recovery", () => {
        let reloads = 0;
        let resets = 0;

        runRouteRecovery("global-reload", {
            reload: () => reloads++,
            reset: () => resets++,
        });

        expect({ reloads, resets }).toEqual({ reloads: 1, resets: 0 });
    });

    test("uses only App Router reset for localized recovery", () => {
        let reloads = 0;
        let resets = 0;

        runRouteRecovery("localized-reset", {
            reload: () => reloads++,
            reset: () => resets++,
        });

        expect({ reloads, resets }).toEqual({ reloads: 0, resets: 1 });
    });

    test("contains logging sink failures", () => {
        expect(() =>
            logRouteError("global", { digest: "safe-digest" }, () => {
                throw new Error("logging unavailable");
            })
        ).not.toThrow();
    });

    test("keeps global recovery independent from the storefront graph", async () => {
        const globalRecovery = await source(
            "src/components/globals/errors/global-error-recovery.tsx"
        );

        expect(globalRecovery).not.toContain("@/components/globals/layouts");
        expect(globalRecovery).not.toContain("setTimeout");
        expect(globalRecovery).not.toContain("sessionStorage");
    });

    test("keeps all recovery customer initiated", async () => {
        const localizedRecovery = await source(
            "src/components/globals/errors/route-error-boundary.tsx"
        );

        expect(localizedRecovery).not.toContain("setTimeout");
        expect(localizedRecovery).not.toContain("sessionStorage");
    });
});

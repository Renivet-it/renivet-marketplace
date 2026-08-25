import { expect, test } from "bun:test";
import { isProductionEnvironment } from "./env-context";

test("uses APP_ENV to distinguish separately deployed production and staging apps", () => {
    expect(
        isProductionEnvironment({
            APP_ENV: "production",
            VERCEL_ENV: "production",
            NODE_ENV: "production",
        })
    ).toBe(true);
    expect(
        isProductionEnvironment({
            APP_ENV: "staging",
            VERCEL_ENV: "production",
            NODE_ENV: "production",
        })
    ).toBe(false);
});

test("falls back to Vercel and Node production signals when APP_ENV is absent", () => {
    expect(isProductionEnvironment({ VERCEL_ENV: "production" })).toBe(true);
    expect(isProductionEnvironment({ NODE_ENV: "production" })).toBe(true);
    expect(isProductionEnvironment({ NODE_ENV: "development" })).toBe(false);
});

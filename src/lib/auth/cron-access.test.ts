import { expect, test } from "bun:test";
import { isCronSecretAuthorized } from "./cron-access";

test("accepts the cron secret in the Bearer header or query parameter", () => {
    expect(
        isCronSecretAuthorized("Bearer cron-secret", null, "cron-secret")
    ).toBe(true);
    expect(isCronSecretAuthorized(null, "cron-secret", "cron-secret")).toBe(
        true
    );
});

test("rejects missing, incorrect, and unconfigured cron secrets", () => {
    expect(isCronSecretAuthorized(null, null, "cron-secret")).toBe(false);
    expect(
        isCronSecretAuthorized("Bearer incorrect", null, "cron-secret")
    ).toBe(false);
    expect(isCronSecretAuthorized(null, "cron-secret", undefined)).toBe(false);
});

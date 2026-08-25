import { expect, test } from "bun:test";
import { isTimingSafeSecretMatch } from "./secret-comparison";

test("accepts matching secrets", () => {
    expect(isTimingSafeSecretMatch("shared-secret", "shared-secret")).toBe(
        true
    );
});

test("rejects missing, different, and different-length secrets", () => {
    expect(isTimingSafeSecretMatch(null, "shared-secret")).toBe(false);
    expect(isTimingSafeSecretMatch("other-secret", "shared-secret")).toBe(
        false
    );
    expect(isTimingSafeSecretMatch("short", "shared-secret")).toBe(false);
});

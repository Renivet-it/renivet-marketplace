import { describe, expect, test } from "bun:test";
import { getSafeRedirectUrl } from "./redirect";

describe("getSafeRedirectUrl", () => {
    test("keeps internal paths and their query strings", () => {
        expect(getSafeRedirectUrl("/profile/corporate?tab=orders")).toBe(
            "/profile/corporate?tab=orders"
        );
    });

    test("falls back for unsafe destinations", () => {
        for (const value of [
            "https://evil.example",
            "//evil.example",
            "/\\evil.example",
            "javascript:alert(1)",
            "not-a-path",
            "",
            null,
        ]) {
            expect(getSafeRedirectUrl(value)).toBe("/");
        }
    });

    test("rejects encoded path separators that could become external redirects", () => {
        expect(getSafeRedirectUrl("/%2F%2Fevil.example")).toBe("/");
        expect(getSafeRedirectUrl("/%5C%5Cevil.example")).toBe("/");
    });
});

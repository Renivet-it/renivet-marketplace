import { describe, expect, test } from "bun:test";
import { captureAuthEvent, getAuthEventProperties } from "./auth-analytics";

describe("auth analytics", () => {
    test("builds safe funnel properties without credentials or contact values", () => {
        expect(getAuthEventProperties("sign-in", "phone")).toEqual({
            flow: "sign-in",
            method: "phone",
        });
    });

    test("does not let PostHog capture failures interrupt authentication", () => {
        const posthog = {
            capture: () => {
                throw new Error("PostHog unavailable");
            },
        };

        expect(() =>
            captureAuthEvent(posthog, "auth_signin_initiated", {
                flow: "sign-in",
                method: "email",
            })
        ).not.toThrow();
    });
});

import { describe, expect, test } from "bun:test";
import {
    captureAuthEvent,
    captureAuthInitiation,
    getAuthEventProperties,
    getAuthFlowFromRedirect,
} from "./auth-analytics";

describe("auth analytics", () => {
    test("captures one initiation event for each credential sign-in method", () => {
        for (const method of ["phone", "email"] as const) {
            const captured: Array<{
                event: string;
                properties?: Record<string, string>;
            }> = [];

            captureAuthInitiation(
                {
                    capture: (event, properties) => {
                        captured.push({ event, properties });
                    },
                },
                "sign-in",
                method
            );

            expect(captured).toEqual([
                {
                    event: "auth_signin_initiated",
                    properties: { flow: "sign-in", method },
                },
            ]);
        }
    });

    test("builds safe funnel properties without credentials or contact values", () => {
        expect(getAuthEventProperties("sign-in", "phone")).toEqual({
            flow: "sign-in",
            method: "phone",
        });
    });

    test("does not let PostHog capture failures interrupt authentication", () => {
        const originalConsoleError = console.error;
        const posthog = {
            capture: () => {
                throw new Error("PostHog unavailable");
            },
        };

        console.error = () => undefined;
        try {
            expect(() =>
                captureAuthEvent(posthog, "auth_signin_initiated", {
                    flow: "sign-in",
                    method: "email",
                })
            ).not.toThrow();
        } finally {
            console.error = originalConsoleError;
        }
    });

    test("maps the SSO callback marker to the auth flow", () => {
        expect(getAuthFlowFromRedirect("sign-up")).toBe("sign-up");
        expect(getAuthFlowFromRedirect("sign-in")).toBe("sign-in");
        expect(getAuthFlowFromRedirect(null)).toBe("sign-in");
    });
});

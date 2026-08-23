import { describe, expect, test } from "bun:test";

async function loadResolver() {
    return import("./email-password-sign-in").catch(() => null);
}

describe("resolveEmailPasswordSignIn", () => {
    test("continues with an email code when Clerk requires a second factor", async () => {
        const resolverModule = await loadResolver();

        expect(resolverModule).not.toBeNull();
        if (!resolverModule) return;

        expect(
            resolverModule.resolveEmailPasswordSignIn({
                status: "needs_second_factor",
                createdSessionId: null,
                supportedSecondFactors: [
                    {
                        strategy: "email_code",
                        emailAddressId: "idn_email",
                    },
                ],
            })
        ).toEqual({
            type: "verify-email",
            emailAddressId: "idn_email",
        });
    });

    test("finishes immediately when Clerk creates a session", async () => {
        const resolverModule = await loadResolver();

        expect(resolverModule).not.toBeNull();
        if (!resolverModule) return;

        expect(
            resolverModule.resolveEmailPasswordSignIn({
                status: "complete",
                createdSessionId: "sess_complete",
                supportedSecondFactors: null,
            })
        ).toEqual({ type: "complete", sessionId: "sess_complete" });
    });

    test("reports an unsupported state when email verification is unavailable", async () => {
        const resolverModule = await loadResolver();

        expect(resolverModule).not.toBeNull();
        if (!resolverModule) return;

        expect(
            resolverModule.resolveEmailPasswordSignIn({
                status: "needs_second_factor",
                createdSessionId: null,
                supportedSecondFactors: [{ strategy: "totp" }],
            })
        ).toEqual({ type: "unsupported", status: "needs_second_factor" });
    });
});

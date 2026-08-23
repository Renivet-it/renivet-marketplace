type EmailPasswordSignInAttempt = {
    status: string | null;
    createdSessionId: string | null;
    supportedSecondFactors: Array<{
        strategy: string;
        emailAddressId?: string;
    }> | null;
};

type EmailPasswordSignInResolution =
    | { type: "complete"; sessionId: string }
    | { type: "verify-email"; emailAddressId: string }
    | { type: "unsupported"; status: string | null };

export function resolveEmailPasswordSignIn(
    attempt: EmailPasswordSignInAttempt
): EmailPasswordSignInResolution {
    if (attempt.status === "complete" && attempt.createdSessionId) {
        return { type: "complete", sessionId: attempt.createdSessionId };
    }

    if (attempt.status === "needs_second_factor") {
        const emailCodeFactor = attempt.supportedSecondFactors?.find(
            (factor) =>
                factor.strategy === "email_code" &&
                typeof factor.emailAddressId === "string"
        );

        if (emailCodeFactor?.emailAddressId) {
            return {
                type: "verify-email",
                emailAddressId: emailCodeFactor.emailAddressId,
            };
        }
    }

    return { type: "unsupported", status: attempt.status };
}

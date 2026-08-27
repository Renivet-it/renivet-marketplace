type AuthMethod = "email" | "google" | "phone";
type AuthFlow = "sign-in" | "sign-up";

type PostHogCaptureClient = {
    capture: (event: string, properties?: Record<string, string>) => void;
};

export function getAuthEventProperties(
    flow: AuthFlow,
    method: AuthMethod
): Record<string, string> {
    return { flow, method };
}

export function getAuthFlowFromRedirect(value: string | null): AuthFlow {
    return value === "sign-up" ? "sign-up" : "sign-in";
}

export function captureAuthEvent(
    posthog: PostHogCaptureClient | null | undefined,
    event: string,
    properties: Record<string, string>
) {
    try {
        posthog?.capture(event, properties);
    } catch (error) {
        console.error("Failed to capture auth analytics event:", error);
    }
}

"use client";

import {
    captureAuthEvent,
    getAuthEventProperties,
    getAuthFlowFromRedirect,
} from "@/components/auth/auth-analytics";
import { POSTHOG_EVENTS } from "@/config/posthog";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Suspense, useEffect, useRef } from "react";

function SsoAuthAnalytics() {
    const { isSignedIn } = useAuth();
    const posthog = usePostHog();
    const flow = getAuthFlowFromRedirect(useSearchParams().get("flow"));
    const captured = useRef(false);

    useEffect(() => {
        if (!isSignedIn || captured.current) return;
        captured.current = true;
        captureAuthEvent(
            posthog,
            POSTHOG_EVENTS.AUTH.SIGNED_IN,
            getAuthEventProperties(flow, "google")
        );
    }, [flow, isSignedIn, posthog]);

    return null;
}

export default function Page() {
    return (
        <Suspense>
            <SsoAuthAnalytics />
            <AuthenticateWithRedirectCallback />
        </Suspense>
    );
}

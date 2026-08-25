"use client";

import { useUser } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

type ClerkContactDetails = {
    email?: string;
    phone?: string;
};

export function getPostHogPersonProperties({
    email,
    phone,
}: ClerkContactDetails) {
    return { email, phone };
}

export function PostHogIdentifyBridge() {
    const { isSignedIn, user } = useUser();
    const posthog = usePostHog();

    useEffect(() => {
        if (!posthog) return;

        if (isSignedIn && user) {
            posthog.identify(
                user.id,
                getPostHogPersonProperties({
                    email: user.primaryEmailAddress?.emailAddress,
                    phone: user.primaryPhoneNumber?.phoneNumber,
                })
            );
            return;
        }

        posthog.reset();
    }, [isSignedIn, posthog, user]);

    return null;
}

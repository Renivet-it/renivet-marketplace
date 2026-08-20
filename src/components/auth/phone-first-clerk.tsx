"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

type PhoneFirstClerkProps = {
    mode: "sign-in" | "sign-up";
};

/**
 * Clerk's prebuilt components do not expose an identifier-order prop. This
 * selects Clerk's own "Use phone" control once on initial render, leaving the
 * built-in "Use email" control available as an alternate method.
 */
export function PhoneFirstClerk({ mode }: PhoneFirstClerkProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let selectedPhone = false;
        const selectPhone = () => {
            if (selectedPhone) return;

            const usePhoneControl = Array.from(
                container.querySelectorAll<HTMLElement>("button, a")
            ).find((element) => element.textContent?.trim() === "Use phone");

            if (!usePhoneControl) return;

            selectedPhone = true;
            usePhoneControl.click();
            observer.disconnect();
        };

        const observer = new MutationObserver(selectPhone);
        observer.observe(container, { childList: true, subtree: true });
        selectPhone();

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef}>
            {mode === "sign-in" ? (
                <SignIn routing="hash" signUpUrl="/auth/signup" />
            ) : (
                <SignUp routing="hash" signInUrl="/auth/signin" />
            )}
        </div>
    );
}

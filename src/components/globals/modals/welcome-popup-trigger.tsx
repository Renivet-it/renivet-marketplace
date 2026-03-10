"use client";

import { useGuestPopupStore } from "@/lib/store/use-guest-popup-store";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export function WelcomePopupTrigger() {
    const { isSignedIn, isLoaded } = useAuth();
    const { openPopup } = useGuestPopupStore();

    useEffect(() => {
        if (!isLoaded || isSignedIn) return;

        const hasVisited = localStorage.getItem("renivet-welcome-seen");
        if (!hasVisited) {
            const timer = setTimeout(() => {
                if (!useGuestPopupStore.getState().isOpen) {
                    openPopup("welcome");
                }
                localStorage.setItem("renivet-welcome-seen", "true");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSignedIn, isLoaded, openPopup]);

    return null;
}

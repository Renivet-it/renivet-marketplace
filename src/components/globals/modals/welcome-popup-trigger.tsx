"use client";

import { useGuestPopupStore } from "@/lib/store/use-guest-popup-store";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getWelcomePopupDelay } from "./welcome-popup-policy";

export function WelcomePopupTrigger() {
    const { isSignedIn, isLoaded } = useAuth();
    const { openPopup } = useGuestPopupStore();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoaded || isSignedIn) return;

        const delay = getWelcomePopupDelay({
            pathname,
            hasVisited: localStorage.getItem("renivet-welcome-seen") === "true",
        });
        if (delay === null) return;

        const timer = setTimeout(() => {
            if (pathname === "/rewear" || !useGuestPopupStore.getState().isOpen) {
                openPopup("welcome");
            }
            localStorage.setItem("renivet-welcome-seen", "true");
        }, delay);
        return () => clearTimeout(timer);
    }, [isSignedIn, isLoaded, openPopup, pathname]);

    return null;
}

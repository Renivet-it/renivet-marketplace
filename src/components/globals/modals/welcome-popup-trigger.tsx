"use client";

import { useGuestPopupStore } from "@/lib/store/use-guest-popup-store";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

const PENDING_PHONE_KEY = "renivet-pending-phone-lead";

function hasRealPhone(phone?: string | null) {
    return !!phone && !phone.startsWith("pending:") && phone.length >= 10;
}

export function WelcomePopupTrigger() {
    const { isSignedIn, isLoaded } = useAuth();
    const { openPopup } = useGuestPopupStore();
    const utils = trpc.useUtils();

    const { data: user } = trpc.general.users.currentUser.useQuery(undefined, {
        enabled: !!isSignedIn,
        retry: false,
    });

    const { mutate: claimPhone, isPending: isClaimingPhone } =
        trpc.general.users.claimPhoneLead.useMutation({
            onSuccess: async () => {
                localStorage.removeItem(PENDING_PHONE_KEY);
                localStorage.setItem("renivet-phone-offer-seen", "true");
                await utils.general.users.currentUser.invalidate();
            },
        });

    useEffect(() => {
        if (!isLoaded) return;

        if (isSignedIn) {
            if (!user || hasRealPhone(user.phone)) return;

            const pendingPhone = localStorage.getItem(PENDING_PHONE_KEY);
            if (pendingPhone && !isClaimingPhone) {
                claimPhone({ phone: pendingPhone });
                return;
            }

            const hasSeen = localStorage.getItem("renivet-phone-offer-seen");
            if (!hasSeen && !useGuestPopupStore.getState().isOpen) {
                const timer = setTimeout(() => {
                    openPopup("welcome");
                }, 1200);
                localStorage.setItem("renivet-phone-offer-seen", "true");
                return () => clearTimeout(timer);
            }

            return;
        }

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
    }, [isSignedIn, isLoaded, user, openPopup, claimPhone, isClaimingPhone]);

    return null;
}

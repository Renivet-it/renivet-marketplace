"use client";

import { pageview } from "@/lib/fbpixel";
import { useUser } from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function FacebookPixel() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, isLoaded } = useUser();
    const searchParamsString = searchParams?.toString();
    const hasEnriched = useRef(false);

    // Enrich pixel with user data once available (non-blocking)
    useEffect(() => {
        if (
            isLoaded &&
            user &&
            !hasEnriched.current &&
            typeof window !== "undefined" &&
            window.fbq
        ) {
            window.fbq(
                "init",
                process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "618442627790500",
                {
                    em: user.emailAddresses?.[0]?.emailAddress,
                    ph: user.phoneNumbers?.[0]?.phoneNumber,
                    fn: user.firstName,
                    ln: user.lastName,
                    external_id: user.id,
                }
            );
            hasEnriched.current = true;
        }
    }, [isLoaded, user]);

    // Track page views
    useEffect(() => {
        pageview();
    }, [pathname, searchParamsString]);

    return null;
}

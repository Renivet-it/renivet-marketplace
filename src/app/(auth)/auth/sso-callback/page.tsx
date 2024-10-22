"use client";

import { Spinner } from "@/components/ui/spinner";
import { getAbsoluteURL } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function Page() {
    const { handleRedirectCallback } = useClerk();

    useEffect(() => {
        handleRedirectCallback({
            redirectUrl: getAbsoluteURL("/dashboard"),
            afterSignInUrl: getAbsoluteURL("/dashboard"),
            afterSignUpUrl: getAbsoluteURL("/dashboard"),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Spinner />;
}

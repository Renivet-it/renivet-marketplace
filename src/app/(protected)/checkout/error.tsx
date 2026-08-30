"use client";

import { RouteErrorBoundary } from "@/components/globals/errors/route-error-boundary";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <RouteErrorBoundary
            error={error}
            reset={reset}
            segment="checkout"
            storefrontShell
        />
    );
}

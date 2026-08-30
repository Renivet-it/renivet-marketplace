"use client";

import { RouteErrorBoundary } from "@/components/globals/errors/route-error-boundary";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body>
                <RouteErrorBoundary
                    error={error}
                    reset={reset}
                    segment="global"
                />
            </body>
        </html>
    );
}

"use client";

import { GlobalErrorRecovery } from "@/components/globals/errors/global-error-recovery";

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
                <GlobalErrorRecovery error={error} reset={reset} />
            </body>
        </html>
    );
}

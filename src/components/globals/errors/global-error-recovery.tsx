"use client";

import { logRouteError } from "@/lib/route-error";
import { runRouteRecovery } from "@/lib/route-error-recovery";
import { useEffect } from "react";

type GlobalErrorRecoveryProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export function GlobalErrorRecovery({
    error,
    reset,
}: GlobalErrorRecoveryProps) {
    useEffect(() => {
        logRouteError("global", error);
    }, [error]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#fcfcf5] px-4 py-10">
            <section
                aria-labelledby="global-error-title"
                className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border bg-white p-8 text-center shadow-sm"
            >
                <h1 id="global-error-title" className="text-xl font-semibold">
                    We couldn’t load this page
                </h1>
                <p className="text-sm text-muted-foreground">
                    Something interrupted the connection. Your information is
                    safe—please try loading the page again.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <button
                        type="button"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        onClick={() =>
                            runRouteRecovery("global-reload", {
                                reload: () => window.location.reload(),
                                reset,
                            })
                        }
                    >
                        Try again
                    </button>
                    <a
                        href="/shop"
                        className="rounded-md border px-4 py-2 text-sm font-medium"
                    >
                        Continue shopping
                    </a>
                </div>
            </section>
        </main>
    );
}

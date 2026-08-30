"use client";

import { NavbarHome, NavbarMob } from "@/components/globals/layouts";
import { createRouteErrorLog } from "@/lib/route-error";
import { useEffect } from "react";

type RouteErrorBoundaryProps = {
    error: Error & { digest?: string };
    reset: () => void;
    segment: string;
    storefrontShell?: boolean;
};

function RecoveryContent({ reset }: Pick<RouteErrorBoundaryProps, "reset">) {
    return (
        <section
            aria-labelledby="route-error-title"
            className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border bg-white p-8 text-center shadow-sm"
        >
            <h1 id="route-error-title" className="text-xl font-semibold">
                We couldn’t load this page
            </h1>
            <p className="text-sm text-muted-foreground">
                Your cart, payment, and order details have not been changed.
                Please try again or return to shopping.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                <button
                    type="button"
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    onClick={reset}
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
    );
}

export function RouteErrorBoundary({
    error,
    reset,
    segment,
    storefrontShell = false,
}: RouteErrorBoundaryProps) {
    useEffect(() => {
        console.error(createRouteErrorLog(segment, error));
    }, [error, segment]);

    const content = <RecoveryContent reset={reset} />;

    if (!storefrontShell) {
        return <div className="p-6">{content}</div>;
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-[#fcfcf5]">
            <NavbarHome />
            <main className="flex flex-1 items-center px-4 py-10">
                {content}
            </main>
            <footer className="border-t bg-white px-4 py-6 text-sm text-muted-foreground">
                <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2">
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/terms">Terms of Services</a>
                    <a href="/contact">Contact</a>
                </div>
            </footer>
            <NavbarMob />
        </div>
    );
}

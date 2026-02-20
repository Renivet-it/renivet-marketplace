"use client";

import { env } from "@/../env";
import { trpc } from "@/lib/trpc/client";
import { getAbsoluteURL } from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Suspense, useEffect, useState } from "react";
import superjson from "superjson";
import { PostHogPageView } from "../globals/posthog";

export function ClientProvider({ children }: LayoutProps) {
    const [queryClient] = useState(() => new QueryClient());

    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    url: getAbsoluteURL("/api/trpc"),
                    transformer: superjson,
                }),
                loggerLink({
                    enabled: (opts) =>
                        process.env.NODE_ENV === "development" ||
                        (opts.direction === "down" &&
                            opts.result instanceof Error),
                }),
            ],
        })
    );

    useEffect(() => {
        // Delay PostHog initialization by 5 seconds so it doesn't block the initial page load (hydration)
        // and doesn't get penalized by Google PageSpeed Insights.
        // PostHog will queue all events (like the initial page view) and flush them when initialized.
        const timer = setTimeout(() => {
            posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
                capture_pageview: false,
                capture_pageleave: true,
            });
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <PostHogProvider client={posthog}>
            <Suspense>
                <PostHogPageView />
            </Suspense>

            <trpc.Provider client={trpcClient} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                    <NuqsAdapter>
                        <NextThemesProvider
                            attribute="class"
                            defaultTheme="light"
                        >
                            {children}
                        </NextThemesProvider>
                    </NuqsAdapter>

                    <ReactQueryDevtools />
                </QueryClientProvider>
            </trpc.Provider>
        </PostHogProvider>
    );
}

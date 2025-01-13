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
        posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
            capture_pageview: false,
            capture_pageleave: true,
        });
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

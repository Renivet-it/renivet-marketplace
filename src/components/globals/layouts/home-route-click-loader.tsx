"use client";

import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 180;
const FALLBACK_HIDE_MS = 5000;

export function HomeRouteClickLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isVisible, setIsVisible] = useState(false);
    const startedAtRef = useRef(0);
    const fallbackTimerRef = useRef<number | null>(null);
    const hideTimerRef = useRef<number | null>(null);
    const searchKey = searchParams.toString();

    const clearTimers = useCallback(() => {
        if (fallbackTimerRef.current !== null) {
            window.clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }

        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        const onDocumentClickCapture = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const anchor = target.closest("a");
            if (!(anchor instanceof HTMLAnchorElement)) {
                return;
            }

            if (
                anchor.classList.contains("home-product-link") ||
                anchor.dataset.noRouteLoader === "true" ||
                (anchor.target !== "" && anchor.target !== "_self") ||
                anchor.hasAttribute("download")
            ) {
                return;
            }

            const href = anchor.getAttribute("href");
            if (
                !href ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:")
            ) {
                return;
            }

            let nextUrl: URL;
            try {
                nextUrl = new URL(anchor.href, window.location.href);
            } catch {
                return;
            }

            if (
                !["http:", "https:"].includes(nextUrl.protocol) ||
                nextUrl.origin !== window.location.origin ||
                (nextUrl.pathname === window.location.pathname &&
                    nextUrl.search === window.location.search)
            ) {
                return;
            }

            if (isVisible) {
                return;
            }

            clearTimers();
            startedAtRef.current = Date.now();
            setIsVisible(true);

            fallbackTimerRef.current = window.setTimeout(() => {
                setIsVisible(false);
                clearTimers();
            }, FALLBACK_HIDE_MS);
        };

        document.addEventListener("click", onDocumentClickCapture, true);

        return () => {
            document.removeEventListener("click", onDocumentClickCapture, true);
            clearTimers();
        };
    }, [clearTimers, isVisible]);

    useEffect(() => {
        if (!isVisible) {
            return;
        }

        const elapsed = Date.now() - startedAtRef.current;
        const waitMs = Math.max(0, MIN_VISIBLE_MS - elapsed);

        clearTimers();
        hideTimerRef.current = window.setTimeout(() => {
            setIsVisible(false);
            clearTimers();
        }, waitMs);
    }, [clearTimers, pathname, searchKey, isVisible]);

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-0 z-[140] transition-opacity duration-150",
                isVisible ? "opacity-100" : "opacity-0"
            )}
        >
            <div className="absolute inset-0 bg-[#FCFBF4]/45 backdrop-blur-[1.5px]" />

            <div
                className={cn(
                    "absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/92 shadow-md backdrop-blur-sm transition-all duration-150",
                    isVisible ? "scale-100" : "scale-90"
                )}
            >
                <span className="relative block size-6">
                    <span className="absolute inset-0 rounded-full border-2 border-[#d7c49c]" />
                    <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[#8E6C2E] border-t-[#8E6C2E]" />
                </span>
            </div>
        </div>
    );
}

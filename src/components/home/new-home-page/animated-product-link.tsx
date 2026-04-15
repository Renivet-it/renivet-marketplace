"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface AnimatedProductLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    target?: string;
    rel?: string;
    prefetch?: boolean;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const REDIRECT_DELAY_MS = 220;

export function AnimatedProductLink({
    href,
    children,
    className,
    target,
    rel,
    prefetch,
    onClick,
}: AnimatedProductLinkProps) {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const isProductHref = href.startsWith("/products/");
    const resolvedTarget = target ?? (isProductHref ? "_blank" : undefined);
    const resolvedRel =
        resolvedTarget === "_blank" ? rel ?? "noopener noreferrer" : rel;

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) {
            return;
        }

        const isModifiedClick =
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0;

        if (isModifiedClick || resolvedTarget === "_blank") {
            return;
        }

        event.preventDefault();

        if (isRedirecting) {
            return;
        }

        setIsRedirecting(true);
        timeoutRef.current = window.setTimeout(() => {
            router.push(href);
        }, REDIRECT_DELAY_MS);
    };

    return (
        <Link
            href={href}
            target={resolvedTarget}
            rel={resolvedRel}
            prefetch={prefetch}
            aria-busy={isRedirecting}
            data-redirecting={isRedirecting ? "true" : "false"}
            onClick={handleClick}
            className={cn(
                "home-product-link relative block overflow-hidden transition duration-200 ease-out",
                isRedirecting && "scale-[0.985]",
                className
            )}
        >
            <span
                className={cn(
                    "relative z-[1] block transition duration-200",
                    isRedirecting && "opacity-95"
                )}
            >
                {children}
            </span>

            <span
                aria-hidden="true"
                className={cn(
                    "home-product-link__overlay pointer-events-none absolute inset-0 z-[2] rounded-[inherit] opacity-0 transition duration-200",
                    isRedirecting && "opacity-100"
                )}
            />

            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-y-0 left-[-35%] z-[3] w-[36%] bg-white/70 opacity-0 blur-xl",
                    isRedirecting && "home-product-link__sheen"
                )}
            />

            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[2px] origin-left scale-x-0 bg-[#8E6C2E] opacity-0 transition duration-200",
                    isRedirecting && "scale-x-100 opacity-100"
                )}
            />

            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute left-1/2 top-1/2 z-[5] flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/92 shadow-md transition duration-200 backdrop-blur-sm",
                    isRedirecting
                        ? "scale-100 opacity-100"
                        : "scale-90 opacity-0"
                )}
            >
                <span className="relative block size-5">
                    <span className="absolute inset-0 rounded-full border-2 border-[#d7c49c]" />
                    <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[#8E6C2E] border-t-[#8E6C2E]" />
                </span>
            </span>
        </Link>
    );
}

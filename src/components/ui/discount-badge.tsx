"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type DiscountBadgeProps = {
    discount: number;
    className?: string;
    textClassName?: string;
    compact?: boolean;
};

export function DiscountBadge({
    discount,
    className,
    textClassName,
    compact = false,
}: DiscountBadgeProps) {
    if (!discount || discount <= 0) {
        return null;
    }

    const badgeStyle = {
        backgroundImage:
            "linear-gradient(135deg, rgba(251,247,239,0.74) 0%, rgba(245,236,220,0.38) 55%, hsl(var(--primary) / 0.14) 100%)",
        borderColor: "rgba(232,218,194,0.62)",
        color: "hsl(var(--primary))",
        "--discount-notch": "rgba(244,232,211,0.72)",
    } as CSSProperties;

    return (
        <span
            style={badgeStyle}
            className={cn(
                "relative inline-flex items-center overflow-visible rounded-l-sm rounded-r-none border-y border-l shadow-[0_10px_28px_rgba(24,28,44,0.18)] backdrop-blur-md",
                compact ? "px-2 py-1" : "px-2.5 py-1.5",
                className
            )}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.32)_0%,rgba(255,248,238,0.14)_45%,rgba(255,255,255,0)_100%)]"
            />
            <span
                className={cn(
                    "relative flex items-baseline gap-1 whitespace-nowrap",
                    textClassName
                )}
            >
                <span
                    className={cn(
                        "font-extrabold leading-none text-[hsl(var(--primary))] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]",
                        compact ? "text-[10px]" : "text-[11px]"
                    )}
                >
                    {discount}%
                </span>
                <span
                    className={cn(
                        "font-bold uppercase leading-none tracking-[0.18em] text-[hsl(var(--foreground)/0.78)]",
                        compact ? "text-[8px]" : "text-[9px]"
                    )}
                >
                    Off
                </span>
            </span>

            <span
                aria-hidden="true"
                className={cn(
                    "absolute right-[-8px] top-0 h-0 w-0 border-b-transparent border-t-transparent drop-shadow-[4px_6px_10px_rgba(24,28,44,0.14)]",
                    compact
                        ? "border-b-[12px] border-l-[8px] border-l-[var(--discount-notch)] border-t-[12px]"
                        : "border-b-[14px] border-l-[8px] border-l-[var(--discount-notch)] border-t-[14px]"
                )}
            />
        </span>
    );
}

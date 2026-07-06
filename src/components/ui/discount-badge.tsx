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
            "linear-gradient(135deg, rgba(246,235,221,0.92) 0%, rgba(250,243,234,0.82) 58%, rgba(239,226,208,0.88) 100%)",
        borderColor: "rgba(231,211,188,0.9)",
        color: "#7A5C3E",
        "--discount-notch": "rgba(239,226,208,0.96)",
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
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.38)_0%,rgba(255,248,241,0.18)_42%,rgba(255,255,255,0)_100%)]"
            />
            <span
                className={cn(
                    "relative flex items-baseline gap-1 whitespace-nowrap",
                    textClassName
                )}
            >
                <span
                    className={cn(
                        "font-extrabold leading-none text-[#7A5C3E] drop-shadow-[0_1px_0_rgba(255,255,255,0.38)]",
                        compact ? "text-[10px]" : "text-[11px]"
                    )}
                >
                    {discount}%
                </span>
                <span
                    className={cn(
                        "font-bold uppercase leading-none tracking-[0.18em] text-[#8A6A49]",
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

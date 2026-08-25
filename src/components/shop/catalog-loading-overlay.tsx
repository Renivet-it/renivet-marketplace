"use client";

import { Sparkles } from "lucide-react";
import { createPortal } from "react-dom";
import { Icons } from "../icons";

export function CatalogLoadingOverlay({
    open,
    eyebrow,
    detail,
}: {
    open: boolean;
    eyebrow: string;
    detail?: string;
}) {
    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] grid min-h-dvh place-items-center bg-[#fbfaf5]/90 px-4 py-6 backdrop-blur-md sm:px-6"
            role="status"
            aria-live="polite"
        >
            <div className="relative flex w-full max-w-[min(360px,calc(100vw-32px))] flex-col items-center overflow-hidden rounded-3xl border border-[#e5ded1] bg-white px-6 py-8 text-center shadow-[0_28px_90px_rgba(50,45,35,0.22)] sm:px-8 sm:py-9">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2f3a1f] via-[#c8a968] to-[#2f3a1f]" />
                <div className="relative mb-5 flex size-20 items-center justify-center sm:mb-6 sm:size-24">
                    <div className="absolute inset-0 rounded-full border border-[#efe8dc]" />
                    <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-r-[#c8a968] border-t-primary" />
                    <div className="absolute inset-5 rounded-full bg-[#f8f4eb]" />
                    <div className="relative flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_34px_rgba(49,58,31,0.28)] sm:size-12">
                        <Icons.Search className="size-5" />
                    </div>
                    <Sparkles className="absolute right-1 top-2 size-4 animate-pulse text-[#c8a968]" />
                    <Sparkles className="absolute bottom-3 left-2 size-3 animate-pulse text-primary" />
                </div>
                <p className="text-11 font-bold uppercase tracking-[0.22em] text-[#8f8167]">
                    {eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-normal text-[#2f2a23] sm:text-xl">
                    Finding your best matches
                </h3>
                {detail && (
                    <p className="mt-2 max-w-full truncate text-sm font-medium text-[#6f6657]">
                        &ldquo;{detail}&rdquo;
                    </p>
                )}
                <div className="mt-6 flex items-center gap-1.5">
                    <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                    <span className="size-2 animate-bounce rounded-full bg-[#c8a968] [animation-delay:-0.1s]" />
                    <span className="size-2 animate-bounce rounded-full bg-primary" />
                </div>
            </div>
        </div>,
        document.body
    );
}

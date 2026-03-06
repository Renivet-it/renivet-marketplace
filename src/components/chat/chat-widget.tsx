"use client";

import { useChatStore } from "@/lib/store/chat-store";
import { useEffect, useState } from "react";
import { ChatWindow } from "./chat-window";

export function ChatWidget() {
    const { isOpen, toggleOpen } = useChatStore();
    const [mounted, setMounted] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => setAnimateIn(true), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    return (
        <>
            {/* Chat Window */}
            <div
                className={`fixed z-[9999] transition-all duration-300 ease-in-out ${
                    isOpen
                        ? "pointer-events-auto scale-100 opacity-100"
                        : "pointer-events-none scale-95 opacity-0"
                } inset-0 md:inset-auto md:bottom-28 md:right-6 md:h-[600px] md:w-[400px] md:rounded-2xl md:shadow-2xl`}
            >
                <div className="flex h-full flex-col overflow-hidden bg-white md:rounded-2xl md:border md:border-gray-200">
                    <ChatWindow />
                </div>
            </div>

            {/* Floating Action Button — Premium Gradient Design */}
            <button
                onClick={toggleOpen}
                className={`group fixed bottom-6 right-6 z-[10000] flex size-16 items-center justify-center rounded-full transition-all duration-500 ease-out ${
                    animateIn
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-12 scale-50 opacity-0"
                } ${
                    isOpen
                        ? "bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg shadow-gray-400/30"
                        : "bg-gradient-to-br from-[hsl(72,30%,25%)] via-[hsl(72,19%,16%)] to-[hsl(150,25%,15%)] shadow-xl shadow-[hsl(72,19%,16%)]/40 hover:shadow-2xl hover:shadow-[hsl(72,19%,16%)]/50"
                } `}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                {/* Animated ring pulse — only when closed */}
                {!isOpen && (
                    <>
                        <span className="absolute inset-0 animate-ping rounded-full bg-[hsl(72,19%,16%)] opacity-20" />
                        <span className="absolute -inset-1 animate-pulse rounded-full bg-gradient-to-br from-[hsl(72,30%,30%)] to-[hsl(150,25%,20%)] opacity-20 blur-sm" />
                    </>
                )}

                {/* Icon with smooth rotation */}
                <span
                    className={`relative z-10 transition-all duration-500 ${
                        isOpen ? "rotate-90 scale-90" : "rotate-0 scale-100"
                    }`}
                >
                    {isOpen ? (
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    ) : (
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="drop-shadow-sm"
                        >
                            {/* Chat bubble with gradient fill */}
                            <path
                                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                                fill="rgba(255,255,255,0.15)"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Three animated dots */}
                            <circle
                                cx="9"
                                cy="12"
                                r="1.2"
                                fill="white"
                                className="animate-pulse"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="1.2"
                                fill="white"
                                className="animate-pulse"
                                style={{ animationDelay: "150ms" }}
                            />
                            <circle
                                cx="15"
                                cy="12"
                                r="1.2"
                                fill="white"
                                className="animate-pulse"
                                style={{ animationDelay: "300ms" }}
                            />
                        </svg>
                    )}
                </span>

                {/* Hover glow ring */}
                <span className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
            </button>

            {/* Tooltip — shows briefly after load */}
            {!isOpen && animateIn && <ChatTooltip />}
        </>
    );
}

// ---------- Tooltip ----------

function ChatTooltip() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const showTimer = setTimeout(() => setShow(true), 2500);
        const hideTimer = setTimeout(() => setShow(false), 8000);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (!show) return null;

    return (
        <div
            className="fixed bottom-[100px] right-6 z-[10000] rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl"
            style={{
                animation:
                    "tooltipFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
        >
            <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(72,25%,92%)] to-[hsl(150,20%,90%)]">
                    <span className="text-base">✨</span>
                </span>
                <div>
                    <p className="text-sm font-semibold text-gray-800">
                        Need help?
                    </p>
                    <p className="text-xs text-gray-400">
                        Ask Sage, your AI shopping assistant
                    </p>
                </div>
            </div>

            {/* Tooltip arrow */}
            <div className="absolute -bottom-1.5 right-8 size-3 rotate-45 border-b border-r border-gray-100 bg-white" />

            <style jsx>{`
                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

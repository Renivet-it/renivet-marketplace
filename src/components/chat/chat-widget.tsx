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
        // Entrance animation for the fab
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
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-4 opacity-0"
                } /* Mobile: full screen */ /* Desktop: popup */ bottom-0 left-0 right-0 top-0 md:bottom-24 md:left-auto md:right-6 md:top-auto md:h-[600px] md:w-[400px] md:rounded-2xl md:border md:border-gray-200 md:shadow-2xl`}
                style={{
                    ...(isOpen
                        ? {}
                        : { transform: "translateY(16px) scale(0.95)" }),
                }}
            >
                <div className="flex h-full flex-col overflow-hidden bg-white md:rounded-2xl">
                    <ChatWindow />
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={toggleOpen}
                className={`fixed bottom-6 right-6 z-[10000] flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
                    animateIn
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                } ${
                    isOpen
                        ? "rotate-0 bg-gray-700 hover:bg-gray-800"
                        : "rotate-0 bg-[hsl(72,19%,16%)] hover:bg-[hsl(72,19%,22%)] hover:shadow-xl"
                }`}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                {isOpen ? (
                    /* Close icon */
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                ) : (
                    /* Chat icon */
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M8 10h.01" />
                        <path d="M12 10h.01" />
                        <path d="M16 10h.01" />
                    </svg>
                )}
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
        const showTimer = setTimeout(() => setShow(true), 2000);
        const hideTimer = setTimeout(() => setShow(false), 7000);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (!show) return null;

    return (
        <div
            className="fixed bottom-[88px] right-6 z-[10000] animate-[fadeInUp_0.3s_ease-out] rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-lg"
            style={{
                animation: "fadeInUp 0.3s ease-out forwards",
            }}
        >
            👋 Need help finding something?
            <div className="absolute -bottom-1.5 right-6 size-3 rotate-45 border-b border-r border-gray-100 bg-white" />
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

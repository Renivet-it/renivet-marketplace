"use client";

import { useChatStore, type ChatMessage } from "@/lib/store/chat-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatProductCarousel } from "./chat-product-card";

// ---------- Typing Indicator ----------

function TypingIndicator() {
    return (
        <div className="flex items-start gap-2.5 px-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[hsl(72,19%,16%)]">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2.5">
                <div className="flex gap-1">
                    <span
                        className="inline-block size-2 rounded-full bg-gray-400"
                        style={{
                            animation: "chatBounce 1.4s infinite ease-in-out",
                            animationDelay: "0ms",
                        }}
                    />
                    <span
                        className="inline-block size-2 rounded-full bg-gray-400"
                        style={{
                            animation: "chatBounce 1.4s infinite ease-in-out",
                            animationDelay: "200ms",
                        }}
                    />
                    <span
                        className="inline-block size-2 rounded-full bg-gray-400"
                        style={{
                            animation: "chatBounce 1.4s infinite ease-in-out",
                            animationDelay: "400ms",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

// ---------- Message Bubble ----------

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <div
            className={`flex items-start gap-2.5 px-4 ${isUser ? "flex-row-reverse" : ""}`}
        >
            {/* Avatar */}
            {!isUser && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[hsl(72,19%,16%)]">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
            )}

            <div className={`max-w-[85%] ${isUser ? "ml-auto" : ""}`}>
                <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        isUser
                            ? "rounded-tr-sm bg-[hsl(72,19%,16%)] text-white"
                            : "rounded-tl-sm bg-gray-100 text-gray-800"
                    }`}
                >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                </div>

                {/* Product Cards */}
                {message.products && message.products.length > 0 && (
                    <ChatProductCarousel products={message.products} />
                )}
            </div>
        </div>
    );
}

// ---------- Quick Suggestions ----------

const QUICK_SUGGESTIONS = [
    "🛍️ Show me trending products",
    "👗 Sustainable women's fashion",
    "👕 Men's eco-friendly clothing",
    "🏠 Home & living essentials",
    "✨ What's new on Renivet?",
];

function QuickSuggestions({ onSelect }: { onSelect: (text: string) => void }) {
    return (
        <div className="px-4 py-3">
            <p className="mb-2.5 text-xs font-medium text-gray-400">
                Quick suggestions
            </p>
            <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => onSelect(suggestion)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-all hover:border-[hsl(72,19%,16%)] hover:bg-[hsl(72,19%,96%)] hover:text-[hsl(72,19%,16%)]"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ---------- Main Chat Window ----------

export function ChatWindow() {
    const { messages, isLoading, addMessage, setLoading, setOpen } =
        useChatStore();
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, scrollToBottom]);

    useEffect(() => {
        // Focus input on open
        const timer = setTimeout(() => inputRef.current?.focus(), 300);
        return () => clearTimeout(timer);
    }, []);

    const handleSend = async (text?: string) => {
        const messageText = (text || inputValue).trim();
        if (!messageText || isLoading) return;

        setInputValue("");

        // Add user message
        addMessage({ role: "user", content: messageText });
        setLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText,
                    history: messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            });

            const data = await response.json();

            addMessage({
                role: "assistant",
                content: data.content || "Sorry, I couldn't process that.",
                products: data.products || [],
            });
        } catch {
            addMessage({
                role: "assistant",
                content:
                    "I'm having trouble connecting. Please try again in a moment!",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-[hsl(72,19%,16%)] px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-full bg-white/15">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Reni
                        </h3>
                        <p className="text-[11px] text-white/60">
                            Your sustainable shopping assistant
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setOpen(false)}
                    className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Close chat"
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex h-full flex-col">
                        {/* Welcome */}
                        <div className="px-4 pb-3 pt-5">
                            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[hsl(72,19%,94%)]">
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="hsl(72,19%,16%)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900">
                                Hi there! I&apos;m Reni 👋
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-500">
                                Your sustainable shopping assistant. Ask me
                                about products, brands, or anything about
                                conscious fashion!
                            </p>
                        </div>

                        <div className="mt-auto">
                            <QuickSuggestions onSelect={handleSend} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 py-4">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        {isLoading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t bg-white p-3">
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 transition-colors focus-within:border-[hsl(72,19%,16%)] focus-within:bg-white">
                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about products, styles..."
                        className="flex-1 bg-transparent py-1.5 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                        maxLength={500}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() || isLoading}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(72,19%,16%)] text-white transition-all hover:bg-[hsl(72,19%,22%)] disabled:opacity-40"
                        aria-label="Send message"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m22 2-7 20-4-9-9-4 20-7z" />
                            <path d="m22 2-11 11" />
                        </svg>
                    </button>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-gray-300">
                    Powered by Renivet AI
                </p>
            </div>

            {/* Bounce Animation */}
            <style jsx global>{`
                @keyframes chatBounce {
                    0%,
                    80%,
                    100% {
                        transform: scale(0);
                    }
                    40% {
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

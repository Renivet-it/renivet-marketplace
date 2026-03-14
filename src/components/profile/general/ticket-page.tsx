"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Loader2,
    RefreshCw,
    Send,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface TicketData {
    id: string;
    title: string;
    status: string;
    category: string;
    issueType: string;
    orderId: string | null;
    createdAt: Date;
    description: string | null;
}

interface TicketPageProps {
    initialTicket: TicketData;
}

export function TicketPage({ initialTicket }: TicketPageProps) {
    const [msgText, setMsgText] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Ticket data
    const ticketQuery = trpc.general.userSupport.getTicket.useQuery(
        initialTicket.id
    );
    const ticket = ticketQuery.data ?? initialTicket;

    // Messages
    const { data: messages, refetch: refetchMessages } =
        trpc.general.userSupport.getMessages.useQuery(initialTicket.id);

    // Send message mutation
    const sendMutation = trpc.general.userSupport.sendMessage.useMutation({
        onSuccess: () => {
            setMsgText("");
            refetchMessages();
        },
        onError: () => {
            toast.error("Failed to send message");
        },
    });

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const isResolved = ticket?.status === "resolved";
    const hasHumanSupportReply =
        messages?.some(
            (msg) => msg.sender === "admin" && msg.senderId !== "support-bot"
        ) ?? false;
    const isAssistantHandling =
        ticket?.category === "order" && !isResolved && !hasHumanSupportReply;

    const handleSend = () => {
        if (!msgText.trim()) return;
        sendMutation.mutate({
            ticketId: initialTicket.id,
            text: msgText.trim(),
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const statusConfig: Record<
        string,
        {
            color: string;
            bgColor: string;
            icon: React.ElementType;
            label: string;
        }
    > = {
        open: {
            color: "text-amber-700",
            bgColor: "bg-amber-50 border-amber-200",
            icon: AlertCircle,
            label: "Open",
        },
        in_progress: {
            color: "text-blue-700",
            bgColor: "bg-blue-50 border-blue-200",
            icon: RefreshCw,
            label: "In Progress",
        },
        resolved: {
            color: "text-green-700",
            bgColor: "bg-green-50 border-green-200",
            icon: CheckCircle,
            label: "Resolved",
        },
    };

    const config = statusConfig[ticket?.status ?? "open"] ?? statusConfig.open;
    const StatusIcon = config.icon;

    return (
        <div
            className="flex min-w-0 flex-1 flex-col"
            style={{ minHeight: 600 }}
        >
            {/* Header */}
            <div className="mb-4">
                <Link
                    href="/profile/help-center"
                    className="mb-3 inline-flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700"
                >
                    <ArrowLeft className="size-4" />
                    Back to Help Center
                </Link>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg font-bold text-gray-900">
                                {ticket?.title}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className="capitalize">
                                    {ticket?.category}
                                </span>
                                <span>•</span>
                                <span>
                                    {ticket?.issueType?.replace(/_/g, " ")}
                                </span>
                                {ticket?.orderId && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            Order #{ticket.orderId.slice(0, 8)}
                                        </span>
                                    </>
                                )}
                                <span>•</span>
                                <span>
                                    {ticket?.createdAt
                                        ? format(
                                              new Date(ticket.createdAt),
                                              "dd MMM yyyy, hh:mm a"
                                          )
                                        : ""}
                                </span>
                            </div>
                        </div>
                        <span
                            className={cn(
                                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                                config.bgColor,
                                config.color
                            )}
                        >
                            <StatusIcon className="size-3.5" />
                            {config.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                {/* Messages */}
                <div
                    className="flex-1 space-y-4 overflow-y-auto p-4"
                    style={{ maxHeight: 450 }}
                >
                    {/* System message */}
                    <div className="flex justify-center">
                        <div className="rounded-full bg-gray-100 px-4 py-1.5 text-xs text-gray-500">
                            Ticket created •{" "}
                            {ticket?.createdAt
                                ? format(
                                      new Date(ticket.createdAt),
                                      "dd MMM yyyy"
                                  )
                                : ""}
                        </div>
                    </div>

                    {messages?.map((msg) => {
                        const isUser = msg.sender === "user";
                        const isSupportAssistant =
                            !isUser && msg.senderId === "support-bot";
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex",
                                    isUser ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-2xl px-4 py-3",
                                        isUser
                                            ? "rounded-br-md bg-blue-600 text-white"
                                            : isSupportAssistant
                                              ? "rounded-bl-md border border-[#D7E7F8] bg-[#F5FAFF] text-gray-900"
                                              : "rounded-bl-md bg-gray-100 text-gray-900"
                                    )}
                                >
                                    {!isUser && (
                                        <p
                                            className={cn(
                                                "mb-1 text-[10px] font-semibold",
                                                isSupportAssistant
                                                    ? "text-[#5B9BD5]"
                                                    : "text-blue-600"
                                            )}
                                        >
                                            {isSupportAssistant
                                                ? "Support Assistant"
                                                : "Support Team"}
                                        </p>
                                    )}
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {msg.text}
                                    </p>
                                    <p
                                        className={cn(
                                            "mt-1.5 text-[10px]",
                                            isUser
                                                ? "text-blue-200"
                                                : "text-gray-400"
                                        )}
                                    >
                                        {format(
                                            new Date(msg.createdAt),
                                            "hh:mm a"
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}

                    {(!messages || messages.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="mb-3 rounded-full bg-blue-50 p-3">
                                <Send className="size-5 text-blue-400" />
                            </div>
                            <p className="text-sm text-gray-500">
                                {isResolved
                                    ? "This ticket has been resolved."
                                    : "Our support team will respond shortly."}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                {isResolved
                                    ? "Thank you for contacting us."
                                    : "You'll receive a notification when we reply."}
                            </p>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input */}
                {isResolved ? (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <CheckCircle className="size-4 text-green-500" />
                            <span>
                                This ticket has been resolved. Chat is closed.
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="border-t border-gray-200 bg-white p-4">
                        {isAssistantHandling && (
                            <div className="mb-3 rounded-xl border border-[#D7E7F8] bg-[#F5FAFF] px-4 py-3 text-sm text-gray-600">
                                <span className="font-semibold text-[#5B9BD5]">
                                    Support Assistant:
                                </span>{" "}
                                You can keep chatting here. I'll capture your
                                updates until a support specialist joins.
                            </div>
                        )}
                        <div className="flex items-end gap-3">
                            <textarea
                                value={msgText}
                                onChange={(e) => setMsgText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    isAssistantHandling
                                        ? "Type your update for Support Assistant..."
                                        : "Type your message..."
                                }
                                rows={1}
                                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                                style={{ minHeight: 44, maxHeight: 120 }}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={
                                    !msgText.trim() || sendMutation.isPending
                                }
                                size="sm"
                                className="h-11 rounded-xl px-4"
                            >
                                {sendMutation.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Send className="size-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input-dash";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { useEffect, useRef, useState } from "react";

type IntakeRow = { label: string; value: string };
type IntakeQA = { question: string; answer: string };
type IntakeSummary = {
    context: IntakeRow[];
    qa: IntakeQA[];
    complaint: string;
};

const normalizeLabel = (value: string) =>
    value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();

const parseIntakeSummary = (text: string): IntakeSummary | null => {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) return null;

    const isNewFormat = lines.some((line) => line === "SUPPORT INTAKE SUMMARY");
    const isLegacyFormat = lines[0]
        .toLowerCase()
        .startsWith("order support pre-chat details");

    if (!isNewFormat && !isLegacyFormat) return null;

    const summary: IntakeSummary = {
        context: [],
        qa: [],
        complaint: "",
    };

    if (isNewFormat) {
        let inComplaintBlock = false;

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];

            if (line === "Customer Complaint (Detailed)") {
                inComplaintBlock = true;
                continue;
            }

            if (inComplaintBlock) {
                summary.complaint = summary.complaint
                    ? `${summary.complaint}\n${line}`
                    : line;
                continue;
            }

            const contextMatch = line.match(
                /^-\s*(Issue Type|Order ID|Order Status|Item):\s*(.+)$/i
            );
            if (contextMatch) {
                summary.context.push({
                    label: normalizeLabel(contextMatch[1]),
                    value: contextMatch[2].trim(),
                });
                continue;
            }

            const questionMatch = line.match(/^\d+\.\s*Question:\s*(.+)$/i);
            if (questionMatch) {
                const responseLine = lines[index + 1] ?? "";
                const responseMatch = responseLine.match(/^Response:\s*(.+)$/i);
                summary.qa.push({
                    question: questionMatch[1].trim(),
                    answer: responseMatch ? responseMatch[1].trim() : "Not provided",
                });
                if (responseMatch) index += 1;
            }
        }
    } else {
        for (const line of lines) {
            const contextMatch = line.match(
                /^(Issue|Order ID|Order status|Item):\s*(.+)$/i
            );
            if (contextMatch) {
                summary.context.push({
                    label: normalizeLabel(contextMatch[1]),
                    value: contextMatch[2].trim(),
                });
                continue;
            }

            const currentSituationMatch = line.match(
                /^Current situation:\s*(.+)$/i
            );
            if (currentSituationMatch) {
                summary.qa.push({
                    question: "What best describes the current situation?",
                    answer: currentSituationMatch[1].trim(),
                });
                continue;
            }

            const requestedHelpMatch = line.match(/^Requested help:\s*(.+)$/i);
            if (requestedHelpMatch) {
                summary.qa.push({
                    question: "What would you like support to do next?",
                    answer: requestedHelpMatch[1].trim(),
                });
                continue;
            }

            const packagingMatch = line.match(
                /^Item and packaging available:\s*(.+)$/i
            );
            if (packagingMatch) {
                summary.qa.push({
                    question: "Do you still have the item and packaging?",
                    answer: packagingMatch[1].trim(),
                });
                continue;
            }

            const complaintMatch = line.match(/^What happened:\s*(.+)$/i);
            if (complaintMatch) {
                summary.complaint = complaintMatch[1].trim();
            }
        }
    }

    if (
        summary.context.length === 0 &&
        summary.qa.length === 0 &&
        !summary.complaint
    ) {
        return null;
    }

    return summary;
};

function IntakeSummaryMessage({ summary }: { summary: IntakeSummary }) {
    return (
        <div className="space-y-3">
            <div className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                Support Intake Summary
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Order Context
                </p>
                <div className="mt-2 space-y-1.5">
                    {summary.context.map((row) => (
                        <p key={`${row.label}-${row.value}`} className="text-xs">
                            <span className="font-semibold text-slate-800">
                                {row.label}:
                            </span>{" "}
                            <span className="text-slate-700">{row.value}</span>
                        </p>
                    ))}
                </div>
            </div>

            {summary.qa.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                        Assistant Q&A
                    </p>
                    <div className="mt-2 space-y-2">
                        {summary.qa.map((row, index) => (
                            <div
                                key={`${row.question}-${index}`}
                                className="rounded-md border border-blue-100 bg-white/80 px-2.5 py-2"
                            >
                                <p className="text-xs font-semibold text-slate-800">
                                    Q{index + 1}. {row.question}
                                </p>
                                <p className="mt-1 text-xs text-slate-700">
                                    <span className="font-semibold text-blue-700">
                                        Customer:
                                    </span>{" "}
                                    {row.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                    Customer Complaint
                </p>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                    {summary.complaint || "Not provided"}
                </p>
            </div>
        </div>
    );
}

export default function AdminSupportPage() {
    // --------------------------------------------------------
    // FILTER STATE
    // --------------------------------------------------------
    const [ticketType, setTicketType] = useState<"brand" | "user">("brand");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
        null
    );

    // --------------------------------------------------------
    // TRPC → LIST ALL TICKETS (ADMIN)
    // --------------------------------------------------------
    const brandTicketsQuery =
        trpc.general.adminSupportRouter.listTickets.useQuery(
            {
                limit: 50,
                page: 1,
                search,
                status: statusFilter,
            },
            { enabled: ticketType === "brand" }
        );

    const userTicketsQuery =
        trpc.general.adminSupportRouter.listUserTickets.useQuery(
            {
                limit: 50,
                page: 1,
                search,
                status: statusFilter,
            },
            { enabled: ticketType === "user" }
        );

    const tickets =
        ticketType === "brand"
            ? (brandTicketsQuery.data?.data ?? [])
            : (userTicketsQuery.data?.data ?? []);

    // auto-select the first ticket when list changes
    useEffect(() => {
        setSelectedTicketId(null);
        if (tickets.length > 0) {
            setSelectedTicketId(tickets[0].id);
        }
    }, [ticketType]); // intentionally not tracking `tickets` to avoid jumpy selection, but changing type resets.

    // --------------------------------------------------------
    // TRPC → GET TICKET DETAILS
    // --------------------------------------------------------
    const brandTicketQuery = trpc.general.adminSupportRouter.getTicket.useQuery(
        selectedTicketId ?? "",
        { enabled: !!selectedTicketId && ticketType === "brand" }
    );

    const userTicketQuery =
        trpc.general.adminSupportRouter.getUserTicket.useQuery(
            selectedTicketId ?? "",
            { enabled: !!selectedTicketId && ticketType === "user" }
        );

    const selectedTicket =
        ticketType === "brand" ? brandTicketQuery.data : userTicketQuery.data;
    const isResolved = selectedTicket?.status === "resolved";

    // --------------------------------------------------------
    // TRPC → GET MESSAGES FOR TICKET
    // --------------------------------------------------------
    const brandMessagesQuery =
        trpc.general.adminSupportRouter.getMessages.useQuery(
            selectedTicketId ?? "",
            { enabled: !!selectedTicketId && ticketType === "brand" }
        );

    const userMessagesQuery =
        trpc.general.adminSupportRouter.getUserMessages.useQuery(
            selectedTicketId ?? "",
            { enabled: !!selectedTicketId && ticketType === "user" }
        );

    const messages =
        ticketType === "brand"
            ? (brandMessagesQuery.data ?? [])
            : (userMessagesQuery.data ?? []);

    const chatRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        chatRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --------------------------------------------------------
    // TRPC → SEND ADMIN MESSAGE
    // --------------------------------------------------------
    const sendBrandMessageMutation =
        trpc.general.adminSupportRouter.sendMessage.useMutation({
            onSuccess: () => {
                brandMessagesQuery.refetch();
                setMsgText("");
            },
        });

    const sendUserMessageMutation =
        trpc.general.adminSupportRouter.sendUserMessage.useMutation({
            onSuccess: () => {
                userMessagesQuery.refetch();
                setMsgText("");
            },
        });

    const [msgText, setMsgText] = useState("");

    function sendMessage() {
        if (!msgText.trim() || !selectedTicketId) return;

        if (ticketType === "brand") {
            sendBrandMessageMutation.mutate({
                ticketId: selectedTicketId,
                text: msgText,
            });
        } else {
            sendUserMessageMutation.mutate({
                ticketId: selectedTicketId,
                text: msgText,
            });
        }
    }

    // --------------------------------------------------------
    // TRPC → RESOLVE TICKET
    // --------------------------------------------------------
    const resolveBrandMutation =
        trpc.general.adminSupportRouter.resolveTicket.useMutation({
            onSuccess: async () => {
                await brandTicketsQuery.refetch();
                await brandTicketQuery.refetch();
            },
        });

    const resolveUserMutation =
        trpc.general.adminSupportRouter.resolveUserTicket.useMutation({
            onSuccess: async () => {
                await userTicketsQuery.refetch();
                await userTicketQuery.refetch();
            },
        });

    function resolveTicketHandler() {
        if (!selectedTicketId) return;
        if (ticketType === "brand")
            resolveBrandMutation.mutate({ ticketId: selectedTicketId });
        else resolveUserMutation.mutate({ ticketId: selectedTicketId });
    }

    // --------------------------------------------------------
    // UI
    // --------------------------------------------------------
    return (
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-4">
            {/* SIDEBAR */}
            <Card className="flex h-[85vh] flex-col border md:col-span-1">
                <CardHeader>
                    <h2 className="text-xl font-semibold">
                        Admin Support Panel
                    </h2>

                    {/* TYPE TOGGLE */}
                    <div className="mt-4 flex rounded-md bg-muted p-1">
                        <button
                            className={`flex-1 rounded-sm py-1.5 text-sm transition ${ticketType === "brand" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
                            onClick={() => setTicketType("brand")}
                        >
                            Brands
                        </button>
                        <button
                            className={`flex-1 rounded-sm py-1.5 text-sm transition ${ticketType === "user" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
                            onClick={() => setTicketType("user")}
                        >
                            Users
                        </button>
                    </div>

                    {/* FILTERS */}
                    <div className="mt-4 space-y-3">
                        <Input
                            placeholder="Search tickets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className="w-full rounded-md border p-2 text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            {ticketType === "brand" && (
                                <option value="escalated">Escalated</option>
                            )}
                        </select>
                    </div>
                </CardHeader>

                <Separator />

                {/* TICKET LIST */}
                <ScrollArea className="flex-1 p-3">
                    <div className="space-y-2">
                        {tickets.map((t: any) => (
                            <div
                                key={t.id}
                                onClick={() => setSelectedTicketId(t.id)}
                                className={`cursor-pointer rounded-md border p-3 transition ${
                                    selectedTicketId === t.id
                                        ? "border-primary/50 bg-muted"
                                        : "hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p
                                        className="flex-1 text-sm font-medium leading-tight"
                                        style={{ wordBreak: "break-word" }}
                                    >
                                        {t.title}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className="shrink-0 text-[10px]"
                                    >
                                        {t.status}
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                    <p>
                                        {(t.issueType ?? "").replace(/_/g, " ")}
                                    </p>
                                </div>
                                {ticketType === "brand" && (
                                    <p className="mt-1 text-[10px] italic text-muted-foreground">
                                        Brand: {t.brandName ?? "Unknown"}
                                    </p>
                                )}
                                {ticketType === "user" && (
                                    <p className="mt-1 text-[10px] italic text-muted-foreground">
                                        Category: {t.category ?? "Unknown"}{" "}
                                        {t.orderId
                                            ? `| Order #${t.orderId.slice(0, 8)}`
                                            : ""}
                                    </p>
                                )}
                            </div>
                        ))}
                        {tickets.length === 0 && (
                            <p className="py-10 text-center text-sm text-muted-foreground">
                                No tickets found.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* CHAT AREA */}
            <Card className="relative flex h-[85vh] flex-col border md:col-span-3">
                {!selectedTicketId ? (
                    <div className="flex flex-1 items-center justify-center text-muted-foreground">
                        Select a ticket to view conversation
                    </div>
                ) : (
                    <>
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {selectedTicket?.title}
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Ticket ID: {selectedTicket?.id} •{" "}
                                    {ticketType === "brand"
                                        ? "Brand Support"
                                        : "Customer Support"}
                                </p>
                            </div>

                            {/* RESOLVE BUTTON */}
                            {!isResolved && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resolveTicketHandler}
                                >
                                    Mark as Resolved
                                </Button>
                            )}
                        </CardHeader>

                        <Separator />

                        {/* MESSAGES */}
                        <ScrollArea className="flex-1 bg-slate-50/50 p-4">
                            <div className="space-y-4">
                                {messages.map((m: any) => {
                                    const intakeSummary =
                                        m.sender === "user"
                                            ? parseIntakeSummary(m.text)
                                            : null;

                                    return (
                                        <div
                                            key={m.id}
                                            className={`max-w-xl rounded-2xl p-3 text-sm ${
                                                m.sender === "admin"
                                                    ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                                                    : "mr-auto rounded-bl-sm border bg-white shadow-sm"
                                            }`}
                                        >
                                            {intakeSummary ? (
                                                <IntakeSummaryMessage
                                                    summary={intakeSummary}
                                                />
                                            ) : (
                                                <p className="whitespace-pre-wrap">
                                                    {m.text}
                                                </p>
                                            )}
                                            <div
                                                className={`mt-2 text-[10px] ${m.sender === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                                            >
                                                {new Date(
                                                    m.createdAt
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {messages.length === 0 && (
                                    <div className="py-10 text-center text-sm text-muted-foreground">
                                        No messages yet.
                                    </div>
                                )}
                                <div ref={chatRef}></div>
                            </div>
                        </ScrollArea>

                        {/* LOCKED WHEN RESOLVED */}
                        {isResolved ? (
                            <div className="border-t bg-muted p-4 text-center text-sm font-medium text-muted-foreground">
                                This ticket has been resolved. Chat is locked.
                            </div>
                        ) : (
                            <div className="border-t bg-white p-4">
                                <div className="flex items-end gap-2">
                                    <textarea
                                        placeholder="Write a reply..."
                                        className="w-full flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={msgText}
                                        rows={2}
                                        onChange={(e) =>
                                            setMsgText(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={
                                            !msgText.trim() ||
                                            sendBrandMessageMutation.isPending ||
                                            sendUserMessageMutation.isPending
                                        }
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}

"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    ArrowLeft,
    Bell,
    FileImage,
    LifeBuoy,
    Package,
    Send,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ElementType } from "react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";

interface TicketData {
    id: string;
    title: string;
    status: string;
    category: string;
    issueType: string;
    orderId: string | null;
    createdAt: Date;
    updatedAt: Date;
    description: string | null;
}

interface TicketPageProps {
    initialTicket: TicketData;
}

type UploadedAttachment = {
    filename: string;
    url: string;
    contentType?: string;
    sizeBytes?: string;
    fileKey?: string;
};

const buildSupportCaseTitle = (input: {
    title?: string | null;
    issueLabel?: string | null;
    issueType?: string | null;
    orderId?: string | null;
}) => {
    const baseLabel =
        input.issueLabel?.trim() ||
        input.title
            ?.replace(/\s*\(Order #.+\)\s*$/i, "")
            .replace(/\s*for order\s+.+$/i, "")
            .trim() ||
        input.issueType?.replace(/_/g, " ").trim() ||
        "Support request";

    return input.orderId ? `${baseLabel} (Order #${input.orderId})` : baseLabel;
};

export function TicketPage({ initialTicket }: TicketPageProps) {
    const [msgText, setMsgText] = useState("");
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ticketQuery = trpc.general.userSupport.getTicket.useQuery(
        initialTicket.id
    );
    const ticket = ticketQuery.data ?? initialTicket;

    const { data: messages, refetch: refetchMessages } =
        trpc.general.userSupport.getMessages.useQuery(initialTicket.id);
    const notificationsCountQuery =
        trpc.general.notifications.unreadCount.useQuery();

    const { startUpload, routeConfig } = useUploadThing(
        "supportAttachmentUploader",
        {
            onUploadError(error) {
                toast.error(error.message);
                setIsUploading(false);
            },
        }
    );

    const sendMutation = trpc.general.userSupport.sendMessage.useMutation({
        onSuccess: () => {
            setMsgText("");
            setAttachments([]);
            refetchMessages();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const uploadAttachments = async (files: File[]) => {
        setIsUploading(true);
        try {
            const uploaded = await startUpload(files);
            if (!uploaded?.length) throw new Error("Upload failed");

            setAttachments((current) => [
                ...current,
                ...uploaded.map((file) => ({
                    filename: file.name,
                    url: file.url ?? file.appUrl,
                    contentType: file.type,
                    sizeBytes: String(file.size),
                    fileKey: file.key,
                })),
            ]);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Upload failed"
            );
        } finally {
            setIsUploading(false);
        }
    };

    const handleSend = () => {
        if (!msgText.trim() && attachments.length === 0) return;
        sendMutation.mutate({
            ticketId: initialTicket.id,
            text: msgText.trim() || "Added supporting attachments",
            attachments,
        });
    };

    const isResolved = ["resolved", "closed", "rejected"].includes(
        ticket?.status ?? "open"
    );
    const order = (ticket as any)?.order ?? null;
    const dispute = (ticket as any)?.dispute ?? null;

    const timelineMessage = useMemo(() => {
        if (!dispute) return null;
        if (dispute.replacementOrderId) {
            return `Replacement order ${dispute.replacementOrderId} was created for this case.`;
        }
        if (dispute.status === "approved_for_brand_action") {
            return "This case has been approved and the brand has been asked to take action.";
        }
        return null;
    }, [dispute]);

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#F7FBFF] to-[#EEF5FF] p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <Link
                            href="/profile/help-center"
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#5B9BD5]"
                        >
                            <ArrowLeft className="size-4" />
                            Back to help center
                        </Link>

                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#CFE3F8] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                            <LifeBuoy className="size-3.5" />
                            Case {ticket.id.slice(0, 8)}
                        </div>

                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                            {buildSupportCaseTitle({
                                title: ticket.title,
                                issueLabel: (ticket as any).issueLabel,
                                issueType: ticket.issueType,
                                orderId: ticket.orderId,
                            })}
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Created{" "}
                            {format(
                                new Date(ticket.createdAt),
                                "dd MMM yyyy, hh:mm a"
                            )}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <SummaryPill
                            label="Status"
                            value={ticket.status.replace(/_/g, " ")}
                        />
                        <SummaryPill
                            label="Unread Alerts"
                            value={String(notificationsCountQuery.data ?? 0)}
                            href="/profile/notifications"
                            icon={Bell}
                        />
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
                <section className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                            Case Summary
                        </p>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <InfoRow label="Category" value={ticket.category} />
                            <InfoRow
                                label="Issue"
                                value={
                                    (ticket as any).issueLabel ??
                                    ticket.issueType.replace(/_/g, " ")
                                }
                            />
                            <InfoRow
                                label="Status"
                                value={ticket.status.replace(/_/g, " ")}
                            />
                            {ticket.orderId && (
                                <InfoRow label="Order" value={ticket.orderId} />
                            )}
                        </div>
                        {timelineMessage && (
                            <div className="mt-5 rounded-[20px] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 size-4 shrink-0" />
                                    <p>{timelineMessage}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {order && (
                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Package className="size-5 text-[#5B9BD5]" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                        Linked Order
                                    </p>
                                    <h2 className="mt-1 text-lg font-semibold text-slate-900">
                                        {order.id}
                                    </h2>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                                <InfoRow
                                    label="Order status"
                                    value={order.status}
                                />
                                <InfoRow
                                    label="Shipment"
                                    value={
                                        order.shipments?.[0]?.status ??
                                        "Pending"
                                    }
                                />
                                <InfoRow
                                    label="Tracking"
                                    value={
                                        order.shipments?.[0]?.awbNumber ??
                                        order.shipments?.[0]?.trackingNumber ??
                                        "Not assigned yet"
                                    }
                                />
                            </div>

                            <div className="mt-4 space-y-3">
                                {order.items.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.product.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Qty {item.quantity} · Brand{" "}
                                            {item.product.brand.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                Support Conversation
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                Messages and proof
                            </h2>
                        </div>
                    </div>

                    <div className="mt-6 max-h-[640px] space-y-4 overflow-y-auto pr-1">
                        {(messages ?? []).map((message: any) => {
                            const isUser = message.sender === "user";
                            const isAssistant =
                                message.sender === "admin" &&
                                message.senderId === "support-bot";

                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex",
                                        isUser ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-[24px] px-4 py-4 shadow-sm",
                                            isUser
                                                ? "rounded-br-md bg-[#5B9BD5] text-white"
                                                : isAssistant
                                                  ? "rounded-bl-md border border-blue-200 bg-blue-50 text-slate-900"
                                                  : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-900"
                                        )}
                                    >
                                        {!isUser && (
                                            <p
                                                className={cn(
                                                    "mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
                                                    isAssistant
                                                        ? "text-[#4A84B8]"
                                                        : "text-slate-500"
                                                )}
                                            >
                                                {isAssistant
                                                    ? "Support Assistant"
                                                    : "Support Team"}
                                            </p>
                                        )}
                                        <p className="whitespace-pre-wrap text-sm leading-6">
                                            {message.text}
                                        </p>

                                        {!!message.attachments?.length && (
                                            <div className="mt-4 grid gap-2">
                                                {message.attachments.map(
                                                    (attachment: any) => (
                                                        <a
                                                            key={attachment.id}
                                                            href={
                                                                attachment.url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={cn(
                                                                "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm",
                                                                isUser
                                                                    ? "border-white/20 bg-white/10 text-white"
                                                                    : "border-slate-200 bg-white text-slate-700"
                                                            )}
                                                        >
                                                            <FileImage className="size-4 shrink-0" />
                                                            <span className="truncate">
                                                                {
                                                                    attachment.filename
                                                                }
                                                            </span>
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        <p
                                            className={cn(
                                                "mt-3 text-[11px]",
                                                isUser
                                                    ? "text-white/70"
                                                    : "text-slate-400"
                                            )}
                                        >
                                            {format(
                                                new Date(message.createdAt),
                                                "dd MMM, hh:mm a"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isResolved ? (
                        <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                            This case is closed for new messages. If something
                            is still wrong, create a fresh support case from the
                            help center.
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                            <textarea
                                value={msgText}
                                onChange={(event) =>
                                    setMsgText(event.target.value)
                                }
                                rows={4}
                                placeholder="Add more details, shipment proof, packaging photos, or any follow-up update here."
                                className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-[#5B9BD5] focus:bg-white"
                            />

                            <div className="rounded-[22px] border border-dashed border-[#BCD5EE] bg-[#F8FBFF] p-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Add more proof
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Share more images or screenshots
                                            with your reply.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-full"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={isUploading}
                                    >
                                        {isUploading
                                            ? "Uploading..."
                                            : "Add attachment"}
                                    </Button>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept={generatePermittedFileTypes(
                                        routeConfig
                                    ).fileTypes.join()}
                                    className="hidden"
                                    onChange={(event) => {
                                        const files = Array.from(
                                            event.target.files ?? []
                                        );
                                        if (!files.length) return;
                                        void uploadAttachments(files);
                                        event.currentTarget.value = "";
                                    }}
                                />

                                {attachments.length > 0 && (
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                        {attachments.map((attachment) => (
                                            <div
                                                key={attachment.url}
                                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileImage className="size-4 text-[#5B9BD5]" />
                                                    <span className="truncate text-sm text-slate-700">
                                                        {attachment.filename}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAttachments(
                                                            (current) =>
                                                                current.filter(
                                                                    (item) =>
                                                                        item.url !==
                                                                        attachment.url
                                                                )
                                                        )
                                                    }
                                                    className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 hover:text-slate-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSend}
                                    className="rounded-full px-6"
                                    disabled={
                                        sendMutation.isPending ||
                                        isUploading ||
                                        (!msgText.trim() &&
                                            attachments.length === 0)
                                    }
                                >
                                    <Send className="mr-2 size-4" />
                                    {sendMutation.isPending
                                        ? "Sending..."
                                        : "Send update"}
                                </Button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

function SummaryPill({
    label,
    value,
    href,
    icon: Icon,
}: {
    label: string;
    value: string;
    href?: string;
    icon?: ElementType;
}) {
    const content = (
        <div className="rounded-[24px] border border-[#D6E6F6] bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                        {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold capitalize text-slate-900">
                        {value}
                    </p>
                </div>
                {Icon ? <Icon className="size-5 text-[#5B9BD5]" /> : null}
            </div>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {label}
            </span>
            <span className="text-sm font-medium text-slate-900">{value}</span>
        </div>
    );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    AlertCircle,
    CreditCard,
    FileImage,
    ImagePlus,
    LifeBuoy,
    MessageSquareText,
    Package,
    PackageSearch,
    Plus,
    Settings,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ElementType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";

type QueueTab = "support" | "disputes";

type UploadedAttachment = {
    filename: string;
    url: string;
    contentType?: string;
    sizeBytes?: string;
    fileKey?: string;
};

const supportIssueOptions = [
    {
        value: "orders",
        label: "Orders",
        description: "Shipment, pickup, delivery, cancellation, or RTO help.",
        icon: PackageSearch,
    },
    {
        value: "products",
        label: "Products",
        description: "Catalogue, stock, approval, media, or variant issues.",
        icon: Package,
    },
    {
        value: "payouts",
        label: "Payouts",
        description: "Settlements, invoices, deductions, or payment queries.",
        icon: CreditCard,
    },
    {
        value: "account",
        label: "Account",
        description: "Brand profile, members, access, or verification help.",
        icon: Settings,
    },
    {
        value: "operations",
        label: "Operations",
        description: "Packaging, pickup readiness, and day-to-day operations.",
        icon: AlertCircle,
    },
] as const;

function buildSupportDisplayTitle(input: {
    title?: string | null;
    issueLabel?: string | null;
    issueType?: string | null;
    orderId?: string | null;
}) {
    const baseLabel =
        input.issueLabel?.trim() ||
        input.title
            ?.replace(/\s*\(Order #.+\)\s*$/i, "")
            .replace(/\s*for order\s+.+$/i, "")
            .trim() ||
        input.issueType?.replace(/_/g, " ").trim() ||
        "Support request";

    return input.orderId ? `${baseLabel} (Order #${input.orderId})` : baseLabel;
}

export default function BrandSupportPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const ticketParam = searchParams.get("ticket") ?? "";
    const queueParam = searchParams.get("queue");
    const initialQueue: QueueTab =
        queueParam === "disputes" ? "disputes" : "support";
    const [queue, setQueue] = useState<QueueTab>(initialQueue);
    const [selectedId, setSelectedId] = useState(ticketParam);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [newTitle, setNewTitle] = useState("");
    const [newIssueType, setNewIssueType] = useState("orders");
    const [newPriority, setNewPriority] = useState<
        "low" | "normal" | "high" | "critical"
    >("normal");
    const [newDescription, setNewDescription] = useState("");
    const [newAttachments, setNewAttachments] = useState<UploadedAttachment[]>(
        []
    );
    const [replyText, setReplyText] = useState("");
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
    const [replacementNote, setReplacementNote] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const newFileInputRef = useRef<HTMLInputElement>(null);
    const replyFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQueue(queueParam === "disputes" ? "disputes" : "support");
        setSelectedId(ticketParam);
    }, [queueParam, ticketParam]);

    const { startUpload, routeConfig } = useUploadThing(
        "supportAttachmentUploader",
        {
            onUploadError(error) {
                toast.error(error.message);
                setIsUploading(false);
            },
        }
    );

    const supportTicketsQuery =
        trpc.brands.brandSupportRouter.listTickets.useQuery(
            {
                limit: 50,
                page: 1,
                search,
                status: statusFilter,
            },
            { enabled: queue === "support" }
        );
    const disputesQuery = trpc.brands.brandSupportRouter.listDisputes.useQuery(
        { status: statusFilter },
        { enabled: queue === "disputes" }
    );

    const supportTicketQuery =
        trpc.brands.brandSupportRouter.getTicket.useQuery(selectedId, {
            enabled: queue === "support" && !!selectedId,
        });
    const supportMessagesQuery =
        trpc.brands.brandSupportRouter.getMessages.useQuery(selectedId, {
            enabled: queue === "support" && !!selectedId,
        });
    const disputeQuery = trpc.brands.brandSupportRouter.getDispute.useQuery(
        selectedId,
        { enabled: queue === "disputes" && !!selectedId }
    );

    const createTicketMutation =
        trpc.brands.brandSupportRouter.createTicket.useMutation({
            onSuccess: (ticket) => {
                toast.success("Support request created");
                setNewTitle("");
                setNewIssueType("orders");
                setNewPriority("normal");
                setNewDescription("");
                setNewAttachments([]);
                setSelectedId(ticket.id);
                supportTicketsQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const sendReplyMutation =
        trpc.brands.brandSupportRouter.sendMessage.useMutation({
            onSuccess: () => {
                setReplyText("");
                setAttachments([]);
                supportMessagesQuery.refetch();
                supportTicketQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const createReplacementMutation =
        trpc.brands.brandSupportRouter.createReplacementOrder.useMutation({
            onSuccess: (result) => {
                toast.success(
                    `Replacement order ${result.replacementOrderId} created`
                );
                setReplacementNote("");
                disputeQuery.refetch();
                disputesQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });

    const uploadAttachments = async (
        files: File[],
        target: "new" | "reply" = "reply"
    ) => {
        setIsUploading(true);
        try {
            const uploaded = await startUpload(files);
            if (!uploaded?.length) throw new Error("Upload failed");
            const nextAttachments = uploaded.map((file) => ({
                filename: file.name,
                url: file.url ?? file.appUrl,
                contentType: file.type,
                sizeBytes: String(file.size),
                fileKey: file.key,
            }));

            if (target === "new") {
                setNewAttachments((current) => [
                    ...current,
                    ...nextAttachments,
                ]);
                return;
            }

            setAttachments((current) => [...current, ...nextAttachments]);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Upload failed"
            );
        } finally {
            setIsUploading(false);
        }
    };

    const listItems = useMemo(() => {
        return queue === "support"
            ? (supportTicketsQuery.data?.data ?? [])
            : (disputesQuery.data ?? []);
    }, [queue, supportTicketsQuery.data, disputesQuery.data]);

    const selectedSupport = supportTicketQuery.data;
    const selectedDispute = disputeQuery.data;

    return (
        <div className="space-y-5 p-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            <LifeBuoy className="size-3.5" />
                            Brand Support
                        </div>
                        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                            Support center
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Raise tickets with screenshots, track replies, and
                            handle approved disputes.
                        </p>
                    </div>

                    <div className="flex gap-2 rounded-md border border-slate-200 bg-slate-50 p-1">
                        <button
                            onClick={() => {
                                const basePath = pathname.endsWith("/disputes")
                                    ? pathname.replace(/\/disputes$/, "")
                                    : pathname;
                                router.push(`${basePath}?queue=support`);
                                setQueue("support");
                                setSelectedId("");
                            }}
                            className={cn(
                                "rounded-full px-4 py-2 text-sm font-medium transition",
                                queue === "support"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            Support
                        </button>
                        <button
                            onClick={() => {
                                const basePath = pathname.endsWith("/disputes")
                                    ? pathname.replace(/\/disputes$/, "")
                                    : pathname;
                                router.push(`${basePath}/disputes`);
                                setQueue("disputes");
                                setSelectedId("");
                            }}
                            className={cn(
                                "rounded-full px-4 py-2 text-sm font-medium transition",
                                queue === "disputes"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            Disputes
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
                <Card className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="space-y-4">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={
                                queue === "support"
                                    ? "Search support tickets"
                                    : "Search disputes"
                            }
                            className="rounded-2xl"
                        />
                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900"
                        >
                            <option value="all">All statuses</option>
                            <option value="open">Open</option>
                            <option value="in_review">In review</option>
                            <option value="approved">Approved</option>
                            <option value="resolved">Resolved</option>
                            <option value="approved_for_brand_action">
                                Approved for brand action
                            </option>
                            <option value="replacement_created">
                                Replacement created
                            </option>
                        </select>
                    </div>

                    {queue === "support" && (
                        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    New support request
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Add images, invoices, or screenshots so the
                                    support team can act faster.
                                </p>
                            </div>
                            <div className="mt-3 space-y-3">
                                <Input
                                    value={newTitle}
                                    onChange={(event) =>
                                        setNewTitle(event.target.value)
                                    }
                                    placeholder="Ticket title"
                                    className="bg-white"
                                />
                                <div className="grid gap-2">
                                    {supportIssueOptions.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected =
                                            newIssueType === option.value;

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() =>
                                                    setNewIssueType(
                                                        option.value
                                                    )
                                                }
                                                className={cn(
                                                    "flex gap-3 rounded-md border bg-white p-3 text-left transition",
                                                    isSelected
                                                        ? "border-slate-900 ring-1 ring-slate-900"
                                                        : "border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                <Icon className="mt-0.5 size-4 shrink-0 text-slate-600" />
                                                <span>
                                                    <span className="block text-sm font-semibold text-slate-900">
                                                        {option.label}
                                                    </span>
                                                    <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                                        {option.description}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <select
                                    value={newPriority}
                                    onChange={(event) =>
                                        setNewPriority(
                                            event.target
                                                .value as typeof newPriority
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
                                >
                                    <option value="low">Low priority</option>
                                    <option value="normal">
                                        Normal priority
                                    </option>
                                    <option value="high">High priority</option>
                                    <option value="critical">
                                        Critical priority
                                    </option>
                                </select>
                                <textarea
                                    value={newDescription}
                                    onChange={(event) =>
                                        setNewDescription(event.target.value)
                                    }
                                    rows={4}
                                    placeholder="Describe the issue"
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900"
                                />
                                <div className="rounded-md border border-dashed border-slate-300 bg-white p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
                                            <ImagePlus className="size-4 shrink-0" />
                                            <span>Add images or files</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-8 px-3 text-xs"
                                            onClick={() =>
                                                newFileInputRef.current?.click()
                                            }
                                            disabled={isUploading}
                                        >
                                            {isUploading
                                                ? "Uploading..."
                                                : "Upload"}
                                        </Button>
                                    </div>
                                    <input
                                        ref={newFileInputRef}
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
                                            void uploadAttachments(
                                                files,
                                                "new"
                                            );
                                            event.currentTarget.value = "";
                                        }}
                                    />
                                    {newAttachments.length > 0 && (
                                        <div className="mt-3 grid gap-2">
                                            {newAttachments.map(
                                                (attachment) => (
                                                    <AttachmentRow
                                                        key={attachment.url}
                                                        attachment={attachment}
                                                        onRemove={() =>
                                                            setNewAttachments(
                                                                (current) =>
                                                                    current.filter(
                                                                        (
                                                                            item
                                                                        ) =>
                                                                            item.url !==
                                                                            attachment.url
                                                                    )
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={() =>
                                        createTicketMutation.mutate({
                                            title: newTitle,
                                            issueType: newIssueType,
                                            issueLabel:
                                                supportIssueOptions.find(
                                                    (option) =>
                                                        option.value ===
                                                        newIssueType
                                                )?.label ?? newIssueType,
                                            description: newDescription,
                                            priority: newPriority,
                                            attachments: newAttachments,
                                        })
                                    }
                                    className="w-full"
                                    disabled={
                                        !newTitle.trim() ||
                                        createTicketMutation.isPending ||
                                        isUploading
                                    }
                                >
                                    <Plus className="mr-2 size-4" />
                                    {createTicketMutation.isPending
                                        ? "Creating..."
                                        : "Create support request"}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mt-5 space-y-3">
                        {listItems.map((item: any) => {
                            const id = item.id;
                            const title =
                                queue === "support"
                                    ? buildSupportDisplayTitle({
                                          title: item.title,
                                          issueLabel: item.issueLabel,
                                          issueType: item.issueType,
                                          orderId: item.orderId,
                                      })
                                    : buildSupportDisplayTitle({
                                          title: item.ticket?.title,
                                          issueLabel: item.ticket?.issueLabel,
                                          issueType:
                                              item.ticket?.issueType ??
                                              item.disputeType,
                                          orderId: item.orderId,
                                      });

                            return (
                                <button
                                    key={id}
                                    onClick={() => setSelectedId(id)}
                                    className={cn(
                                        "w-full rounded-[22px] border p-4 text-left transition",
                                        selectedId === id
                                            ? "border-[#5B9BD5] bg-[#F7FBFF]"
                                            : "border-slate-200 bg-slate-50 hover:bg-white"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {title}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {queue === "support"
                                                    ? item.issueType
                                                    : `${item.disputeType} · ${item.orderId}`}
                                            </p>
                                        </div>
                                        <StatusBadge status={item.status} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                <Card className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    {queue === "support" && selectedSupport && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                    Brand Support Case
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                    {buildSupportDisplayTitle({
                                        title: selectedSupport.title,
                                        issueLabel: selectedSupport.issueLabel,
                                        issueType: selectedSupport.issueType,
                                    })}
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Updated{" "}
                                    {format(
                                        new Date(selectedSupport.updatedAt),
                                        "dd MMM, hh:mm a"
                                    )}
                                </p>
                            </div>

                            <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                                {(supportMessagesQuery.data ?? []).map(
                                    (message: any) => {
                                        const isBrand =
                                            message.sender === "brand";
                                        return (
                                            <div
                                                key={message.id}
                                                className={cn(
                                                    "flex",
                                                    isBrand
                                                        ? "justify-end"
                                                        : "justify-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "max-w-[80%] rounded-[22px] px-4 py-4",
                                                        isBrand
                                                            ? "rounded-br-md bg-[#5B9BD5] text-white"
                                                            : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-900"
                                                    )}
                                                >
                                                    <p className="whitespace-pre-wrap text-sm leading-6">
                                                        {message.text}
                                                    </p>
                                                    {!!message.attachments
                                                        ?.length && (
                                                        <div className="mt-3 grid gap-2">
                                                            {message.attachments.map(
                                                                (
                                                                    attachment: any
                                                                ) => (
                                                                    <a
                                                                        key={
                                                                            attachment.id
                                                                        }
                                                                        href={
                                                                            attachment.url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className={cn(
                                                                            "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm",
                                                                            isBrand
                                                                                ? "border-white/20 bg-white/10 text-white"
                                                                                : "border-slate-200 bg-white text-slate-700"
                                                                        )}
                                                                    >
                                                                        <FileImage className="size-4" />
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
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>

                            <div className="space-y-4 border-t border-slate-100 pt-5">
                                <textarea
                                    value={replyText}
                                    onChange={(event) =>
                                        setReplyText(event.target.value)
                                    }
                                    rows={4}
                                    placeholder="Write your reply to the support team"
                                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900"
                                />
                                <div className="rounded-[22px] border border-dashed border-[#BCD5EE] bg-[#F8FBFF] p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <p className="text-sm text-slate-600">
                                            Add proof or screenshots
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="rounded-full"
                                            onClick={() =>
                                                replyFileInputRef.current?.click()
                                            }
                                            disabled={isUploading}
                                        >
                                            {isUploading
                                                ? "Uploading..."
                                                : "Add attachment"}
                                        </Button>
                                    </div>
                                    <input
                                        ref={replyFileInputRef}
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
                                        <div className="mt-4 grid gap-2">
                                            {attachments.map((attachment) => (
                                                <div
                                                    key={attachment.url}
                                                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                                >
                                                    <span className="text-sm text-slate-700">
                                                        {attachment.filename}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setAttachments(
                                                                (current) =>
                                                                    current.filter(
                                                                        (
                                                                            item
                                                                        ) =>
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
                                        onClick={() =>
                                            sendReplyMutation.mutate({
                                                ticketId: selectedSupport.id,
                                                text:
                                                    replyText.trim() ||
                                                    "Shared attachments",
                                                attachments,
                                            })
                                        }
                                        className="rounded-full px-6"
                                        disabled={
                                            isUploading ||
                                            (!replyText.trim() &&
                                                attachments.length === 0)
                                        }
                                    >
                                        <MessageSquareText className="mr-2 size-4" />
                                        Send reply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {queue === "disputes" && selectedDispute && (
                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                    Approved Dispute
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                    {selectedDispute.ticket?.title ??
                                        selectedDispute.orderId}
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Order {selectedDispute.orderId}
                                </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <InfoCard
                                    icon={ShieldCheck}
                                    label="Dispute type"
                                    value={selectedDispute.disputeType}
                                />
                                <InfoCard
                                    icon={Package}
                                    label="Original order"
                                    value={selectedDispute.orderId}
                                />
                                <InfoCard
                                    icon={Sparkles}
                                    label="Admin decision"
                                    value={
                                        selectedDispute.adminDecisionSummary ??
                                        "Approved for brand action"
                                    }
                                />
                                <InfoCard
                                    icon={LifeBuoy}
                                    label="Replacement order"
                                    value={
                                        selectedDispute.replacementOrderId ??
                                        "Not created yet"
                                    }
                                />
                            </div>

                            {selectedDispute.order && (
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4A84B8]">
                                        Items for this order
                                    </p>
                                    <div className="mt-4 space-y-3">
                                        {selectedDispute.order.items
                                            .filter(
                                                (item: any) =>
                                                    item.product.brandId ===
                                                    selectedDispute.brandId
                                            )
                                            .map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className="rounded-2xl border border-slate-200 bg-white p-4"
                                                >
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {item.product.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Qty {item.quantity}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {!selectedDispute.replacementOrderId && (
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4A84B8]">
                                        Create replacement order
                                    </p>
                                    <textarea
                                        value={replacementNote}
                                        onChange={(event) =>
                                            setReplacementNote(
                                                event.target.value
                                            )
                                        }
                                        rows={4}
                                        placeholder="Optional note for admin and customer"
                                        className="mt-3 w-full rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900"
                                    />
                                    <Button
                                        onClick={() =>
                                            createReplacementMutation.mutate({
                                                disputeId: selectedDispute.id,
                                                note: replacementNote,
                                            })
                                        }
                                        className="mt-4 rounded-full px-6"
                                    >
                                        <Plus className="mr-2 size-4" />
                                        Create replacement order
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {!selectedSupport && queue === "support" && (
                        <div className="flex min-h-[520px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                            Select a support request to continue the
                            conversation.
                        </div>
                    )}

                    {!selectedDispute && queue === "disputes" && (
                        <div className="flex min-h-[520px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                            Select an approved dispute to take brand action.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge
            variant="outline"
            className="rounded-full border-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600"
        >
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

function AttachmentRow({
    attachment,
    onRemove,
}: {
    attachment: UploadedAttachment;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
                <FileImage className="size-4 shrink-0 text-slate-500" />
                <span className="truncate text-sm text-slate-700">
                    {attachment.filename}
                </span>
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 hover:text-slate-700"
            >
                Remove
            </button>
        </div>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
}: {
    icon: ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
                <Icon className="size-4 text-[#5B9BD5]" />
                <span className="text-sm font-semibold capitalize text-slate-900">
                    {value}
                </span>
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4A84B8]">
                {label}
            </p>
        </div>
    );
}

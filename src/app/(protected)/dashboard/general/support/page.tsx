"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input-dash";
import {
    SUPPORT_CATEGORY_MATRIX,
    SUPPORT_CHANNELS,
    type SupportChannel,
} from "@/lib/customer-support/playbook";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { format } from "date-fns";
import { FileImage, LifeBuoy, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";

type QueueTab = "user" | "brand";
type StatusTab = "new" | "opened" | "resolved";

type UploadedAttachment = {
    filename: string;
    url: string;
    contentType?: string;
    sizeBytes?: string;
    fileKey?: string;
};

type ApprovalPreviewItem = {
    orderItemId: string;
    productTitle: string;
    variantLabel: string;
    quantity: number;
};

const queueTabs: Array<{ key: QueueTab; label: string; href: string }> = [
    {
        key: "user",
        label: "User Support",
        href: "/dashboard/general/support/user",
    },
    {
        key: "brand",
        label: "Brand Support",
        href: "/dashboard/general/support/brand",
    },
];

const statusTabs: Array<{ key: StatusTab; label: string }> = [
    { key: "new", label: "New" },
    { key: "opened", label: "Opened" },
    { key: "resolved", label: "Resolved" },
];

const channelLabels: Record<SupportChannel, string> = {
    web_form: "Web form",
    email: "Support email",
    instagram_dm: "Instagram DM (Direct Message)",
    whatsapp_business: "WhatsApp Business",
    order_page: "Order page",
    admin_manual: "Admin manual",
};

function formatSupportCategoryLabel(category: string) {
    return category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const categoryOptions = Object.values(SUPPORT_CATEGORY_MATRIX).map((item) => ({
    value: item.category,
    label: formatSupportCategoryLabel(item.category),
}));

const statusOptions = [
    "new",
    "acknowledged",
    "in_progress",
    "waiting_customer",
    "waiting_brand",
    "waiting_internal",
    "resolved",
    "refunded",
    "replaced",
    "declined",
    "closed",
    "auto_closed",
    "reopened",
    "escalated",
] as const;

const statusLabels: Record<(typeof statusOptions)[number], string> = {
    new: "New",
    acknowledged: "Acknowledged",
    in_progress: "In progress",
    waiting_customer: "Waiting for customer",
    waiting_brand: "Waiting for brand",
    waiting_internal: "Waiting internal",
    resolved: "Resolved",
    refunded: "Refunded",
    replaced: "Replaced",
    declined: "Declined",
    closed: "Closed",
    auto_closed: "Auto-closed",
    reopened: "Reopened",
    escalated: "Escalated",
};

type SupportResolutionCode =
    | "RES_REFUND_FULL"
    | "RES_REFUND_PARTIAL"
    | "RES_REPLACEMENT"
    | "RES_INFO_PROVIDED"
    | "RES_REDIRECTED_TO_BRAND"
    | "RES_DECLINED_OUT_OF_WINDOW"
    | "RES_DECLINED_INELIGIBLE"
    | "RES_DECLINED_OTHER"
    | "RES_GOODWILL"
    | "RES_AUTOCLOSED_NO_RESPONSE"
    | "RES_DUPLICATE_TICKET"
    | "RES_ESCALATED_TO_LEGAL";

const terminalResolutionCodeByStatus: Partial<
    Record<(typeof statusOptions)[number], SupportResolutionCode>
> = {
    resolved: "RES_INFO_PROVIDED",
    refunded: "RES_REFUND_FULL",
    replaced: "RES_REPLACEMENT",
    declined: "RES_DECLINED_OTHER",
    closed: "RES_INFO_PROVIDED",
    auto_closed: "RES_AUTOCLOSED_NO_RESPONSE",
};

function getSuggestedActions(status: string, queue: QueueTab) {
    if (queue === "brand") {
        if (status === "new" || status === "acknowledged") {
            return [
                { label: "Start review", status: "in_progress" as const },
                {
                    label: "Request brand update",
                    status: "waiting_brand" as const,
                },
                { label: "Resolve case", status: "resolved" as const },
            ];
        }

        if (status === "in_progress" || status === "reopened") {
            return [
                {
                    label: "Request brand update",
                    status: "waiting_brand" as const,
                },
                { label: "Resolve case", status: "resolved" as const },
                { label: "Escalate", status: "escalated" as const },
            ];
        }

        if (status === "waiting_brand") {
            return [
                { label: "Resume review", status: "in_progress" as const },
                { label: "Resolve case", status: "resolved" as const },
                { label: "Close case", status: "closed" as const },
            ];
        }

        return [
            { label: "Reopen case", status: "reopened" as const },
            { label: "Close case", status: "closed" as const },
        ];
    }

    if (status === "new" || status === "acknowledged") {
        return [
            { label: "Start review", status: "in_progress" as const },
            {
                label: "Need customer reply",
                status: "waiting_customer" as const,
            },
            { label: "Resolve case", status: "resolved" as const },
        ];
    }

    if (status === "in_progress" || status === "reopened") {
        return [
            {
                label: "Need customer reply",
                status: "waiting_customer" as const,
            },
            {
                label: "Need brand action",
                status: "waiting_brand" as const,
            },
            { label: "Resolve case", status: "resolved" as const },
            { label: "Refunded", status: "refunded" as const },
            { label: "Replaced", status: "replaced" as const },
            { label: "Decline", status: "declined" as const },
            { label: "Escalate", status: "escalated" as const },
        ];
    }

    if (status === "waiting_customer") {
        return [
            { label: "Resume review", status: "in_progress" as const },
            { label: "Resolve case", status: "resolved" as const },
            { label: "Close case", status: "closed" as const },
        ];
    }

    if (status === "waiting_brand" || status === "waiting_internal") {
        return [
            { label: "Resume review", status: "in_progress" as const },
            { label: "Resolve case", status: "resolved" as const },
        ];
    }

    return [
        { label: "Reopen case", status: "reopened" as const },
        { label: "Close case", status: "closed" as const },
    ];
}

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

function isStatusInTab(status: string, tab: StatusTab) {
    if (tab === "new") return ["new", "acknowledged", "open"].includes(status);
    if (tab === "opened") {
        return [
            "in_progress",
            "waiting_customer",
            "waiting_brand",
            "waiting_internal",
            "reopened",
            "escalated",
            "in_review",
            "waiting_for_customer",
            "waiting_for_brand",
            "approved",
        ].includes(status);
    }

    return [
        "resolved",
        "refunded",
        "replaced",
        "declined",
        "closed",
        "auto_closed",
        "rejected",
    ].includes(status);
}

function formatDisplayStatus(value?: string | null) {
    if (!value) return "Pending";
    return value.replace(/_/g, " ");
}

function getTrackingHref(order: any) {
    const trackingRef =
        order?.shipments?.[0]?.awbNumber ??
        order?.shipments?.[0]?.trackingNumber;
    if (!trackingRef) return null;
    return `/dashboard/tracking/${encodeURIComponent(trackingRef)}`;
}

function getOrderDetailsHref(order: any) {
    if (!order?.id) return null;
    return `/orders/${order.id}`;
}

function formatPaiseValue(value: unknown) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "Not available";
    return formatPriceTag(+convertPaiseToRupees(numericValue));
}

function formatAddressBlock(address: any) {
    if (!address) return "Address not available";

    return [
        address.firstName || address.lastName
            ? [address.firstName, address.lastName].filter(Boolean).join(" ")
            : null,
        address.street,
        [address.city, address.state].filter(Boolean).join(", "),
        address.zip,
        address.phone ? `Phone: ${address.phone}` : null,
    ]
        .filter(Boolean)
        .join("\n");
}

export default function AdminSupportPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queueParam = searchParams.get("queue");
    const ticketParam = searchParams.get("ticket") ?? "";

    const [queue, setQueue] = useState<QueueTab>(
        queueParam === "brand" ? "brand" : "user"
    );
    const [statusTab, setStatusTab] = useState<StatusTab>("new");
    const [selectedId, setSelectedId] = useState(ticketParam);
    const [search, setSearch] = useState("");
    const [manualIntakeOpen, setManualIntakeOpen] = useState(false);
    const [manualTicket, setManualTicket] = useState({
        customer: "",
        sourceChannel: "instagram_dm" as SupportChannel,
        category: "OTHER",
        subject: "",
        description: "",
        orderId: "",
        brandId: "",
    });
    const [replyText, setReplyText] = useState("");
    const [noteText, setNoteText] = useState("");
    const [couponSummary, setCouponSummary] = useState("Apology coupon");
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [approvalPreview, setApprovalPreview] = useState<{
        ticketId: string;
        title: string;
        orderId?: string | null;
        items: ApprovalPreviewItem[];
    } | null>(null);
    const [approvalContext, setApprovalContext] = useState<{
        title: string;
        orderId?: string | null;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQueue(queueParam === "brand" ? "brand" : "user");
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

    const userTicketsQuery =
        trpc.general.adminSupportRouter.listUserTickets.useQuery(
            {
                limit: 50,
                page: 1,
                search,
                status: "all",
            },
            { enabled: queue === "user" }
        );
    const brandTicketsQuery =
        trpc.general.adminSupportRouter.listTickets.useQuery(
            {
                limit: 50,
                page: 1,
                search,
                status: "all",
            },
            { enabled: queue === "brand" }
        );
    const supportHealthQuery =
        trpc.general.adminSupportRouter.getSupportHealth.useQuery();
    const manualTicketMutation =
        trpc.general.adminSupportRouter.createManualUserTicket.useMutation({
            onSuccess: (ticket) => {
                toast.success("Customer support ticket created");
                setQueue("user");
                setSelectedId(ticket.id);
                setManualIntakeOpen(false);
                setManualTicket({
                    customer: "",
                    sourceChannel: "instagram_dm",
                    category: "OTHER",
                    subject: "",
                    description: "",
                    orderId: "",
                    brandId: "",
                });
                userTicketsQuery.refetch();
                supportHealthQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });

    const userTicketQuery =
        trpc.general.adminSupportRouter.getUserTicket.useQuery(selectedId, {
            enabled: queue === "user" && !!selectedId,
        });
    const brandTicketQuery = trpc.general.adminSupportRouter.getTicket.useQuery(
        selectedId,
        { enabled: queue === "brand" && !!selectedId }
    );

    const userMessagesQuery =
        trpc.general.adminSupportRouter.getUserMessages.useQuery(selectedId, {
            enabled: queue === "user" && !!selectedId,
        });
    const brandMessagesQuery =
        trpc.general.adminSupportRouter.getMessages.useQuery(selectedId, {
            enabled: queue === "brand" && !!selectedId,
        });

    const updateUserStatusMutation =
        trpc.general.adminSupportRouter.updateUserTicketStatus.useMutation({
            onSuccess: () => {
                userTicketQuery.refetch();
                userTicketsQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const updateBrandStatusMutation =
        trpc.general.adminSupportRouter.updateStatus.useMutation({
            onSuccess: () => {
                brandTicketQuery.refetch();
                brandTicketsQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const replyUserMutation =
        trpc.general.adminSupportRouter.sendUserMessage.useMutation({
            onSuccess: () => {
                setReplyText("");
                setAttachments([]);
                userMessagesQuery.refetch();
                userTicketQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const replyBrandMutation =
        trpc.general.adminSupportRouter.sendMessage.useMutation({
            onSuccess: () => {
                setReplyText("");
                setAttachments([]);
                brandMessagesQuery.refetch();
                brandTicketQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const addUserNoteMutation =
        trpc.general.adminSupportRouter.addUserInternalNote.useMutation({
            onSuccess: () => {
                setNoteText("");
                userTicketQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const addBrandNoteMutation =
        trpc.general.adminSupportRouter.addInternalNote.useMutation({
            onSuccess: () => {
                setNoteText("");
                brandTicketQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const approveDisputeMutation =
        trpc.general.adminSupportRouter.approveUserDispute.useMutation({
            onSuccess: (dispute) => {
                toast.success(
                    dispute?.replacementOrderId
                        ? `Replacement order ${dispute.replacementOrderId} created and forwarded to the brand`
                        : "Approved and forwarded to the brand"
                );
                userTicketQuery.refetch();
                userTicketsQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
            onSettled: () => setApprovalContext(null),
        });
    const rejectDisputeMutation =
        trpc.general.adminSupportRouter.rejectUserDispute.useMutation({
            onSuccess: () => {
                toast.success("Dispute rejected");
                userTicketQuery.refetch();
                userTicketsQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const apologyCouponMutation =
        trpc.general.adminSupportRouter.sendApologyCoupon.useMutation({
            onSuccess: (coupon) => {
                toast.success(`Coupon ${coupon.code} sent`);
                userTicketQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const dailyCheckInMutation =
        trpc.general.adminSupportRouter.createDailyCheckIn.useMutation({
            onSuccess: (check) => {
                toast.success(`${check.checkType} support check-in logged`);
                supportHealthQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    const weeklySummaryMutation =
        trpc.general.adminSupportRouter.generateWeeklySummary.useMutation({
            onSuccess: () => toast.success("Support weekly summary generated"),
            onError: (error) => toast.error(error.message),
        });
    const monthlyReviewMutation =
        trpc.general.adminSupportRouter.generateMonthlyPatternReview.useMutation(
            {
                onSuccess: () =>
                    toast.success("Support monthly pattern review generated"),
                onError: (error) => toast.error(error.message),
            }
        );

    const queueItems: any[] = useMemo(() => {
        if (queue === "user") return userTicketsQuery.data?.data ?? [];
        return brandTicketsQuery.data?.data ?? [];
    }, [queue, userTicketsQuery.data, brandTicketsQuery.data]);

    const filteredQueueItems = useMemo(
        () =>
            queueItems.filter((item) =>
                isStatusInTab(item.status ?? "new", statusTab)
            ),
        [queueItems, statusTab]
    );

    const statusCounts = useMemo(
        () => ({
            new: queueItems.filter((item) => isStatusInTab(item.status, "new"))
                .length,
            opened: queueItems.filter((item) =>
                isStatusInTab(item.status, "opened")
            ).length,
            resolved: queueItems.filter((item) =>
                isStatusInTab(item.status, "resolved")
            ).length,
        }),
        [queueItems]
    );

    const selectedRecord: any =
        queue === "user" ? userTicketQuery.data : brandTicketQuery.data;
    const selectedMessages: any[] =
        queue === "user"
            ? (userMessagesQuery.data ?? [])
            : (brandMessagesQuery.data ?? []);

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

    const handleManualTicketSubmit = () => {
        if (
            !manualTicket.customer.trim() ||
            !manualTicket.subject.trim() ||
            !manualTicket.description.trim()
        ) {
            toast.error("Customer, subject, and description are required");
            return;
        }

        manualTicketMutation.mutate({
            customer: manualTicket.customer.trim(),
            sourceChannel: manualTicket.sourceChannel,
            category: manualTicket.category,
            subject: manualTicket.subject.trim(),
            description: manualTicket.description.trim(),
            orderId: manualTicket.orderId.trim() || undefined,
            brandId: manualTicket.brandId.trim() || undefined,
        });
    };

    const sendReply = () => {
        if (!selectedId || (!replyText.trim() && attachments.length === 0)) {
            return;
        }

        if (queue === "user") {
            replyUserMutation.mutate({
                ticketId: selectedId,
                text: replyText.trim() || "Shared supporting attachments",
                attachments,
            });
            return;
        }

        replyBrandMutation.mutate({
            ticketId: selectedId,
            text: replyText.trim() || "Shared supporting attachments",
            attachments,
        });
    };

    const addNote = () => {
        if (!selectedId || !noteText.trim()) return;

        if (queue === "user") {
            addUserNoteMutation.mutate({
                ticketId: selectedId,
                note: noteText.trim(),
            });
            return;
        }

        addBrandNoteMutation.mutate({
            ticketId: selectedId,
            note: noteText.trim(),
        });
    };

    const updateSelectedStatus = (status: (typeof statusOptions)[number]) => {
        if (!selectedRecord) return;
        const resolutionCode = terminalResolutionCodeByStatus[status];

        if (queue === "user") {
            updateUserStatusMutation.mutate({
                ticketId: selectedRecord.id,
                status,
                ...(resolutionCode ? { resolutionCode } : {}),
            });
            return;
        }

        updateBrandStatusMutation.mutate({
            ticketId: selectedRecord.id,
            status,
            ...(resolutionCode ? { resolutionCode } : {}),
        });
    };

    return (
        <div className="bg-[#EDF2F8] p-6">
            <div className="space-y-6">
                <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {[
                        {
                            label: "Open tickets",
                            value: supportHealthQuery.data?.openTickets ?? "-",
                        },
                        {
                            label: "Aged >24H (24 Hours)",
                            value:
                                supportHealthQuery.data?.agedTickets24h ?? "-",
                        },
                        {
                            label: "Approaching SLA (Service Level Agreement)",
                            value:
                                supportHealthQuery.data?.approachingSla ?? "-",
                        },
                        {
                            label: "Breached SLA (Service Level Agreement)",
                            value: supportHealthQuery.data?.breachedSla ?? "-",
                        },
                        {
                            label: "CSAT (Customer Satisfaction) 7D (7 Days)",
                            value:
                                supportHealthQuery.data?.csatAverage === null
                                    ? "-"
                                    : supportHealthQuery.data.csatAverage.toFixed(
                                          1
                                      ),
                        },
                        {
                            label: "SLA Hit Rate (Service Level Agreement)",
                            value:
                                supportHealthQuery.data?.slaHitRate === null
                                    ? "-"
                                    : `${supportHealthQuery.data.slaHitRate}%`,
                        },
                    ].map((item) => (
                        <Card
                            key={item.label}
                            className="rounded-[22px] border border-[#D7E2EF] bg-white p-4 shadow-[0_12px_36px_rgba(37,61,94,0.05)]"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-normal text-[#6B94C1]">
                                {item.label}
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">
                                {item.value}
                            </p>
                        </Card>
                    ))}
                </section>

                <section className="flex flex-wrap items-center gap-2">
                    {(["morning", "midday", "eod"] as const).map(
                        (checkType) => (
                            <Button
                                key={checkType}
                                variant="outline"
                                className="rounded-full bg-white"
                                onClick={() =>
                                    dailyCheckInMutation.mutate({
                                        checkType,
                                        summary: `${checkType} support queue check`,
                                    })
                                }
                            >
                                Log{" "}
                                {checkType === "eod"
                                    ? "EOD (End Of Day)"
                                    : checkType}{" "}
                                check
                            </Button>
                        )
                    )}
                    <Button
                        variant="outline"
                        className="rounded-full bg-white"
                        onClick={() =>
                            weeklySummaryMutation.mutate({
                                summary:
                                    "Friday customer support weekly summary",
                            })
                        }
                    >
                        Weekly summary
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-full bg-white"
                        onClick={() => monthlyReviewMutation.mutate({})}
                    >
                        Monthly review
                    </Button>
                </section>

                <Card className="rounded-[34px] border border-[#D7E2EF] bg-white p-6 shadow-[0_18px_50px_rgba(37,61,94,0.06)]">
                    <div className="space-y-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#D5E2F2] bg-[#F8FBFF] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5B8FC5]">
                                    <LifeBuoy className="size-3.5" />
                                    Support Desk
                                </div>
                                <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center">
                                    <div className="inline-flex rounded-[18px] border border-[#D7E2EF] bg-[#F8FBFF] p-1">
                                        {queueTabs.map((tab) => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => {
                                                    router.push(tab.href);
                                                    setQueue(tab.key);
                                                    setSelectedId("");
                                                    setReplyText("");
                                                    setNoteText("");
                                                }}
                                                className={cn(
                                                    "rounded-[14px] px-4 py-2.5 text-sm font-semibold transition",
                                                    queue === tab.key
                                                        ? "bg-[#1F2937] text-white shadow-sm"
                                                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                                                )}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {queue === "user"
                                                ? "Customer issues and resolution flow"
                                                : "Brand operations and support requests"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Review active cases, reply faster,
                                            and keep every order-linked issue in
                                            one place.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 xl:w-[420px]">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            setManualIntakeOpen(
                                                (value) => !value
                                            )
                                        }
                                        className="h-12 rounded-2xl bg-[#1F2937] px-4 text-white hover:bg-[#111827]"
                                    >
                                        Intake ticket
                                    </Button>
                                    <Input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search support cases"
                                        className="h-12 rounded-2xl border-[#D7E2EF] bg-[#FBFDFF]"
                                    />
                                </div>
                            </div>
                        </div>

                        {manualIntakeOpen && (
                            <div className="rounded-[22px] border border-[#DDE6F0] bg-[#F8FBFF] p-4">
                                <div className="grid gap-3 lg:grid-cols-4">
                                    <Input
                                        value={manualTicket.customer}
                                        onChange={(event) =>
                                            setManualTicket((current) => ({
                                                ...current,
                                                customer: event.target.value,
                                            }))
                                        }
                                        placeholder="Customer email or user ID"
                                        className="h-11 rounded-2xl border-[#D7E2EF] bg-white"
                                    />
                                    <select
                                        value={manualTicket.sourceChannel}
                                        onChange={(event) =>
                                            setManualTicket((current) => ({
                                                ...current,
                                                sourceChannel: event.target
                                                    .value as SupportChannel,
                                            }))
                                        }
                                        className="h-11 rounded-2xl border border-[#D7E2EF] bg-white px-3 text-sm text-slate-800"
                                    >
                                        {SUPPORT_CHANNELS.map((channel) => (
                                            <option
                                                key={channel}
                                                value={channel}
                                            >
                                                {channelLabels[channel]}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={manualTicket.category}
                                        onChange={(event) =>
                                            setManualTicket((current) => ({
                                                ...current,
                                                category: event.target.value,
                                            }))
                                        }
                                        className="h-11 rounded-2xl border border-[#D7E2EF] bg-white px-3 text-sm text-slate-800"
                                    >
                                        {categoryOptions.map((category) => (
                                            <option
                                                key={category.value}
                                                value={category.value}
                                            >
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>
                                    <Input
                                        value={manualTicket.orderId}
                                        onChange={(event) =>
                                            setManualTicket((current) => ({
                                                ...current,
                                                orderId: event.target.value,
                                            }))
                                        }
                                        placeholder="Order ID optional"
                                        className="h-11 rounded-2xl border-[#D7E2EF] bg-white"
                                    />
                                </div>
                                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.4fr_auto]">
                                    <Input
                                        value={manualTicket.subject}
                                        onChange={(event) =>
                                            setManualTicket((current) => ({
                                                ...current,
                                                subject: event.target.value,
                                            }))
                                        }
                                        placeholder="Subject"
                                        className="h-11 rounded-2xl border-[#D7E2EF] bg-white"
                                    />
                                    <textarea
                                        value={manualTicket.description}
                                        onChange={(event) =>
                                            setManualTicket((current) => ({
                                                ...current,
                                                description: event.target.value,
                                            }))
                                        }
                                        placeholder="Customer message"
                                        rows={2}
                                        className="min-h-11 rounded-2xl border border-[#D7E2EF] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleManualTicketSubmit}
                                        disabled={
                                            manualTicketMutation.isPending
                                        }
                                        className="h-11 rounded-2xl bg-[#0F766E] px-5 text-white hover:bg-[#115E59]"
                                    >
                                        {manualTicketMutation.isPending
                                            ? "Creating"
                                            : "Create"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <div className="inline-flex min-w-full gap-2 rounded-[18px] border border-[#D7E2EF] bg-[#F8FBFF] p-1.5">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setStatusTab(tab.key)}
                                        className={cn(
                                            "min-w-[150px] flex-1 rounded-[14px] px-4 py-2.5 text-left transition",
                                            statusTab === tab.key
                                                ? "bg-white text-slate-900 shadow-[0_8px_20px_rgba(31,41,55,0.08)]"
                                                : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                                    Status
                                                </p>
                                                <p className="mt-1 text-sm font-semibold md:text-base">
                                                    {tab.label}
                                                </p>
                                            </div>
                                            <span
                                                className={cn(
                                                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                                                    statusTab === tab.key
                                                        ? "bg-slate-100 text-slate-900"
                                                        : "bg-white text-slate-700"
                                                )}
                                            >
                                                {statusCounts[tab.key]}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="overflow-hidden rounded-[24px] border border-[#DDE6F0] bg-white">
                                <div className="flex items-center justify-between border-b border-[#E6EEF7] bg-[#F8FBFF] px-5 py-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Cases in {statusTab}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {filteredQueueItems.length} visible
                                            support cases
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B94C1]">
                                        {queue === "user" ? "Users" : "Brands"}
                                    </span>
                                </div>

                                <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_120px] gap-3 border-b border-[#EEF3F8] bg-[#FCFDFF] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
                                    <span>Case</span>
                                    <span>Owner</span>
                                    <span className="text-right">Status</span>
                                </div>

                                <div className="max-h-[420px] overflow-y-auto xl:max-h-[480px]">
                                    {filteredQueueItems.map((item: any) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedId(item.id)
                                            }
                                            className={cn(
                                                "grid w-full gap-3 border-b border-[#EEF3F8] px-5 py-4 text-left transition last:border-b-0 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_120px]",
                                                selectedId === item.id
                                                    ? "bg-[#F1F8FF]"
                                                    : "bg-white hover:bg-[#FAFCFF]"
                                            )}
                                        >
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                                    {buildSupportDisplayTitle({
                                                        title: item.title,
                                                        issueLabel:
                                                            item.issueLabel,
                                                        issueType:
                                                            item.issueType,
                                                        orderId: item.orderId,
                                                    })}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                    <span>
                                                        Case{" "}
                                                        {item.id.slice(0, 8)}
                                                    </span>
                                                    <span className="text-slate-300">
                                                        /
                                                    </span>
                                                    <span>
                                                        {format(
                                                            new Date(
                                                                item.updatedAt
                                                            ),
                                                            "dd MMM, hh:mm a"
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="min-w-0 self-center">
                                                <p className="truncate text-sm text-slate-700">
                                                    {queue === "user"
                                                        ? item.userName ||
                                                          item.userEmail
                                                        : (item.brandName ??
                                                          item.issueType)}
                                                </p>
                                            </div>
                                            <div className="flex justify-start self-center lg:justify-end">
                                                <StatusBadge
                                                    status={item.status}
                                                />
                                            </div>
                                        </button>
                                    ))}

                                    {!filteredQueueItems.length && (
                                        <div className="px-5 py-12 text-center text-sm text-slate-500">
                                            No cases in this tab right now.
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-[#EEF3F8] bg-[#FCFDFF] px-5 py-3 text-xs text-slate-500">
                                    <span>
                                        Queue stays scrollable so large case
                                        volume does not expand the full page.
                                    </span>
                                    <span className="font-medium text-slate-700">
                                        {filteredQueueItems.length} case
                                        {filteredQueueItems.length === 1
                                            ? ""
                                            : "s"}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-[#DDE6F0] bg-white p-4 md:p-6">
                                {!selectedRecord ? (
                                    <div className="flex min-h-[360px] items-center justify-center rounded-[24px] border border-dashed border-[#D7E2EF] bg-[#F8FBFF] text-sm text-slate-500">
                                        Select a support case to review it.
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="rounded-[28px] border border-[#DDE6F0] bg-[#FBFDFF] p-5">
                                            <div className="space-y-5">
                                                <div className="max-w-4xl">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B94C1]">
                                                        {queue === "user"
                                                            ? "Customer support"
                                                            : "Brand support"}
                                                    </p>
                                                    <h3 className="mt-3 max-w-4xl text-xl font-semibold leading-tight text-slate-900 md:text-[1.75rem]">
                                                        {buildSupportDisplayTitle(
                                                            {
                                                                title: selectedRecord.title,
                                                                issueLabel:
                                                                    selectedRecord.issueLabel,
                                                                issueType:
                                                                    selectedRecord.issueType,
                                                                orderId:
                                                                    selectedRecord.orderId,
                                                            }
                                                        )}
                                                    </h3>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                                    <span className="rounded-full border border-[#DDE6F0] bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                                                        Case{" "}
                                                        {selectedRecord.id.slice(
                                                            0,
                                                            8
                                                        )}
                                                    </span>
                                                    {selectedRecord.orderId && (
                                                        <span className="rounded-full border border-[#DDE6F0] bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                                                            Order{" "}
                                                            {
                                                                selectedRecord.orderId
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="rounded-full border border-[#DDE6F0] bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                                                        Active status:{" "}
                                                        {statusLabels[
                                                            selectedRecord.status as (typeof statusOptions)[number]
                                                        ] ??
                                                            selectedRecord.status.replace(
                                                                /_/g,
                                                                " "
                                                            )}
                                                    </span>
                                                </div>

                                                <div className="rounded-[20px] border border-[#DDE6F0] bg-white p-4">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B94C1]">
                                                                Quick actions
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                Use guided
                                                                actions instead
                                                                of manually
                                                                picking from
                                                                every internal
                                                                status.
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {getSuggestedActions(
                                                                selectedRecord.status,
                                                                queue
                                                            ).map((action) => (
                                                                <button
                                                                    key={`${selectedRecord.id}-${action.status}`}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateSelectedStatus(
                                                                            action.status
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition",
                                                                        action.status ===
                                                                            "resolved" ||
                                                                            action.status ===
                                                                                "refunded" ||
                                                                            action.status ===
                                                                                "replaced"
                                                                            ? "border-[#CFE3F8] bg-[#F3F8FF] text-[#1D4F80] hover:border-[#A8CBEE] hover:bg-white"
                                                                            : action.status ===
                                                                                    "closed" ||
                                                                                action.status ===
                                                                                    "declined"
                                                                              ? "border-[#E2E8F0] bg-[#F8FAFC] text-slate-600 hover:border-slate-300 hover:bg-white"
                                                                              : "border-[#D7E2EF] bg-white text-slate-700 hover:border-[#BDD6EF] hover:bg-[#FAFCFF]"
                                                                    )}
                                                                >
                                                                    {
                                                                        action.label
                                                                    }
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {queue === "user" &&
                                            selectedRecord.order && (
                                                <div className="rounded-[28px] border border-[#DDE6F0] bg-[#F8FBFF] p-5">
                                                    <div className="space-y-5">
                                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                                                    Linked order
                                                                </p>
                                                                <p className="mt-3 text-2xl font-semibold text-slate-900">
                                                                    {
                                                                        selectedRecord
                                                                            .order
                                                                            .id
                                                                    }
                                                                </p>
                                                                <p className="mt-2 text-sm text-slate-500">
                                                                    Placed{" "}
                                                                    {selectedRecord
                                                                        .order
                                                                        .createdAt
                                                                        ? format(
                                                                              new Date(
                                                                                  selectedRecord.order.createdAt
                                                                              ),
                                                                              "dd MMM yyyy, hh:mm a"
                                                                          )
                                                                        : "recently"}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    className="rounded-full"
                                                                    onClick={() =>
                                                                        navigator.clipboard.writeText(
                                                                            selectedRecord
                                                                                .order
                                                                                .id
                                                                        )
                                                                    }
                                                                >
                                                                    Copy order
                                                                    ID
                                                                </Button>
                                                                {getOrderDetailsHref(
                                                                    selectedRecord.order
                                                                ) && (
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-full"
                                                                        asChild
                                                                    >
                                                                        <Link
                                                                            href={
                                                                                getOrderDetailsHref(
                                                                                    selectedRecord.order
                                                                                )!
                                                                            }
                                                                        >
                                                                            Open
                                                                            full
                                                                            order
                                                                        </Link>
                                                                    </Button>
                                                                )}
                                                                {getTrackingHref(
                                                                    selectedRecord.order
                                                                ) && (
                                                                    <Button
                                                                        variant="outline"
                                                                        className="rounded-full"
                                                                        asChild
                                                                    >
                                                                        <Link
                                                                            href={
                                                                                getTrackingHref(
                                                                                    selectedRecord.order
                                                                                )!
                                                                            }
                                                                            target="_blank"
                                                                        >
                                                                            Open
                                                                            tracking
                                                                        </Link>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                            <MiniPill
                                                                label="Order status"
                                                                value={
                                                                    selectedRecord
                                                                        .order
                                                                        .status
                                                                }
                                                            />
                                                            <MiniPill
                                                                label="Shipment"
                                                                value={
                                                                    selectedRecord
                                                                        .order
                                                                        .shipments?.[0]
                                                                        ?.status ??
                                                                    "pending"
                                                                }
                                                            />
                                                            <MiniPill
                                                                label="Courier"
                                                                value={
                                                                    selectedRecord
                                                                        .order
                                                                        .shipments?.[0]
                                                                        ?.courierName ??
                                                                    "Pending"
                                                                }
                                                            />
                                                            <MiniPill
                                                                label="Tracking"
                                                                value={
                                                                    getTrackingHref(
                                                                        selectedRecord.order
                                                                    ) ? (
                                                                        <Link
                                                                            href={
                                                                                getTrackingHref(
                                                                                    selectedRecord.order
                                                                                )!
                                                                            }
                                                                            target="_blank"
                                                                            className="text-[#1D4F80] underline decoration-[#BFD8F0] underline-offset-4"
                                                                        >
                                                                            {selectedRecord
                                                                                .order
                                                                                .shipments?.[0]
                                                                                ?.trackingNumber ??
                                                                                selectedRecord
                                                                                    .order
                                                                                    .shipments?.[0]
                                                                                    ?.awbNumber}
                                                                        </Link>
                                                                    ) : (
                                                                        "not assigned"
                                                                    )
                                                                }
                                                            />
                                                            <MiniPill
                                                                label="Payment"
                                                                value={`${formatDisplayStatus(
                                                                    selectedRecord
                                                                        .order
                                                                        .paymentStatus
                                                                )} / ${
                                                                    selectedRecord
                                                                        .order
                                                                        .paymentMethod ??
                                                                    "N/A"
                                                                }`}
                                                            />
                                                        </div>

                                                        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
                                                            <div className="rounded-[22px] border border-[#DDE6F0] bg-white p-4">
                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                    Customer
                                                                    details
                                                                </p>
                                                                <div className="mt-3 space-y-2 text-sm text-slate-700">
                                                                    <p className="font-medium text-slate-900">
                                                                        {[
                                                                            selectedRecord
                                                                                .user
                                                                                ?.firstName,
                                                                            selectedRecord
                                                                                .user
                                                                                ?.lastName,
                                                                        ]
                                                                            .filter(
                                                                                Boolean
                                                                            )
                                                                            .join(
                                                                                " "
                                                                            ) ||
                                                                            "Customer"}
                                                                    </p>
                                                                    {selectedRecord
                                                                        .user
                                                                        ?.email && (
                                                                        <p>
                                                                            {
                                                                                selectedRecord
                                                                                    .user
                                                                                    .email
                                                                            }
                                                                        </p>
                                                                    )}
                                                                    {selectedRecord
                                                                        .order
                                                                        .address
                                                                        ?.phone && (
                                                                        <p>
                                                                            {
                                                                                selectedRecord
                                                                                    .order
                                                                                    .address
                                                                                    .phone
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="rounded-[22px] border border-[#DDE6F0] bg-white p-4">
                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                    Shipping
                                                                    address
                                                                </p>
                                                                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                                                                    {formatAddressBlock(
                                                                        selectedRecord
                                                                            .order
                                                                            .address
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div className="rounded-[22px] border border-[#DDE6F0] bg-white p-4">
                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                    Order
                                                                    summary
                                                                </p>
                                                                <div className="mt-3 space-y-2 text-sm text-slate-700">
                                                                    <p>
                                                                        Total
                                                                        items:{" "}
                                                                        <span className="font-medium text-slate-900">
                                                                            {
                                                                                selectedRecord
                                                                                    .order
                                                                                    .totalItems
                                                                            }
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        Total
                                                                        amount:{" "}
                                                                        <span className="font-medium text-slate-900">
                                                                            {formatPaiseValue(
                                                                                selectedRecord
                                                                                    .order
                                                                                    .totalAmount
                                                                            )}
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        Delivery:{" "}
                                                                        <span className="font-medium text-slate-900">
                                                                            {formatPaiseValue(
                                                                                selectedRecord
                                                                                    .order
                                                                                    .deliveryAmount
                                                                            )}
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        Discount:{" "}
                                                                        <span className="font-medium text-slate-900">
                                                                            {formatPaiseValue(
                                                                                selectedRecord
                                                                                    .order
                                                                                    .discountAmount
                                                                            )}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="rounded-[22px] border border-[#DDE6F0] bg-white p-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                    Ordered
                                                                    items
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    Full product
                                                                    breakdown
                                                                </p>
                                                            </div>
                                                            <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                                                {selectedRecord.order.items.map(
                                                                    (
                                                                        item: any
                                                                    ) => {
                                                                        const productImage =
                                                                            item
                                                                                .product
                                                                                ?.media?.[0]
                                                                                ?.mediaItem
                                                                                ?.url ??
                                                                            item
                                                                                .product
                                                                                ?.variants?.[0]
                                                                                ?.mediaItem
                                                                                ?.url ??
                                                                            null;
                                                                        const itemPrice =
                                                                            item.priceAtPurchase ??
                                                                            item
                                                                                .variant
                                                                                ?.price ??
                                                                            item
                                                                                .product
                                                                                ?.price ??
                                                                            null;

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                className="flex gap-4 rounded-2xl border border-[#DDE6F0] bg-[#FCFDFF] p-4"
                                                                            >
                                                                                <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                                                                    {productImage ? (
                                                                                        <img
                                                                                            src={
                                                                                                productImage
                                                                                            }
                                                                                            alt={
                                                                                                item
                                                                                                    .product
                                                                                                    .title
                                                                                            }
                                                                                            className="h-full w-full object-cover"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                                                            No
                                                                                            image
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                                                                        {
                                                                                            item
                                                                                                .product
                                                                                                .title
                                                                                        }
                                                                                    </p>
                                                                                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                                                                                        <p>
                                                                                            Brand:{" "}
                                                                                            {
                                                                                                item
                                                                                                    .product
                                                                                                    .brand
                                                                                                    .name
                                                                                            }
                                                                                        </p>
                                                                                        {item
                                                                                            .variant
                                                                                            ?.title && (
                                                                                            <p>
                                                                                                Variant:{" "}
                                                                                                {
                                                                                                    item
                                                                                                        .variant
                                                                                                        .title
                                                                                                }
                                                                                            </p>
                                                                                        )}
                                                                                        <p>
                                                                                            Qty:{" "}
                                                                                            {
                                                                                                item.quantity
                                                                                            }
                                                                                        </p>
                                                                                        <p>
                                                                                            Price:{" "}
                                                                                            {formatPaiseValue(
                                                                                                itemPrice
                                                                                            )}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                                            <div className="space-y-5">
                                                {queue === "user" &&
                                                    selectedRecord.order && (
                                                        <div className="rounded-[28px] border border-[#DDE6F0] bg-[#F8FBFF] p-5">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                                                Support intake
                                                            </p>
                                                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                                <div className="rounded-2xl border border-[#DDE6F0] bg-white p-4">
                                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                        Issue
                                                                    </p>
                                                                    <p className="mt-2 text-sm font-medium text-slate-900">
                                                                        {selectedRecord.issueLabel ??
                                                                            selectedRecord.issueType}
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-2xl border border-[#DDE6F0] bg-white p-4">
                                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                        Order ID
                                                                    </p>
                                                                    <p className="mt-2 text-sm font-medium text-slate-900">
                                                                        {
                                                                            selectedRecord
                                                                                .order
                                                                                .id
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="rounded-2xl border border-[#DDE6F0] bg-white p-4">
                                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                        Order
                                                                        status
                                                                    </p>
                                                                    <p className="mt-2 text-sm font-medium text-slate-900">
                                                                        {
                                                                            selectedRecord
                                                                                .order
                                                                                .status
                                                                        }
                                                                    </p>
                                                                </div>
                                                                {selectedRecord
                                                                    .order
                                                                    .items?.[0]
                                                                    ?.product
                                                                    ?.title && (
                                                                    <div className="rounded-2xl border border-[#DDE6F0] bg-white p-4">
                                                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                            Item
                                                                        </p>
                                                                        <p className="mt-2 text-sm font-medium text-slate-900">
                                                                            {
                                                                                selectedRecord
                                                                                    .order
                                                                                    .items[0]
                                                                                    .product
                                                                                    .title
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {selectedRecord.description && (
                                                                <div className="mt-4 rounded-2xl border border-[#DDE6F0] bg-white p-4">
                                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                                        Customer
                                                                        summary
                                                                    </p>
                                                                    <p className="mt-3 text-sm leading-7 text-slate-600">
                                                                        {
                                                                            selectedRecord.description
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                <div className="rounded-[28px] border border-[#DDE6F0] bg-white p-5">
                                                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B94C1]">
                                                                Conversation
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                Replies, proofs,
                                                                and support
                                                                updates
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1">
                                                        {selectedMessages.map(
                                                            (message: any) => {
                                                                const isAdmin =
                                                                    message.sender ===
                                                                    "admin";

                                                                return (
                                                                    <div
                                                                        key={
                                                                            message.id
                                                                        }
                                                                        className={cn(
                                                                            "flex",
                                                                            isAdmin
                                                                                ? "justify-end"
                                                                                : "justify-start"
                                                                        )}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                "max-w-[88%] rounded-[20px] px-4 py-3.5",
                                                                                isAdmin
                                                                                    ? "rounded-br-md bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.16)]"
                                                                                    : "rounded-bl-md border border-[#DDE6F0] bg-[#F8FBFF] text-slate-900"
                                                                            )}
                                                                        >
                                                                            <p
                                                                                className={cn(
                                                                                    "mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]",
                                                                                    isAdmin
                                                                                        ? "text-white/65"
                                                                                        : "text-slate-400"
                                                                                )}
                                                                            >
                                                                                {isAdmin
                                                                                    ? "Support team"
                                                                                    : "Customer"}
                                                                            </p>
                                                                            <p className="whitespace-pre-wrap text-[15px] leading-7">
                                                                                {
                                                                                    message.text
                                                                                }
                                                                            </p>
                                                                            {!!message
                                                                                .attachments
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
                                                                                                    isAdmin
                                                                                                        ? "border-white/20 bg-white/10 text-white"
                                                                                                        : "border-[#DDE6F0] bg-white text-slate-700"
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
                                                                            <p
                                                                                className={cn(
                                                                                    "mt-3 text-[11px]",
                                                                                    isAdmin
                                                                                        ? "text-white/70"
                                                                                        : "text-slate-400"
                                                                                )}
                                                                            >
                                                                                {format(
                                                                                    new Date(
                                                                                        message.createdAt
                                                                                    ),
                                                                                    "dd MMM, hh:mm a"
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>

                                                    <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                                                        <textarea
                                                            value={replyText}
                                                            onChange={(event) =>
                                                                setReplyText(
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                            rows={4}
                                                            placeholder="Write the next support reply."
                                                            className="w-full rounded-[20px] border border-[#D7E2EF] bg-[#F8FBFF] px-4 py-4 text-sm text-slate-900"
                                                        />
                                                        <div className="rounded-[24px] border border-dashed border-[#C9DCF0] bg-[#F8FBFF] p-4">
                                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                                <p className="text-sm text-slate-600">
                                                                    Add
                                                                    screenshots
                                                                    or proof to
                                                                    this reply
                                                                </p>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="rounded-full"
                                                                    onClick={() =>
                                                                        fileInputRef.current?.click()
                                                                    }
                                                                    disabled={
                                                                        isUploading
                                                                    }
                                                                >
                                                                    {isUploading
                                                                        ? "Uploading..."
                                                                        : "Add attachment"}
                                                                </Button>
                                                            </div>
                                                            <input
                                                                ref={
                                                                    fileInputRef
                                                                }
                                                                type="file"
                                                                multiple
                                                                accept={generatePermittedFileTypes(
                                                                    routeConfig
                                                                ).fileTypes.join()}
                                                                className="hidden"
                                                                onChange={(
                                                                    event
                                                                ) => {
                                                                    const files =
                                                                        Array.from(
                                                                            event
                                                                                .target
                                                                                .files ??
                                                                                []
                                                                        );
                                                                    if (
                                                                        !files.length
                                                                    )
                                                                        return;
                                                                    void uploadAttachments(
                                                                        files
                                                                    );
                                                                    event.currentTarget.value =
                                                                        "";
                                                                }}
                                                            />
                                                            {attachments.length >
                                                                0 && (
                                                                <div className="mt-4 grid gap-2">
                                                                    {attachments.map(
                                                                        (
                                                                            attachment
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    attachment.url
                                                                                }
                                                                                className="flex items-center justify-between rounded-2xl border border-[#DDE6F0] bg-white px-4 py-3"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <FileImage className="size-4 text-[#5B9BD5]" />
                                                                                    <span className="text-sm text-slate-700">
                                                                                        {
                                                                                            attachment.filename
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setAttachments(
                                                                                            (
                                                                                                current
                                                                                            ) =>
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
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <Button
                                                                onClick={
                                                                    sendReply
                                                                }
                                                                className="rounded-full px-6"
                                                                disabled={
                                                                    isUploading ||
                                                                    (!replyText.trim() &&
                                                                        attachments.length ===
                                                                            0)
                                                                }
                                                            >
                                                                <MessageSquareText className="mr-2 size-4" />
                                                                Send reply
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <div className="rounded-[28px] border border-[#DDE6F0] bg-[#F8FBFF] p-5">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                                        Internal notes
                                                    </p>
                                                    <textarea
                                                        value={noteText}
                                                        onChange={(event) =>
                                                            setNoteText(
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        rows={6}
                                                        placeholder="Private notes for the support team."
                                                        className="mt-4 w-full rounded-[22px] border border-[#D7E2EF] bg-white px-4 py-4 text-sm text-slate-900"
                                                    />
                                                    <Button
                                                        onClick={addNote}
                                                        variant="outline"
                                                        className="mt-4 w-full rounded-full"
                                                    >
                                                        Save internal note
                                                    </Button>
                                                    <div className="mt-4 space-y-2">
                                                        {(
                                                            selectedRecord.notes ??
                                                            []
                                                        ).map((note: any) => (
                                                            <div
                                                                key={note.id}
                                                                className="rounded-2xl border border-[#DDE6F0] bg-white p-3 text-sm text-slate-600"
                                                            >
                                                                {note.note}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {queue === "user" &&
                                                    selectedRecord.dispute && (
                                                        <div className="rounded-[28px] border border-[#D5E5F7] bg-[#F7FBFF] p-5">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                                                Dispute snapshot
                                                            </p>
                                                            <div className="mt-4 grid gap-3">
                                                                <MiniPill
                                                                    label="Type"
                                                                    value={
                                                                        selectedRecord
                                                                            .dispute
                                                                            .disputeType
                                                                    }
                                                                />
                                                                <MiniPill
                                                                    label="Status"
                                                                    value={
                                                                        selectedRecord
                                                                            .dispute
                                                                            .status
                                                                    }
                                                                />
                                                                <MiniPill
                                                                    label="Replacement"
                                                                    value={
                                                                        selectedRecord
                                                                            .dispute
                                                                            .replacementOrderId ??
                                                                        "Not created"
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                {queue === "user" && (
                                                    <>
                                                        <div className="rounded-[28px] border border-[#DDE6F0] bg-[#F8FBFF] p-5">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                                                Dispute actions
                                                            </p>
                                                            {[
                                                                "approved_for_brand_action",
                                                                "replacement_created",
                                                            ].includes(
                                                                selectedRecord
                                                                    .dispute
                                                                    ?.status ??
                                                                    ""
                                                            ) ? (
                                                                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                                                                    {selectedRecord
                                                                        .dispute
                                                                        ?.replacementOrderId
                                                                        ? `Replacement order ${selectedRecord.dispute.replacementOrderId} was created and forwarded to the brand.`
                                                                        : "This case has already been approved and forwarded to the brand for action."}
                                                                </div>
                                                            ) : null}
                                                            <div className="mt-4 flex flex-col gap-3">
                                                                <Button
                                                                    onClick={() => {
                                                                        setApprovalContext(
                                                                            {
                                                                                title: selectedRecord.title,
                                                                                orderId:
                                                                                    selectedRecord.orderId,
                                                                            }
                                                                        );
                                                                        const previewItems =
                                                                            (
                                                                                selectedRecord
                                                                                    .order
                                                                                    ?.items ??
                                                                                []
                                                                            )
                                                                                .filter(
                                                                                    (
                                                                                        item: any
                                                                                    ) =>
                                                                                        (!selectedRecord.orderItemId ||
                                                                                            item.id ===
                                                                                                selectedRecord.orderItemId) &&
                                                                                        (!selectedRecord.brandId ||
                                                                                            item
                                                                                                .product
                                                                                                ?.brandId ===
                                                                                                selectedRecord.brandId)
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        item: any
                                                                                    ) => ({
                                                                                        orderItemId:
                                                                                            item.id,
                                                                                        productTitle:
                                                                                            item
                                                                                                .product
                                                                                                ?.title ??
                                                                                            "Product",
                                                                                        variantLabel:
                                                                                            item
                                                                                                .variant
                                                                                                ?.title ??
                                                                                            item
                                                                                                .variant
                                                                                                ?.value ??
                                                                                            item
                                                                                                .variant
                                                                                                ?.sku ??
                                                                                            item.sku ??
                                                                                            "Selected size",
                                                                                        quantity:
                                                                                            item.quantity,
                                                                                    })
                                                                                );

                                                                        setApprovalContext(
                                                                            null
                                                                        );
                                                                        setApprovalPreview(
                                                                            {
                                                                                ticketId:
                                                                                    selectedRecord.id,
                                                                                title: selectedRecord.title,
                                                                                orderId:
                                                                                    selectedRecord.orderId,
                                                                                items: previewItems,
                                                                            }
                                                                        );
                                                                    }}
                                                                    className="rounded-full"
                                                                    disabled={
                                                                        approveDisputeMutation.isPending ||
                                                                        [
                                                                            "approved_for_brand_action",
                                                                            "replacement_created",
                                                                        ].includes(
                                                                            selectedRecord
                                                                                .dispute
                                                                                ?.status ??
                                                                                ""
                                                                        ) ||
                                                                        !selectedRecord.orderId
                                                                    }
                                                                >
                                                                    {approveDisputeMutation.isPending
                                                                        ? "Approving..."
                                                                        : [
                                                                                "approved_for_brand_action",
                                                                                "replacement_created",
                                                                            ].includes(
                                                                                selectedRecord
                                                                                    .dispute
                                                                                    ?.status ??
                                                                                    ""
                                                                            )
                                                                          ? selectedRecord
                                                                                .dispute
                                                                                ?.replacementOrderId
                                                                              ? "Replacement order created"
                                                                              : "Already forwarded to brand"
                                                                          : "Approve for brand action"}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        rejectDisputeMutation.mutate(
                                                                            {
                                                                                ticketId:
                                                                                    selectedRecord.id,
                                                                                summary:
                                                                                    "Rejected after review. The support team shared the decision with the customer.",
                                                                            }
                                                                        )
                                                                    }
                                                                    className="rounded-full"
                                                                    disabled={
                                                                        rejectDisputeMutation.isPending
                                                                    }
                                                                >
                                                                    {rejectDisputeMutation.isPending
                                                                        ? "Rejecting..."
                                                                        : "Reject dispute"}
                                                                </Button>
                                                            </div>
                                                            {!selectedRecord.orderId && (
                                                                <p className="mt-3 text-xs text-amber-700">
                                                                    Brand action
                                                                    is only
                                                                    available
                                                                    for
                                                                    order-linked
                                                                    support
                                                                    cases.
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="rounded-[28px] border border-[#DDE6F0] bg-[#F8FBFF] p-5">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                                                Goodwill coupon
                                                            </p>
                                                            <Input
                                                                value={
                                                                    couponSummary
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setCouponSummary(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="mt-4 h-12 rounded-2xl border-[#D7E2EF] bg-white"
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                onClick={() =>
                                                                    apologyCouponMutation.mutate(
                                                                        {
                                                                            ticketId:
                                                                                selectedRecord.id,
                                                                            description:
                                                                                couponSummary,
                                                                            discountType:
                                                                                "percentage",
                                                                            discountValue: 10,
                                                                            minOrderAmount: 0,
                                                                            maxDiscountAmount: 30000,
                                                                            maxUses: 1,
                                                                            expiresInDays: 30,
                                                                        }
                                                                    )
                                                                }
                                                                className="mt-4 w-full rounded-full"
                                                            >
                                                                <Sparkles className="mr-2 size-4" />
                                                                Send 10% apology
                                                                coupon
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            {approveDisputeMutation.isPending && approvalContext && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-xl rounded-[28px] border border-[#D7E2EF] bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex size-12 items-center justify-center rounded-full bg-[#E8F2FF]">
                                <div className="size-5 animate-spin rounded-full border-2 border-[#6B94C1] border-t-transparent" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                    Creating replacement order
                                </p>
                                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                                    Please wait while we create the dispute
                                    order
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    We are approving{" "}
                                    <span className="font-medium text-slate-900">
                                        {approvalContext.title}
                                    </span>
                                    {approvalContext.orderId
                                        ? ` and creating a linked replacement order for ${approvalContext.orderId}.`
                                        : "."}
                                </p>
                                <div className="mt-5 space-y-3 rounded-[24px] border border-[#E4ECF5] bg-[#F8FBFF] p-4">
                                    <ProgressRow text="Approving the support dispute" />
                                    <ProgressRow text="Creating the replacement order with the same product, size, and quantity" />
                                    <ProgressRow text="Generating the Delhivery shipment for the replacement order" />
                                    <ProgressRow text="Linking the new order back to support and notifying the brand" />
                                </div>
                                <p className="mt-4 text-xs text-slate-500">
                                    Please do not close this page while the
                                    order is being created.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {approvalPreview && (
                <div className="fixed inset-0 z-[79] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[2px]">
                    <div className="w-full max-w-3xl rounded-[30px] border border-[#D7E2EF] bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6B94C1]">
                                    Preview replacement order
                                </p>
                                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                                    Review before approving brand action
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                    The selected size and product stay locked.
                                    You can edit only the replacement quantity
                                    before the order is created in Delhivery.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setApprovalPreview(null)}
                            >
                                Cancel
                            </Button>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-[#E4ECF5] bg-[#F8FBFF] p-5">
                            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                <span className="rounded-full border border-[#DDE6F0] bg-white px-3 py-1.5">
                                    Case: {approvalPreview.title}
                                </span>
                                {approvalPreview.orderId && (
                                    <span className="rounded-full border border-[#DDE6F0] bg-white px-3 py-1.5">
                                        Order: {approvalPreview.orderId}
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 overflow-hidden rounded-[24px] border border-[#DDE6F0] bg-white">
                                <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px] gap-4 border-b border-[#EEF3F8] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    <span>Product</span>
                                    <span>Selected size</span>
                                    <span>Quantity</span>
                                </div>
                                <div className="divide-y divide-[#EEF3F8]">
                                    {approvalPreview.items.map((item) => (
                                        <div
                                            key={item.orderItemId}
                                            className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px] gap-4 px-5 py-4"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {item.productTitle}
                                                </p>
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {item.variantLabel}
                                            </div>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    setApprovalPreview(
                                                        (current) =>
                                                            current
                                                                ? {
                                                                      ...current,
                                                                      items: current.items.map(
                                                                          (
                                                                              currentItem
                                                                          ) =>
                                                                              currentItem.orderItemId ===
                                                                              item.orderItemId
                                                                                  ? {
                                                                                        ...currentItem,
                                                                                        quantity:
                                                                                            Math.max(
                                                                                                1,
                                                                                                Number(
                                                                                                    event
                                                                                                        .target
                                                                                                        .value ||
                                                                                                        1
                                                                                                )
                                                                                            ),
                                                                                    }
                                                                                  : currentItem
                                                                      ),
                                                                  }
                                                                : current
                                                    )
                                                }
                                                className="h-11 rounded-2xl border-[#D7E2EF] bg-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setApprovalPreview(null)}
                            >
                                Back
                            </Button>
                            <Button
                                className="rounded-full"
                                onClick={() => {
                                    setApprovalContext({
                                        title: approvalPreview.title,
                                        orderId: approvalPreview.orderId,
                                    });
                                    setApprovalPreview(null);
                                    approveDisputeMutation.mutate({
                                        ticketId: approvalPreview.ticketId,
                                        disputeType: "replacement",
                                        summary:
                                            "Approved for brand action and replacement handling.",
                                        quantityOverrides:
                                            approvalPreview.items.map(
                                                (item) => ({
                                                    orderItemId:
                                                        item.orderItemId,
                                                    quantity: item.quantity,
                                                })
                                            ),
                                    });
                                }}
                            >
                                Confirm and create replacement order
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge
            variant="outline"
            className="rounded-full border-[#D7E2EF] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600"
        >
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

function MiniPill({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="min-w-[180px] rounded-[22px] border border-[#DDE6F0] bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B94C1]">
                {label}
            </p>
            <p className="mt-2 text-xl font-medium text-slate-900">{value}</p>
        </div>
    );
}

function ProgressRow({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm text-slate-700">
            <div className="size-2.5 rounded-full bg-[#6B94C1]" />
            <span>{text}</span>
        </div>
    );
}

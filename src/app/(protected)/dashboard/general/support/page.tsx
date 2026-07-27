"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
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

type QueueTab = "user" | "grievance" | "brand";
type StatusTab = "new" | "opened" | "resolved";
type UserSupportTopic =
    | "all"
    | "orders"
    | "returns_refunds"
    | "product_issues"
    | "grievances"
    | "payments_account"
    | "general"
    | "other";

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
        key: "grievance",
        label: "Grievance Desk",
        href: "/dashboard/general/support/grievances",
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

const userSupportTopics: Array<{
    key: UserSupportTopic;
    label: string;
    description: string;
}> = [
    {
        key: "all",
        label: "All support",
        description: "Every customer support request",
    },
    {
        key: "orders",
        label: "Orders",
        description: "Delivery, cancellation and order changes",
    },
    {
        key: "returns_refunds",
        label: "Returns & refunds",
        description: "Return requests and refund follow-ups",
    },
    {
        key: "product_issues",
        label: "Product issues",
        description: "Damaged, defective or incorrect products",
    },
    {
        key: "grievances",
        label: "Grievances",
        description: "Complaints, legal and social escalations",
    },
    {
        key: "payments_account",
        label: "Payments & account",
        description: "Payment, login and data requests",
    },
    {
        key: "general",
        label: "General",
        description: "Pre-purchase questions, feedback and other help",
    },
    {
        key: "other",
        label: "Other requests",
        description: "Older or uncategorised support requests",
    },
];

const userSupportTopicCategories: Record<
    Exclude<UserSupportTopic, "all">,
    string[]
> = {
    orders: [
        "ORDER_NOT_RECEIVED",
        "ORDER_DELAYED",
        "ORDER_CANCEL_REQUEST",
        "ORDER_MODIFY_REQUEST",
        "ORDER",
        "DELIVERY_ISSUE",
        "ITEM_MISSING",
    ],
    returns_refunds: ["RETURN_REQUEST", "REFUND_STATUS", "REFUND_NOT_RECEIVED"],
    product_issues: [
        "PRODUCT_DAMAGED",
        "PRODUCT_DEFECTIVE",
        "PRODUCT_NOT_AS_DESCRIBED",
        "PRODUCT_WRONG_ITEM",
        "SIZE_FIT_HELP",
    ],
    grievances: [
        "GRIEVANCE",
        "FEEDBACK_COMPLAINT_GENERAL",
        "LEGAL_THREAT",
        "SOCIAL_COMPLAINT",
    ],
    payments_account: [
        "PAYMENT_FAILED",
        "ACCOUNT_LOGIN_ISSUE",
        "DATA_DELETION_REQUEST",
        "ACCOUNT",
    ],
    general: [
        "SUSTAINABILITY_QUERY",
        "PRE_PURCHASE_QUERY",
        "BULK_B2B_INQUIRY",
        "FEEDBACK_PRAISE",
        "OTHER",
    ],
    other: [],
};

function isInUserSupportTopic(item: any, topic: UserSupportTopic) {
    if (topic === "all") return true;

    const categories = [item.category, item.issueType]
        .filter(Boolean)
        .map((value) => String(value).toUpperCase());

    if (topic === "other") {
        return !Object.entries(userSupportTopicCategories)
            .filter(([key]) => key !== "other")
            .some(([, values]) =>
                categories.some((category) => values.includes(category))
            );
    }

    return categories.some((category) =>
        userSupportTopicCategories[topic].includes(category)
    );
}

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
        if (
            status === "new" ||
            status === "acknowledged" ||
            status === "open"
        ) {
            return [
                { label: "Start review", status: "in_progress" as const },
                {
                    label: "Request brand update",
                    status: "waiting_brand" as const,
                },
                { label: "Resolve case", status: "resolved" as const },
            ];
        }

        if (
            status === "in_progress" ||
            status === "reopened" ||
            status === "approved"
        ) {
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

        if (isTerminalCaseStatus(status)) {
            return [{ label: "Reopen case", status: "reopened" as const }];
        }

        return [{ label: "Start review", status: "in_progress" as const }];
    }

    if (status === "new" || status === "acknowledged" || status === "open") {
        return [
            { label: "Start review", status: "in_progress" as const },
            {
                label: "Need customer reply",
                status: "waiting_customer" as const,
            },
            { label: "Resolve case", status: "resolved" as const },
        ];
    }

    if (
        status === "in_progress" ||
        status === "reopened" ||
        status === "approved"
    ) {
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

    if (isTerminalCaseStatus(status)) {
        return [{ label: "Reopen case", status: "reopened" as const }];
    }

    return [{ label: "Start review", status: "in_progress" as const }];
}

function isTerminalCaseStatus(status?: string | null) {
    return [
        "resolved",
        "refunded",
        "replaced",
        "declined",
        "closed",
        "auto_closed",
    ].includes(status ?? "");
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

export function AdminSupportPage({
    caseId,
    standalone = false,
    initialQueue,
}: {
    caseId?: string;
    standalone?: boolean;
    initialQueue?: QueueTab;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queueParam = searchParams.get("queue") ?? initialQueue ?? "user";
    const ticketParam = caseId ?? searchParams.get("ticket") ?? "";

    const [queue, setQueue] = useState<QueueTab>(
        queueParam === "brand"
            ? "brand"
            : queueParam === "grievance"
              ? "grievance"
              : "user"
    );
    const isStandaloneCasePage = standalone;
    const isUserQueue = queue === "user" || queue === "grievance";
    const [userSupportTopic, setUserSupportTopic] =
        useState<UserSupportTopic>("all");
    const [statusTab, setStatusTab] = useState<StatusTab>("new");
    const [casePage, setCasePage] = useState(1);
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
    const [resolutionDialog, setResolutionDialog] = useState<{
        status: "resolved" | "closed" | "reopened";
    } | null>(null);
    const [resolutionReason, setResolutionReason] = useState("");
    const [resolutionEmail, setResolutionEmail] = useState("");
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
        setQueue(
            queueParam === "brand"
                ? "brand"
                : queueParam === "grievance"
                  ? "grievance"
                  : "user"
        );
        setSelectedId(ticketParam);
        setUserSupportTopic("all");
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
            { enabled: isUserQueue }
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
            enabled: isUserQueue && !!selectedId,
        });
    const brandTicketQuery = trpc.general.adminSupportRouter.getTicket.useQuery(
        selectedId,
        { enabled: queue === "brand" && !!selectedId }
    );

    const userMessagesQuery =
        trpc.general.adminSupportRouter.getUserMessages.useQuery(selectedId, {
            enabled: isUserQueue && !!selectedId,
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
                userMessagesQuery.refetch();
                supportHealthQuery.refetch();
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
        if (isUserQueue) return userTicketsQuery.data?.data ?? [];
        return brandTicketsQuery.data?.data ?? [];
    }, [queue, userTicketsQuery.data, brandTicketsQuery.data]);

    const topicQueueItems = useMemo(
        () =>
            isUserQueue
                ? queueItems.filter((item) =>
                      isInUserSupportTopic(
                          item,
                          queue === "grievance"
                              ? "grievances"
                              : userSupportTopic
                      )
                  )
                : queueItems,
        [queue, queueItems, userSupportTopic, isUserQueue]
    );

    const filteredQueueItems = useMemo(
        () =>
            topicQueueItems.filter((item) =>
                isStatusInTab(item.status ?? "new", statusTab)
            ),
        [topicQueueItems, statusTab]
    );
    const casesPerPage = 8;
    const totalCasePages = Math.max(
        1,
        Math.ceil(filteredQueueItems.length / casesPerPage)
    );
    const paginatedQueueItems = useMemo(
        () =>
            filteredQueueItems.slice(
                (casePage - 1) * casesPerPage,
                casePage * casesPerPage
            ),
        [casePage, filteredQueueItems]
    );

    useEffect(() => {
        setCasePage(1);
    }, [queue, userSupportTopic, statusTab, search]);

    useEffect(() => {
        if (casePage > totalCasePages) setCasePage(totalCasePages);
    }, [casePage, totalCasePages]);

    const statusCounts = useMemo(
        () => ({
            new: topicQueueItems.filter((item) =>
                isStatusInTab(item.status, "new")
            ).length,
            opened: topicQueueItems.filter((item) =>
                isStatusInTab(item.status, "opened")
            ).length,
            resolved: topicQueueItems.filter((item) =>
                isStatusInTab(item.status, "resolved")
            ).length,
        }),
        [topicQueueItems]
    );

    const selectedRecord: any = isUserQueue
        ? userTicketQuery.data
        : brandTicketQuery.data;
    const selectedMessages: any[] = isUserQueue
        ? (userMessagesQuery.data ?? [])
        : (brandMessagesQuery.data ?? []);
    const isCaseLocked = isTerminalCaseStatus(selectedRecord?.status);
    const isOrderRelatedCase = Boolean(
        selectedRecord?.orderId ||
            String(selectedRecord?.category ?? "").startsWith("ORDER_") ||
            /order|delivery|shipment|courier/i.test(
                String(selectedRecord?.issueType ?? selectedRecord?.title ?? "")
            )
    );

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

        if (isUserQueue) {
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

        if (isUserQueue) {
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
        let resolutionSummary: string | undefined;

        if (status === "resolved" || status === "closed") {
            setResolutionReason("");
            setResolutionEmail(
                isUserQueue
                    ? (selectedRecord.userEmail ??
                          selectedRecord.user?.email ??
                          selectedRecord.order?.user?.email ??
                          selectedRecord.intakeContext?.contactEmail ??
                          "")
                    : ""
            );
            setResolutionDialog({ status });
            return;
        }

        if (status === "reopened") {
            setResolutionReason("");
            setResolutionEmail("");
            setResolutionDialog({ status });
            return;
        }

        const resolutionCode = terminalResolutionCodeByStatus[status];

        if (isUserQueue) {
            updateUserStatusMutation.mutate({
                ticketId: selectedRecord.id,
                status,
                ...(resolutionCode ? { resolutionCode } : {}),
                ...(resolutionSummary ? { resolutionSummary } : {}),
            });
            return;
        }

        updateBrandStatusMutation.mutate({
            ticketId: selectedRecord.id,
            status,
            ...(resolutionCode ? { resolutionCode } : {}),
            ...(resolutionSummary ? { reason: resolutionSummary } : {}),
        });
    };

    const submitResolution = () => {
        if (!selectedRecord || !resolutionDialog) return;
        const reason = resolutionReason.trim();
        if (resolutionDialog.status !== "reopened" && !reason) {
            toast.error("A resolution reason is required.");
            return;
        }
        if (
            resolutionDialog.status !== "reopened" &&
            isUserQueue &&
            !resolutionEmail.trim()
        ) {
            toast.error("Please enter or confirm the customer email.");
            return;
        }

        const status = resolutionDialog.status;
        const resolutionCode = terminalResolutionCodeByStatus[status];

        if (isUserQueue) {
            updateUserStatusMutation.mutate({
                ticketId: selectedRecord.id,
                status,
                ...(resolutionCode ? { resolutionCode } : {}),
                ...(reason ? { resolutionSummary: reason } : {}),
                ...(resolutionDialog.status !== "reopened"
                    ? { deliveryEmail: resolutionEmail.trim() }
                    : {}),
            });
        } else {
            updateBrandStatusMutation.mutate({
                ticketId: selectedRecord.id,
                status,
                ...(resolutionCode ? { resolutionCode } : {}),
                ...(reason ? { reason } : {}),
            });
        }
        setResolutionDialog(null);
    };

    const openCaseWorkspace = (ticketId: string) => {
        router.push(
            `/dashboard/general/support/case/${ticketId}?queue=${queue}`
        );
    };

    return (
        <div
            className={cn(
                "min-h-screen bg-[#F6F8FB] p-4 md:p-6",
                isStandaloneCasePage && "bg-[#F6F8FB] p-4 md:p-6"
            )}
        >
            <div
                className={cn(
                    "mx-auto max-w-[1600px] space-y-4",
                    isStandaloneCasePage && "max-w-[1400px]"
                )}
            >
                <section
                    className={cn(
                        "grid gap-3 md:grid-cols-3 xl:grid-cols-6",
                        isStandaloneCasePage && "hidden"
                    )}
                >
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
                                supportHealthQuery.data?.csatAverage == null
                                    ? "-"
                                    : supportHealthQuery.data.csatAverage.toFixed(
                                          1
                                      ),
                        },
                        {
                            label: "SLA Hit Rate (Service Level Agreement)",
                            value:
                                supportHealthQuery.data?.slaHitRate == null
                                    ? "-"
                                    : `${supportHealthQuery.data.slaHitRate}%`,
                        },
                    ].map((item) => (
                        <Card
                            key={item.label}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {item.label}
                            </p>
                            <p className="mt-1 text-xl font-semibold text-slate-950">
                                {item.value}
                            </p>
                        </Card>
                    ))}
                </section>

                <section
                    className={cn(
                        "flex flex-wrap items-center gap-2",
                        isStandaloneCasePage && "hidden"
                    )}
                >
                    {(["morning", "midday", "eod"] as const).map(
                        (checkType) => (
                            <Button
                                key={checkType}
                                variant="outline"
                                className="h-9 rounded-md bg-white text-sm"
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
                        className="h-9 rounded-md bg-white text-sm"
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
                        className="h-9 rounded-md bg-white text-sm"
                        onClick={() => monthlyReviewMutation.mutate({})}
                    >
                        Monthly review
                    </Button>
                </section>

                <Card
                    className={cn(
                        "rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4",
                        isStandaloneCasePage &&
                            "border-0 bg-transparent p-0 shadow-none"
                    )}
                >
                    <div
                        className={cn(
                            "space-y-3",
                            isStandaloneCasePage &&
                                "[&>div:last-child>div:first-child]:hidden [&>div:not(:last-child)]:hidden"
                        )}
                    >
                        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                                    <div className="flex items-center gap-2">
                                        <LifeBuoy className="size-4 text-[#147D73]" />
                                        <span className="text-base font-semibold text-slate-950">
                                            Support inbox
                                        </span>
                                    </div>
                                    <div className="inline-flex w-fit rounded-md bg-slate-100 p-1">
                                        {queueTabs.map((tab) => (
                                            <button
                                                key={tab.key}
                                                type="button"
                                                onClick={() => {
                                                    router.push(tab.href);
                                                    setQueue(tab.key);
                                                    setUserSupportTopic("all");
                                                    setSelectedId("");
                                                    setReplyText("");
                                                    setNoteText("");
                                                }}
                                                className={cn(
                                                    "rounded px-3 py-1.5 text-sm font-medium transition",
                                                    queue === tab.key
                                                        ? "bg-white text-[#16324F] shadow-sm"
                                                        : "text-slate-600 hover:text-slate-950"
                                                )}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="xl:border-l xl:border-slate-200 xl:pl-4">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {queue === "grievance"
                                                ? "Dedicated grievance resolution queue"
                                                : queue === "user"
                                                  ? "Customer issues and resolution flow"
                                                  : "Brand operations and support requests"}
                                        </p>
                                        <p className="mt-0.5 max-w-xl text-xs text-slate-500">
                                            Search, triage, and resolve customer
                                            requests.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 xl:w-[400px]">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            setManualIntakeOpen(
                                                (value) => !value
                                            )
                                        }
                                        className="h-10 rounded-md bg-[#16324F] px-4 text-sm font-medium text-white hover:bg-[#102A43]"
                                    >
                                        Intake ticket
                                    </Button>
                                    <Input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search support cases"
                                        className="h-10 rounded-md border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
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

                        {queue === "grievance" && (
                            <div className="flex flex-col gap-3 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-amber-950">
                                        Grievance Desk
                                    </p>
                                    <p className="mt-0.5 text-xs text-amber-800">
                                        Only formal grievances, complaints,
                                        legal matters, and social escalations
                                        are shown here.
                                    </p>
                                </div>
                                <span className="inline-flex w-fit rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
                                    {topicQueueItems.length} grievance{" "}
                                    {topicQueueItems.length === 1
                                        ? "case"
                                        : "cases"}
                                </span>
                            </div>
                        )}

                        {queue === "user" && (
                            <div className="border-b border-slate-200 pb-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Filter by category
                                        </p>
                                    </div>
                                    <span className="hidden text-xs text-slate-500 sm:inline-flex">
                                        {topicQueueItems.length} cases
                                    </span>
                                </div>
                                <div className="-mx-1 mt-3 overflow-x-auto px-1 pb-1">
                                    <div className="flex min-w-max gap-1.5">
                                        {userSupportTopics.map((topic) => {
                                            const count = queueItems.filter(
                                                (item) =>
                                                    isInUserSupportTopic(
                                                        item,
                                                        topic.key
                                                    )
                                            ).length;
                                            const isActive =
                                                userSupportTopic === topic.key;

                                            return (
                                                <button
                                                    key={topic.key}
                                                    type="button"
                                                    title={topic.description}
                                                    onClick={() => {
                                                        setUserSupportTopic(
                                                            topic.key
                                                        );
                                                        setSelectedId("");
                                                    }}
                                                    className={cn(
                                                        "group flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition",
                                                        isActive
                                                            ? "border-[#16324F] bg-[#16324F] text-white"
                                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950"
                                                    )}
                                                >
                                                    <span>{topic.label}</span>
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-1.5 py-0.5 text-[11px] leading-none",
                                                            isActive
                                                                ? "bg-white/15 text-white"
                                                                : "bg-slate-100 text-slate-600"
                                                        )}
                                                    >
                                                        {count}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <div className="inline-flex min-w-full gap-1 border-b border-slate-200">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setStatusTab(tab.key)}
                                        className={cn(
                                            "min-w-[128px] flex-1 border-b-2 border-transparent px-3 py-2 text-left transition",
                                            statusTab === tab.key
                                                ? "border-[#147D73] text-[#16324F]"
                                                : "text-slate-500 hover:text-slate-900"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {tab.label}
                                                </p>
                                            </div>
                                            <span
                                                className={cn(
                                                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                                                    statusTab === tab.key
                                                        ? "bg-[#E5F3F0] text-[#147D73]"
                                                        : "bg-slate-100 text-slate-600"
                                                )}
                                            >
                                                {statusCounts[tab.key]}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {queue === "user" &&
                                            userSupportTopic !== "all"
                                                ? `${userSupportTopics.find((topic) => topic.key === userSupportTopic)?.label} · `
                                                : ""}
                                            Cases in {statusTab}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {filteredQueueItems.length} visible
                                            support cases
                                        </p>
                                    </div>
                                    <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                        {isUserQueue ? "Users" : "Brands"}
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[960px] text-left">
                                        <thead className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                            <tr>
                                                <th className="px-4 py-2.5">
                                                    Case
                                                </th>
                                                <th className="px-3 py-2.5">
                                                    Customer
                                                </th>
                                                <th className="px-3 py-2.5">
                                                    Category
                                                </th>
                                                <th className="px-3 py-2.5">
                                                    Last activity
                                                </th>
                                                <th className="px-3 py-2.5">
                                                    Priority
                                                </th>
                                                <th className="px-4 py-2.5 text-right">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#EEF3F8]">
                                            {paginatedQueueItems.map(
                                                (item: any) => (
                                                    <tr
                                                        key={item.id}
                                                        onClick={() =>
                                                            openCaseWorkspace(
                                                                item.id
                                                            )
                                                        }
                                                        className={cn(
                                                            "cursor-pointer transition hover:bg-[#F4FAF9]",
                                                            selectedId ===
                                                                item.id &&
                                                                "bg-emerald-50/70"
                                                        )}
                                                    >
                                                        <td className="max-w-[300px] px-4 py-2.5">
                                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                                {buildSupportDisplayTitle(
                                                                    {
                                                                        title: item.title,
                                                                        issueLabel:
                                                                            item.issueLabel,
                                                                        issueType:
                                                                            item.issueType,
                                                                        orderId:
                                                                            item.orderId,
                                                                    }
                                                                )}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                Case #
                                                                {item.id.slice(
                                                                    0,
                                                                    8
                                                                )}
                                                                {item.orderId
                                                                    ? " / Order #" +
                                                                      item.orderId
                                                                    : ""}
                                                            </p>
                                                        </td>
                                                        <td className="max-w-[180px] px-3 py-2.5">
                                                            <p className="truncate text-sm font-medium text-slate-700">
                                                                {isUserQueue
                                                                    ? item.userName ||
                                                                      item.userEmail ||
                                                                      "Customer"
                                                                    : item.brandName ||
                                                                      "Brand"}
                                                            </p>
                                                            {isUserQueue &&
                                                                item.userEmail && (
                                                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                                                        {
                                                                            item.userEmail
                                                                        }
                                                                    </p>
                                                                )}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span className="inline-flex max-w-[170px] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                {formatSupportCategoryLabel(
                                                                    item.category ??
                                                                        item.issueType ??
                                                                        "Other"
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-sm text-slate-600">
                                                            {format(
                                                                new Date(
                                                                    item.latestMessageAt ??
                                                                        item.updatedAt
                                                                ),
                                                                "dd MMM, hh:mm a"
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span
                                                                className={cn(
                                                                    "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                                                                    item.priority ===
                                                                        "critical"
                                                                        ? "bg-rose-100 text-rose-700"
                                                                        : item.priority ===
                                                                            "high"
                                                                          ? "bg-amber-100 text-amber-800"
                                                                          : "bg-slate-100 text-slate-600"
                                                                )}
                                                            >
                                                                {item.priority ??
                                                                    "normal"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right">
                                                            <StatusBadge
                                                                status={
                                                                    item.status
                                                                }
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                    {!filteredQueueItems.length && (
                                        <div className="px-5 py-14 text-center">
                                            <p className="font-medium text-slate-700">
                                                No cases found in this view
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Try another status or support
                                                category.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        Showing{" "}
                                        {filteredQueueItems.length
                                            ? (casePage - 1) * casesPerPage + 1
                                            : 0}
                                        -
                                        {Math.min(
                                            casePage * casesPerPage,
                                            filteredQueueItems.length
                                        )}{" "}
                                        of {filteredQueueItems.length} cases
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-md px-3 text-xs"
                                            disabled={casePage === 1}
                                            onClick={() =>
                                                setCasePage((page) =>
                                                    Math.max(1, page - 1)
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <span className="min-w-[72px] text-center font-medium text-slate-700">
                                            Page {casePage} / {totalCasePages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-md px-3 text-xs"
                                            disabled={
                                                casePage === totalCasePages
                                            }
                                            onClick={() =>
                                                setCasePage((page) =>
                                                    Math.min(
                                                        totalCasePages,
                                                        page + 1
                                                    )
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div
                                id="case-workspace"
                                className={cn(
                                    "rounded-xl border border-slate-200 bg-white p-4 md:p-5",
                                    isStandaloneCasePage &&
                                        "mx-auto w-full max-w-[1180px] rounded-md border border-slate-200 bg-white p-4 shadow-sm md:p-5 [&_button]:!rounded-none [&_input]:!rounded-none [&_textarea]:!rounded-none",
                                    selectedRecord &&
                                        !isStandaloneCasePage &&
                                        "fixed inset-0 z-[70] overflow-y-auto border-0 bg-slate-950/30 p-4 backdrop-blur-[2px] md:p-6"
                                )}
                            >
                                {!selectedRecord ? (
                                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                                        Select a case from the table to open its
                                        full workspace here.
                                    </div>
                                ) : (
                                    <div className="w-full space-y-3 bg-white p-0">
                                        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Case workspace
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Review the case, take an
                                                    action, or reply to the
                                                    customer.
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-9 rounded-md text-sm"
                                                onClick={() => {
                                                    if (isStandaloneCasePage) {
                                                        router.push(
                                                            `/dashboard/general/support?queue=${queue}`
                                                        );
                                                        return;
                                                    }
                                                    setSelectedId("");
                                                }}
                                            >
                                                {isStandaloneCasePage
                                                    ? "Back to Support Desk"
                                                    : "Close workspace"}
                                            </Button>
                                        </div>
                                        <div className="border-b border-slate-200 pb-4">
                                            <div className="space-y-3">
                                                <div className="max-w-4xl">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#147D73]">
                                                        {isUserQueue
                                                            ? queue ===
                                                              "grievance"
                                                                ? "Grievance case"
                                                                : "Customer support"
                                                            : "Brand support"}
                                                    </p>
                                                    <h3 className="mt-1 max-w-4xl text-lg font-semibold leading-tight text-slate-900 md:text-xl">
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
                                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                                                        Case{" "}
                                                        {selectedRecord.id.slice(
                                                            0,
                                                            8
                                                        )}
                                                    </span>
                                                    {selectedRecord.orderId && (
                                                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                                                            Order{" "}
                                                            {
                                                                selectedRecord.orderId
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
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

                                                {isOrderRelatedCase &&
                                                    (selectedRecord.orderId ? (
                                                        <div className="flex flex-col gap-3 border border-slate-200 bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                                    Linked order
                                                                </p>
                                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                                    {
                                                                        selectedRecord.orderId
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button
                                                                    className="h-9 rounded-lg bg-[#1F3B5B] px-3 text-sm text-white hover:bg-[#172C43]"
                                                                    asChild
                                                                >
                                                                    <Link
                                                                        href={
                                                                            getOrderDetailsHref(
                                                                                {
                                                                                    id: selectedRecord.orderId,
                                                                                }
                                                                            )!
                                                                        }
                                                                    >
                                                                        Order
                                                                        details
                                                                    </Link>
                                                                </Button>
                                                                {getTrackingHref(
                                                                    selectedRecord.order
                                                                ) && (
                                                                    <Button
                                                                        variant="outline"
                                                                        className="h-9 rounded-lg border-[#0F766E] px-3 text-sm text-[#0F766E] hover:bg-emerald-50"
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
                                                                            Delivery
                                                                            tracking
                                                                        </Link>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                                            This is an
                                                            order-related case,
                                                            but no order is
                                                            linked yet. Link the
                                                            customer order to
                                                            unlock order details
                                                            and delivery
                                                            tracking.
                                                        </div>
                                                    ))}

                                                <div className="border-y border-slate-200 bg-slate-50 px-3 py-3">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#147D73]">
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
                                                            )
                                                                .filter(
                                                                    (action) =>
                                                                        action.status !==
                                                                            "reopened" ||
                                                                        isTerminalCaseStatus(
                                                                            selectedRecord.status
                                                                        )
                                                                )
                                                                .map(
                                                                    (
                                                                        action
                                                                    ) => (
                                                                        <button
                                                                            key={`${selectedRecord.id}-${action.status}`}
                                                                            type="button"
                                                                            onClick={() =>
                                                                                updateSelectedStatus(
                                                                                    action.status
                                                                                )
                                                                            }
                                                                            className={cn(
                                                                                "rounded-md border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                                                                action.status ===
                                                                                    "reopened"
                                                                                    ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600"
                                                                                    : action.status ===
                                                                                            "resolved" ||
                                                                                        action.status ===
                                                                                            "refunded" ||
                                                                                        action.status ===
                                                                                            "replaced"
                                                                                      ? "border-[#0F766E] bg-[#0F766E] text-white hover:bg-[#115E59] focus-visible:ring-[#0F766E]"
                                                                                      : action.status ===
                                                                                              "closed" ||
                                                                                          action.status ===
                                                                                              "declined"
                                                                                        ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-500"
                                                                                        : action.status ===
                                                                                                "waiting_customer" ||
                                                                                            action.status ===
                                                                                                "waiting_brand"
                                                                                          ? "border-slate-300 bg-white text-[#16324F] hover:bg-slate-50 focus-visible:ring-slate-500"
                                                                                          : "border-[#1F3B5B] bg-[#1F3B5B] text-white hover:bg-[#172C43] focus-visible:ring-[#1F3B5B]"
                                                                            )}
                                                                        >
                                                                            {
                                                                                action.label
                                                                            }
                                                                        </button>
                                                                    )
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isCaseLocked && (
                                                    <div className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                                                        This case is{" "}
                                                        {selectedRecord.status.replace(
                                                            /_/g,
                                                            " "
                                                        )}
                                                        . Chat, attachments,
                                                        refunds, notes, and
                                                        status changes are
                                                        locked until you reopen
                                                        it.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isUserQueue &&
                                            selectedRecord.order && (
                                                <div className="border border-slate-200 bg-white p-3">
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                            <div>
                                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#147D73]">
                                                                    Linked order
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    title="Copy order ID"
                                                                    onClick={async () => {
                                                                        await navigator.clipboard.writeText(
                                                                            selectedRecord
                                                                                .order
                                                                                .id
                                                                        );
                                                                        toast.success(
                                                                            "Order ID copied"
                                                                        );
                                                                    }}
                                                                    className="mt-1 block text-left text-lg font-semibold text-slate-900 underline-offset-4 hover:text-[#147D73] hover:underline"
                                                                >
                                                                    {
                                                                        selectedRecord
                                                                            .order
                                                                            .id
                                                                    }
                                                                </button>
                                                                <p className="mt-1 text-xs text-slate-500">
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

                                                        <div className="grid gap-2 xl:grid-cols-[1.1fr_0.9fr_1fr]">
                                                            <div className="border border-slate-200 bg-slate-50 p-3">
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

                                                            <div className="border border-slate-200 bg-slate-50 p-3">
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

                                                            <div className="border border-slate-200 bg-slate-50 p-3">
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

                                                        <div className="border border-slate-200 bg-white p-3">
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
                                                            <div className="mt-3 grid gap-2 lg:grid-cols-2">
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
                                                                                className="flex gap-3 border border-slate-200 bg-slate-50 p-3"
                                                                            >
                                                                                <div className="h-16 w-16 overflow-hidden rounded-md border border-slate-200 bg-white">
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
                                                {isUserQueue &&
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
                                                            disabled={
                                                                isCaseLocked
                                                            }
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
                                                                    className="h-8 rounded-md text-xs"
                                                                    onClick={() =>
                                                                        fileInputRef.current?.click()
                                                                    }
                                                                    disabled={
                                                                        isUploading ||
                                                                        isCaseLocked
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
                                                                    isCaseLocked ||
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
                                                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
                                                        disabled={isCaseLocked}
                                                    />
                                                    <Button
                                                        onClick={addNote}
                                                        variant="outline"
                                                        className="mt-4 w-full rounded-full"
                                                        disabled={isCaseLocked}
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

                                                {isUserQueue &&
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

                                                {isUserQueue && (
                                                    <>
                                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
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
                                                                    className="bg-[#16324F] text-white shadow-none hover:bg-[#102A43]"
                                                                    disabled={
                                                                        approveDisputeMutation.isPending ||
                                                                        isCaseLocked ||
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
                                                                    className="border-[#E7B1B1] bg-[#FFF8F8] text-[#B42318] hover:bg-[#FEEEEE]"
                                                                    disabled={
                                                                        rejectDisputeMutation.isPending ||
                                                                        isCaseLocked
                                                                    }
                                                                >
                                                                    {rejectDisputeMutation.isPending
                                                                        ? "Rejecting..."
                                                                        : "Reject dispute"}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    className="border-[#147D73] bg-[#147D73] font-semibold text-white shadow-none hover:bg-[#0F625A]"
                                                                    disabled={
                                                                        approveDisputeMutation.isPending ||
                                                                        isCaseLocked ||
                                                                        !selectedRecord.orderId
                                                                    }
                                                                    onClick={() => {
                                                                        const email =
                                                                            window
                                                                                .prompt(
                                                                                    "Confirm the customer email for the refund update.",
                                                                                    selectedRecord
                                                                                        .user
                                                                                        ?.email ??
                                                                                        ""
                                                                                )
                                                                                ?.trim() ??
                                                                            "";
                                                                        if (
                                                                            !/^\S+@\S+\.\S+$/.test(
                                                                                email
                                                                            )
                                                                        ) {
                                                                            toast.error(
                                                                                "Enter a valid customer email to send the refund update."
                                                                            );
                                                                            return;
                                                                        }
                                                                        approveDisputeMutation.mutate(
                                                                            {
                                                                                ticketId:
                                                                                    selectedRecord.id,
                                                                                disputeType:
                                                                                    "refund",
                                                                                summary:
                                                                                    "Refund approved for processing.",
                                                                                customerEmail:
                                                                                    email,
                                                                                quantityOverrides:
                                                                                    [],
                                                                            }
                                                                        );
                                                                    }}
                                                                >
                                                                    Approve
                                                                    refund &
                                                                    email
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

                                                        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
            <Dialog
                open={!!resolutionDialog}
                onOpenChange={(open) => !open && setResolutionDialog(null)}
            >
                <DialogContent className="max-w-xl rounded-md border-slate-200 p-5 [&_button]:!rounded-none">
                    <DialogHeader>
                        <DialogTitle className="text-base text-slate-950">
                            {resolutionDialog?.status === "reopened"
                                ? "Reopen case"
                                : resolutionDialog?.status === "closed"
                                  ? "Close case and notify customer"
                                  : "Resolve case and notify customer"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            {resolutionDialog?.status === "reopened"
                                ? "Reopen this case to restore chat and support actions. You can add an optional note for the customer timeline."
                                : "The reason will appear in the customer chat and in the email sent for this case."}
                        </DialogDescription>
                    </DialogHeader>
                    {isUserQueue && resolutionDialog?.status !== "reopened" && (
                        <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                            Customer email
                            <Input
                                type="email"
                                value={resolutionEmail}
                                onChange={(event) =>
                                    setResolutionEmail(event.target.value)
                                }
                                placeholder="customer@example.com"
                                className="h-10 rounded-none border-slate-300"
                            />
                        </label>
                    )}
                    <label className="block space-y-1.5 text-sm font-medium text-slate-700">
                        {resolutionDialog?.status === "reopened"
                            ? "Reopen reason (optional)"
                            : "Resolution reason"}{" "}
                        {resolutionDialog?.status !== "reopened" && (
                            <span className="text-rose-600">*</span>
                        )}
                        <textarea
                            value={resolutionReason}
                            onChange={(event) =>
                                setResolutionReason(event.target.value)
                            }
                            placeholder={
                                resolutionDialog?.status === "reopened"
                                    ? "Example: Customer sent additional information for review."
                                    : "Explain what was resolved and why the case is being closed."
                            }
                            rows={5}
                            className="w-full resize-none rounded-none border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#16324F]"
                        />
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-none"
                            onClick={() => setResolutionDialog(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="rounded-none bg-[#147D73] text-white hover:bg-[#0F625A]"
                            onClick={submitResolution}
                            disabled={
                                updateUserStatusMutation.isPending ||
                                updateBrandStatusMutation.isPending
                            }
                        >
                            {resolutionDialog?.status === "reopened"
                                ? "Reopen case"
                                : resolutionDialog?.status === "closed"
                                  ? "Close and send email"
                                  : "Resolve and send email"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                                className="h-8 rounded-md text-xs"
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

export default AdminSupportPage;

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
        <div className="min-w-[140px] border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
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

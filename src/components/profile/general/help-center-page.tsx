"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import {
    Bell,
    CircleAlert,
    Clock3,
    FileImage,
    LifeBuoy,
    MessageSquareText,
    Package,
    Plus,
    Send,
    Ticket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";

interface PageProps {
    initialOrders: OrderWithItemAndBrand[];
    user: CachedUser;
}

const categoryOptions = [
    { value: "order", label: "Order issue" },
    { value: "shipping", label: "Shipping issue" },
    { value: "payment", label: "Payment issue" },
    { value: "product", label: "Product issue" },
    { value: "account", label: "Account issue" },
    { value: "other", label: "Other" },
];

const issueOptions: Record<string, Array<{ value: string; label: string }>> = {
    order: [
        { value: "where_is_my_order", label: "Where is my order?" },
        { value: "wrong_item", label: "Wrong item received" },
        { value: "item_damaged", label: "Item is damaged" },
        { value: "return_exchange", label: "Return / exchange needed" },
        { value: "cancel_order", label: "Cancel my order" },
    ],
    shipping: [
        { value: "tracking_delay", label: "Tracking delayed" },
        { value: "not_delivered", label: "Marked delivered but not received" },
        { value: "address_change", label: "Need address help" },
    ],
    payment: [
        { value: "refund_status", label: "Refund status" },
        { value: "payment_failed", label: "Payment failed" },
        { value: "double_charge", label: "Double charge" },
    ],
    product: [
        { value: "product_info", label: "Need product help" },
        { value: "size_help", label: "Size or fit help" },
        { value: "quality_issue", label: "Quality issue" },
    ],
    account: [
        { value: "login_issue", label: "Login problem" },
        { value: "profile_update", label: "Profile update help" },
    ],
    other: [{ value: "general_query", label: "General support request" }],
};

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

export function HelpCenterPage({ initialOrders, user }: PageProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<string>("");
    const [category, setCategory] = useState("order");
    const [issueType, setIssueType] = useState("where_is_my_order");
    const [issueLabel, setIssueLabel] = useState("Where is my order?");
    const [description, setDescription] = useState("");
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const ticketsQuery = trpc.general.userSupport.listMyTickets.useQuery({
        limit: 50,
        page: 1,
    });
    const notificationsCountQuery =
        trpc.general.notifications.unreadCount.useQuery();
    const ordersQuery = trpc.general.orders.getOrdersByUserId.useQuery(
        { userId: user.id },
        { initialData: initialOrders }
    );

    const { startUpload, routeConfig } = useUploadThing(
        "supportAttachmentUploader",
        {
            onUploadError(error) {
                toast.error(error.message);
                setIsUploading(false);
            },
        }
    );

    const selectedOrder = useMemo(
        () =>
            (ordersQuery.data ?? []).find(
                (order) => order.id === selectedOrderId
            ) ?? null,
        [ordersQuery.data, selectedOrderId]
    );

    const createTicketMutation =
        trpc.general.userSupport.createTicket.useMutation({
            onSuccess(ticket) {
                toast.success("Support case created");
                router.push(`/profile/help-center/${ticket.id}`);
            },
            onError(error) {
                toast.error(error.message);
            },
        });

    const currentIssueOptions = issueOptions[category] ?? issueOptions.other;

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

    const handleCreateTicket = () => {
        if (!description.trim()) {
            toast.error("Please describe the issue before sending it.");
            return;
        }

        createTicketMutation.mutate({
            title: buildSupportCaseTitle({
                issueLabel,
                issueType,
                orderId: selectedOrder?.id,
            }),
            category,
            issueType,
            issueLabel,
            description: description.trim(),
            orderId: selectedOrder?.id,
            brandId: selectedOrder?.items?.[0]?.product?.brandId,
            attachments,
            intakeContext: selectedOrder
                ? {
                      orderStatus: selectedOrder.status,
                      paymentStatus: selectedOrder.paymentStatus,
                      shipmentStatus:
                          selectedOrder.shipments?.[0]?.status ?? null,
                  }
                : undefined,
        });
    };

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-[#F7FBFF] to-[#EEF5FF] p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE3F8] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#4A84B8]">
                            <LifeBuoy className="size-3.5" />
                            Support Center
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                            Raise an issue, share proof, and track everything in
                            one place.
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                            Order details, shipment context, replies from
                            support, and any follow-up action from the brand all
                            stay inside the same case.
                        </p>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[360px]">
                        <InfoCard
                            icon={Ticket}
                            label="My Support Cases"
                            value={String(ticketsQuery.data?.length ?? 0)}
                            note="Open and recent"
                        />
                        <InfoCard
                            icon={Bell}
                            label="Unread Updates"
                            value={String(notificationsCountQuery.data ?? 0)}
                            note="Notifications"
                            href="/profile/notifications"
                        />
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                New Case
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                Tell us what went wrong
                            </h2>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => {
                                setSelectedOrderId("");
                                setCategory("order");
                                setIssueType("where_is_my_order");
                                setIssueLabel("Where is my order?");
                                setDescription("");
                                setAttachments([]);
                            }}
                        >
                            Reset
                        </Button>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">
                                Select order
                            </span>
                            <select
                                value={selectedOrderId}
                                onChange={(event) =>
                                    setSelectedOrderId(event.target.value)
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#5B9BD5] focus:bg-white"
                            >
                                <option value="">Not linked to an order</option>
                                {(ordersQuery.data ?? []).map((order) => (
                                    <option key={order.id} value={order.id}>
                                        {order.id} -{" "}
                                        {formatPriceTag(
                                            +convertPaiseToRupees(
                                                order.totalAmount
                                            )
                                        )}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium text-slate-700">
                                Issue category
                            </span>
                            <select
                                value={category}
                                onChange={(event) => {
                                    const nextCategory = event.target.value;
                                    const firstOption =
                                        issueOptions[nextCategory]?.[0];
                                    setCategory(nextCategory);
                                    setIssueType(
                                        firstOption?.value ?? "general_query"
                                    );
                                    setIssueLabel(
                                        firstOption?.label ??
                                            "General support request"
                                    );
                                }}
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#5B9BD5] focus:bg-white"
                            >
                                {categoryOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {currentIssueOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setIssueType(option.value);
                                    setIssueLabel(option.label);
                                }}
                                className={cn(
                                    "rounded-3xl border px-4 py-4 text-left transition",
                                    issueType === option.value
                                        ? "border-[#5B9BD5] bg-[#F1F8FF] shadow-sm"
                                        : "border-slate-200 bg-slate-50 hover:border-[#BFD8F0] hover:bg-white"
                                )}
                            >
                                <p className="text-sm font-semibold text-slate-900">
                                    {option.label}
                                </p>
                            </button>
                        ))}
                    </div>

                    {selectedOrder && (
                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                        Linked Order
                                    </p>
                                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                        Order {selectedOrder.id}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Status: {selectedOrder.status} ·
                                        Payment: {selectedOrder.paymentStatus}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                    Shipment:{" "}
                                    <span className="font-semibold text-slate-900">
                                        {selectedOrder.shipments?.[0]?.status ??
                                            "Pending"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {selectedOrder.items.slice(0, 4).map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-3"
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

                    <div className="mt-6">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Describe the issue
                        </label>
                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            rows={6}
                            placeholder="Tell us what happened, what you expected, and what outcome you need."
                            className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-[#5B9BD5] focus:bg-white"
                        />
                    </div>

                    <div className="mt-6 rounded-[24px] border border-dashed border-[#BCD5EE] bg-[#F8FBFF] p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Add pictures or screenshots
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Damage photos, packaging proof, payment
                                    screenshots, or any other visual context.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Plus className="mr-2 size-4" />
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
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {attachments.map((attachment) => (
                                    <div
                                        key={attachment.url}
                                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileImage className="size-4 text-[#5B9BD5]" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {attachment.filename}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {attachment.contentType ??
                                                        "image"}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAttachments((current) =>
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

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            The support team will review this case and continue
                            the conversation in a dedicated ticket.
                        </p>
                        <Button
                            onClick={handleCreateTicket}
                            className="rounded-full px-6"
                            disabled={
                                createTicketMutation.isPending || isUploading
                            }
                        >
                            <Send className="mr-2 size-4" />
                            {createTicketMutation.isPending
                                ? "Creating..."
                                : "Create support case"}
                        </Button>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                                    Recent Cases
                                </p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                                    Continue an existing conversation
                                </h2>
                            </div>
                            <Link
                                href="/profile/notifications"
                                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]"
                            >
                                View alerts
                            </Link>
                        </div>

                        <div className="mt-5 space-y-3">
                            {(ticketsQuery.data ?? []).length === 0 && (
                                <EmptyState
                                    icon={MessageSquareText}
                                    title="No support cases yet"
                                    description="Once you raise an issue, it will appear here with status, replies, and next actions."
                                />
                            )}

                            {(ticketsQuery.data ?? []).map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/profile/help-center/${ticket.id}`}
                                    className="block rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition hover:border-[#BFD8F0] hover:bg-white"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {buildSupportCaseTitle({
                                                    title: ticket.title,
                                                    issueLabel:
                                                        ticket.issueLabel,
                                                    issueType: ticket.issueType,
                                                    orderId: ticket.orderId,
                                                })}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {ticket.issueLabel ??
                                                    ticket.issueType.replace(
                                                        /_/g,
                                                        " "
                                                    )}
                                            </p>
                                        </div>
                                        <StatusPill status={ticket.status} />
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="size-3.5" />
                                            {format(
                                                new Date(ticket.updatedAt),
                                                "dd MMM, hh:mm a"
                                            )}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <CircleAlert className="size-3.5" />
                                            {ticket.priority ?? "normal"}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                            Quick Help
                        </p>
                        <div className="mt-4 space-y-4">
                            <QuickHelpItem
                                title="Track your order"
                                description="Open your orders to view current shipment progress."
                                href="/profile/orders"
                                icon={Package}
                            />
                            <QuickHelpItem
                                title="Check notifications"
                                description="See support replies and case updates in one place."
                                href="/profile/notifications"
                                icon={Bell}
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
    note,
    href,
}: {
    icon: ElementType;
    label: string;
    value: string;
    note: string;
    href?: string;
}) {
    const content = (
        <div className="rounded-[24px] border border-[#D6E6F6] bg-white/90 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <Icon className="size-5 text-[#5B9BD5]" />
                <span className="text-2xl font-semibold text-slate-900">
                    {value}
                </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#4A84B8]">
                {label}
            </p>
            <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function StatusPill({ status }: { status: string }) {
    const palette =
        status === "resolved"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status === "approved"
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : status === "rejected"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-amber-200 bg-amber-50 text-amber-700";

    return (
        <span
            className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                palette
            )}
        >
            {status.replace(/_/g, " ")}
        </span>
    );
}

function QuickHelpItem({
    icon: Icon,
    title,
    description,
    href,
}: {
    icon: ElementType;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 transition hover:border-[#BFD8F0] hover:bg-white"
        >
            <div className="rounded-2xl bg-[#F1F8FF] p-3">
                <Icon className="size-4 text-[#5B9BD5]" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
        </Link>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Icon className="size-5 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
            </p>
        </div>
    );
}

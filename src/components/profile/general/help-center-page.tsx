"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    CreditCard,
    HelpCircle,
    Loader2,
    MessageCircle,
    Package,
    ShoppingBag,
    Truck,
    User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────
type SidebarTab = "order" | "non_order" | "recent" | "faq";
type SubStep = "list" | "select_issue" | "create_ticket";

type SupportCategory =
    | "order"
    | "payment"
    | "account"
    | "product"
    | "shipping"
    | "other";

interface IssueOption {
    key: string;
    label: string;
    description: string;
    faq?: string; // quick-resolve answer
}

interface IntakeOption {
    value: string;
    label: string;
}

interface OrderSupportIntakeState {
    issueSummary: string;
    currentStatus: string;
    preferredResolution: string;
    packagingStatus: string;
}

type OrderSupportChatStep =
    | "currentStatus"
    | "preferredResolution"
    | "packagingStatus"
    | "issueSummary"
    | "done";

// ── Issue options per category ────────────────────────────────────────
const ORDER_ISSUES: IssueOption[] = [
    {
        key: "where_is_my_order",
        label: "Where is my order?",
        description: "Track your order status",
        faq: "You can track your order from the Orders section in your profile. Once shipped, you'll receive a tracking link via email.",
    },
    {
        key: "cancel_order",
        label: "Cancel my order",
        description: "Request order cancellation",
        faq: "Orders can be cancelled before they are shipped. Go to Orders → select the order → Cancel.",
    },
    {
        key: "wrong_item",
        label: "Wrong item received",
        description: "Received a different item",
    },
    {
        key: "item_damaged",
        label: "Item is damaged",
        description: "Product arrived damaged",
    },
    {
        key: "refund_status",
        label: "Refund status",
        description: "Check your refund progress",
        faq: "Refunds typically take 5-7 business days after the return is picked up. Check your order details for current refund status.",
    },
    {
        key: "return_exchange",
        label: "Return or exchange",
        description: "Return or exchange an item",
    },
    {
        key: "other_order",
        label: "Other issue",
        description: "Something else about this order",
    },
];

const CATEGORY_ISSUES: Record<SupportCategory, IssueOption[]> = {
    order: ORDER_ISSUES,
    payment: [
        {
            key: "payment_failed",
            label: "Payment failed",
            description: "Money deducted but order not placed",
            faq: "If money was deducted but order wasn't placed, the amount will be auto-refunded within 5-7 business days.",
        },
        {
            key: "double_charged",
            label: "Double charged",
            description: "Charged twice for same order",
        },
        {
            key: "refund_not_received",
            label: "Refund not received",
            description: "Waiting for refund",
        },
        {
            key: "payment_method",
            label: "Payment method issue",
            description: "Unable to use a payment method",
        },
        {
            key: "other_payment",
            label: "Other payment issue",
            description: "Other payment related query",
        },
    ],
    account: [
        {
            key: "update_details",
            label: "Update account details",
            description: "Change name, email, or phone",
            faq: "Go to Profile → Personal Details to update your account information.",
        },
        {
            key: "delete_account",
            label: "Delete my account",
            description: "Request account deletion",
        },
        {
            key: "login_issues",
            label: "Login issues",
            description: "Can't log into my account",
        },
        {
            key: "other_account",
            label: "Other account issue",
            description: "Other account related query",
        },
    ],
    product: [
        {
            key: "product_info",
            label: "Product information",
            description: "Questions about a product",
        },
        {
            key: "size_guide",
            label: "Size guide help",
            description: "Need help choosing the right size",
            faq: "Each product page has a size guide. Look for the 'Size Guide' link near the size selector.",
        },
        {
            key: "availability",
            label: "Product availability",
            description: "When will it be back in stock?",
        },
        {
            key: "other_product",
            label: "Other product query",
            description: "Other product related query",
        },
    ],
    shipping: [
        {
            key: "delivery_time",
            label: "Delivery time",
            description: "How long will delivery take?",
            faq: "Standard delivery takes 5-7 business days. Express delivery is available for select locations.",
        },
        {
            key: "change_address",
            label: "Change delivery address",
            description: "Update shipping address",
        },
        {
            key: "not_delivered",
            label: "Not delivered",
            description: "Shows delivered but not received",
        },
        {
            key: "other_shipping",
            label: "Other shipping issue",
            description: "Other shipping related query",
        },
    ],
    other: [
        {
            key: "feedback",
            label: "Give feedback",
            description: "Share your experience",
        },
        {
            key: "partnership",
            label: "Partnership inquiry",
            description: "Business collaboration",
        },
        {
            key: "general_query",
            label: "General query",
            description: "Any other question",
        },
    ],
};

const CATEGORY_META: {
    key: SupportCategory;
    label: string;
    description: string;
    icon: React.ElementType;
}[] = [
    {
        key: "account",
        label: "Account",
        description: "Login, profile, settings",
        icon: User,
    },
    {
        key: "payment",
        label: "Payments",
        description: "Failed payments, refunds, charges",
        icon: CreditCard,
    },
    {
        key: "product",
        label: "Returns & Exchanges",
        description: "Size, availability, details",
        icon: ShoppingBag,
    },
    {
        key: "shipping",
        label: "Cancellations & Charges",
        description: "Delivery, tracking, address",
        icon: Truck,
    },
    {
        key: "other",
        label: "Other",
        description: "Anything else",
        icon: HelpCircle,
    },
];

const FAQ_LIST = [
    {
        q: "How do I track my order?",
        a: "Go to Orders in your profile to see real-time tracking of all your orders.",
    },
    {
        q: "What is the return policy?",
        a: "Most items can be returned within 15 days of delivery. Check the product page for specific return eligibility.",
    },
    {
        q: "How long do refunds take?",
        a: "Refunds are typically processed within 5-7 business days after we receive the returned item.",
    },
    {
        q: "How do I change my delivery address?",
        a: "You can update your address before the order is shipped from the Orders section.",
    },
];

const EMPTY_ORDER_SUPPORT_INTAKE: OrderSupportIntakeState = {
    issueSummary: "",
    currentStatus: "",
    preferredResolution: "",
    packagingStatus: "",
};

const PACKAGING_RELEVANT_ISSUES = new Set([
    "wrong_item",
    "item_damaged",
    "return_exchange",
]);

const PACKAGING_STATUS_OPTIONS: IntakeOption[] = [
    { value: "available", label: "Yes, I still have the item and packaging" },
    { value: "item_only", label: "I have the item, but not the full packaging" },
    { value: "not_available", label: "No, I no longer have them with me" },
];

const ORDER_SUPPORT_STATUS_OPTIONS: Record<string, IntakeOption[]> = {
    default: [
        {
            value: "open_issue",
            label: "The issue is still unresolved and I need help",
        },
        {
            value: "need_update",
            label: "I mainly need an update from the support team",
        },
        {
            value: "partial_resolution",
            label: "It is partly resolved, but I still need support",
        },
    ],
    where_is_my_order: [
        {
            value: "tracking_stuck",
            label: "Tracking has not moved for a while",
        },
        {
            value: "delivery_delayed",
            label: "The expected delivery date has passed",
        },
        {
            value: "tracking_confusing",
            label: "I need help understanding the tracking updates",
        },
    ],
    cancel_order: [
        {
            value: "cancel_before_ship",
            label: "I want to cancel before it ships",
        },
        {
            value: "cancel_requested",
            label: "I already requested cancellation and need confirmation",
        },
        {
            value: "shipped_need_options",
            label: "It may already be shipped and I need next-step guidance",
        },
    ],
    wrong_item: [
        {
            value: "different_product",
            label: "A completely different product arrived",
        },
        {
            value: "wrong_variant",
            label: "The wrong size, color, or variant arrived",
        },
        {
            value: "missing_item",
            label: "Part of the order seems missing",
        },
    ],
    item_damaged: [
        {
            value: "item_damaged",
            label: "The item itself is damaged",
        },
        {
            value: "packaging_damaged",
            label: "The packaging was damaged too",
        },
        {
            value: "quality_issue",
            label: "I noticed a quality issue right after opening",
        },
    ],
    refund_status: [
        {
            value: "refund_delayed",
            label: "The refund is taking longer than expected",
        },
        {
            value: "pickup_done",
            label: "The return was picked up, but refund is still pending",
        },
        {
            value: "need_confirmation",
            label: "I need confirmation of the refund status",
        },
    ],
    return_exchange: [
        {
            value: "need_return",
            label: "I want to return this item",
        },
        {
            value: "need_exchange",
            label: "I want an exchange or replacement",
        },
        {
            value: "eligibility_help",
            label: "I need help checking return or exchange eligibility",
        },
    ],
    other_order: [
        {
            value: "multi_issue",
            label: "There are multiple issues with this order",
        },
        {
            value: "need_manual_review",
            label: "I need someone to manually review this order",
        },
        {
            value: "unclear_next_step",
            label: "I am unsure what the right next step is",
        },
    ],
};

const ORDER_SUPPORT_RESOLUTION_OPTIONS: Record<string, IntakeOption[]> = {
    default: [
        {
            value: "need_help",
            label: "I want the support team to review and guide me",
        },
        {
            value: "need_update",
            label: "I want a clear status update",
        },
        {
            value: "need_resolution",
            label: "I want the issue resolved as soon as possible",
        },
    ],
    where_is_my_order: [
        {
            value: "share_tracking_update",
            label: "Share a delivery or tracking update",
        },
        {
            value: "check_with_logistics",
            label: "Check with the courier or delivery partner",
        },
        {
            value: "advise_next_step",
            label: "Tell me what to do next if the order is delayed",
        },
    ],
    cancel_order: [
        {
            value: "cancel_and_refund",
            label: "Cancel the order and process the refund",
        },
        {
            value: "confirm_cancel_status",
            label: "Confirm whether the cancellation is possible",
        },
        {
            value: "share_alternative",
            label: "Explain my options if cancellation is no longer possible",
        },
    ],
    wrong_item: [
        {
            value: "replacement",
            label: "Arrange a replacement for the correct item",
        },
        {
            value: "return_and_refund",
            label: "Arrange a return and refund",
        },
        {
            value: "manual_review",
            label: "Review the case and tell me the best resolution",
        },
    ],
    item_damaged: [
        {
            value: "replacement",
            label: "Arrange a replacement",
        },
        {
            value: "refund",
            label: "Arrange a return and refund",
        },
        {
            value: "assess_damage",
            label: "Review the damage and advise the next step",
        },
    ],
    refund_status: [
        {
            value: "refund_timeline",
            label: "Tell me when the refund will be completed",
        },
        {
            value: "confirm_refund_mode",
            label: "Confirm where the refund is being sent",
        },
        {
            value: "escalate_refund",
            label: "Escalate the delayed refund for review",
        },
    ],
    return_exchange: [
        {
            value: "start_return",
            label: "Start the return request",
        },
        {
            value: "start_exchange",
            label: "Start an exchange or replacement request",
        },
        {
            value: "eligibility_confirmation",
            label: "Confirm whether this order qualifies",
        },
    ],
    other_order: [
        {
            value: "review_order",
            label: "Review the order and suggest the best path",
        },
        {
            value: "escalate_case",
            label: "Escalate the issue to a support specialist",
        },
        {
            value: "status_update",
            label: "Share an update on the current case",
        },
    ],
};

const getOrderSupportOptions = (
    options: Record<string, IntakeOption[]>,
    issueKey?: string | null
) => {
    if (!issueKey) return options.default;

    return options[issueKey] ?? options.default;
};

const getIntakeOptionLabel = (options: IntakeOption[], value: string) => {
    return options.find((option) => option.value === value)?.label ?? value;
};

// ── Main Component ───────────────────────────────────────────────────
interface PageProps {
    initialOrders: OrderWithItemAndBrand[];
    user: CachedUser;
}

export function HelpCenterPage({ initialOrders, user }: PageProps) {
    const router = useRouter();

    // UI state
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("order");
    const [subStep, setSubStep] = useState<SubStep>("list");
    const [recentFilter, setRecentFilter] = useState<
        "30_days" | "six_months" | "all_time"
    >("30_days");

    // Data state
    const [selectedOrder, setSelectedOrder] =
        useState<OrderWithItemAndBrand | null>(null);
    const [selectedCategory, setSelectedCategory] =
        useState<SupportCategory | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<IssueOption | null>(
        null
    );
    const [expandedAccordion, setExpandedAccordion] = useState<string | null>(
        null
    );
    const [ticketDescription, setTicketDescription] = useState("");
    const [orderSupportIntake, setOrderSupportIntake] =
        useState<OrderSupportIntakeState>(EMPTY_ORDER_SUPPORT_INTAKE);
    const [orderSupportStep, setOrderSupportStep] =
        useState<OrderSupportChatStep>("currentStatus");
    const [orderSupportDraft, setOrderSupportDraft] = useState("");

    // Queries
    const { data: myTickets, refetch: refetchTickets } =
        trpc.general.userSupport.listMyTickets.useQuery(
            { limit: 50, page: 1 },
            { enabled: true }
        );

    const { data: orders } = trpc.general.orders.getOrdersByUserId.useQuery(
        { userId: user.id },
        { initialData: initialOrders }
    );

    // Create ticket mutation
    const createTicketMutation =
        trpc.general.userSupport.createTicket.useMutation({
            onSuccess: (ticket) => {
                toast.success(
                    "Support ticket created! We'll get back to you soon."
                );
                if (ticket) {
                    router.push(`/profile/help-center/${ticket.id}`);
                }
                refetchTickets();
            },
            onError: () => {
                toast.error("Failed to create ticket. Please try again.");
            },
        });

    const resetOrderSupportChat = () => {
        setOrderSupportIntake(EMPTY_ORDER_SUPPORT_INTAKE);
        setTicketDescription("");
        setOrderSupportStep("currentStatus");
        setOrderSupportDraft("");
    };

    const resetFlow = () => {
        setSubStep("list");
        setSelectedOrder(null);
        setSelectedCategory(null);
        setSelectedIssue(null);
        setExpandedAccordion(null);
        setTicketDescription("");
        resetOrderSupportChat();
    };

    const changeSidebarTab = (tab: SidebarTab) => {
        setSidebarTab(tab);
        resetFlow();
    };

    const handleOrderSelect = (order: OrderWithItemAndBrand) => {
        setSelectedOrder(order);
        setSelectedCategory("order");
        setSubStep("select_issue");
    };

    const handleCategorySelect = (cat: SupportCategory) => {
        setSelectedCategory(cat);
        setSubStep("select_issue");
    };

    const handleIssueSelect = (issue: IssueOption) => {
        setSelectedIssue(issue);
        setTicketDescription("");
        resetOrderSupportChat();
        setSubStep("create_ticket");
    };

    const getNextOrderSupportStep = (
        currentStep: Exclude<OrderSupportChatStep, "done">,
        issueKey?: string | null
    ): OrderSupportChatStep => {
        if (currentStep === "currentStatus") return "preferredResolution";
        if (currentStep === "preferredResolution") {
            return issueKey && PACKAGING_RELEVANT_ISSUES.has(issueKey)
                ? "packagingStatus"
                : "issueSummary";
        }
        if (currentStep === "packagingStatus") return "issueSummary";
        return "done";
    };

    const submitOrderSupportDraft = () => {
        const trimmedDraft = orderSupportDraft.trim();

        if (orderSupportStep === "issueSummary") {
            if (!trimmedDraft) {
                toast.error("Please tell us what happened with the order.");
                return;
            }

            setOrderSupportIntake((current) => ({
                ...current,
                issueSummary: trimmedDraft,
            }));
            setOrderSupportDraft("");
            setOrderSupportStep("done");
            return;
        }
    };

    const selectOrderSupportOption = (
        field: "currentStatus" | "preferredResolution" | "packagingStatus",
        value: string
    ) => {
        setOrderSupportIntake((current) => ({
            ...current,
            [field]: value,
        }));

        if (field === "currentStatus") {
            setOrderSupportStep(
                getNextOrderSupportStep(
                    "currentStatus",
                    selectedIssue?.key ?? null
                )
            );
            return;
        }

        if (field === "preferredResolution") {
            setOrderSupportStep(
                getNextOrderSupportStep(
                    "preferredResolution",
                    selectedIssue?.key ?? null
                )
            );
            return;
        }

        setOrderSupportStep(
            getNextOrderSupportStep(
                "packagingStatus",
                selectedIssue?.key ?? null
            )
        );
    };

    const handleSubmitTicket = () => {
        if (!selectedCategory || !selectedIssue) return;

        let description = ticketDescription || undefined;

        if (selectedCategory === "order" && selectedOrder) {
            const statusOptions = getOrderSupportOptions(
                ORDER_SUPPORT_STATUS_OPTIONS,
                selectedIssue.key
            );
            const resolutionOptions = getOrderSupportOptions(
                ORDER_SUPPORT_RESOLUTION_OPTIONS,
                selectedIssue.key
            );
            const needsPackagingCheck = PACKAGING_RELEVANT_ISSUES.has(
                selectedIssue.key
            );

            const missingFields: string[] = [];

            if (!orderSupportIntake.issueSummary.trim()) {
                missingFields.push("what happened");
            }
            if (!orderSupportIntake.currentStatus) {
                missingFields.push("current status");
            }
            if (!orderSupportIntake.preferredResolution) {
                missingFields.push("preferred help");
            }
            if (needsPackagingCheck && !orderSupportIntake.packagingStatus) {
                missingFields.push("item and packaging status");
            }

            if (missingFields.length > 0) {
                toast.error(
                    `Please answer: ${missingFields.join(", ")} before continuing.`
                );
                return;
            }

            const intakeLines = [
                "SUPPORT INTAKE SUMMARY",
                "======================",
                "Order Context",
                `- Issue Type: ${selectedIssue.label}`,
                `- Order ID: ${selectedOrder.id}`,
                `- Order Status: ${selectedOrder.status.replace(/_/g, " ")}`,
                `- Item: ${selectedOrder.items[0]?.product?.title ?? "N/A"}`,
                "",
                "Assistant Questions and Customer Responses",
                `1. Question: What best describes the current situation?`,
                `   Response: ${getIntakeOptionLabel(statusOptions, orderSupportIntake.currentStatus)}`,
                `2. Question: What would you like support to do next?`,
                `   Response: ${getIntakeOptionLabel(resolutionOptions, orderSupportIntake.preferredResolution)}`,
            ];

            if (needsPackagingCheck) {
                intakeLines.push(
                    `3. Question: Do you still have the item and packaging?`,
                    `   Response: ${getIntakeOptionLabel(PACKAGING_STATUS_OPTIONS, orderSupportIntake.packagingStatus)}`
                );
            }

            intakeLines.push(
                "",
                "Customer Complaint (Detailed)",
                orderSupportIntake.issueSummary.trim()
            );

            description = intakeLines.join("\n");
        }

        const titleParts = [selectedIssue.label];
        if (selectedOrder) {
            titleParts.push(`(Order #${selectedOrder.id.slice(0, 8)})`);
        }

        createTicketMutation.mutate({
            title: titleParts.join(" "),
            category: selectedCategory,
            issueType: selectedIssue.key,
            issueLabel: selectedIssue.label,
            description,
            orderId: selectedOrder?.id ?? undefined,
        });
    };

    const getOrderImage = (order: OrderWithItemAndBrand) => {
        const firstItem = order.items[0];
        const itemMedia = firstItem?.product?.media?.[0]?.mediaItem ?? null;
        return {
            url:
                itemMedia?.url ??
                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1",
            alt: itemMedia?.alt ?? firstItem?.product?.title ?? "Product",
        };
    };

    // --- Sub-Renders ---

    // 1. Order Flow View
    const renderOrderFlow = () => {
        if (subStep === "list") {
            return (
                <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#5B9BD5]">
                        Select the item we can help you with
                    </h2>
                    <div
                        className="max-h-[550px] space-y-4 overflow-y-auto pr-3"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        {orders && orders.length > 0 ? (
                            orders.map((order) => {
                                const img = getOrderImage(order);
                                const isDelivered =
                                    order.status === "delivered";
                                const statusColor = isDelivered
                                    ? "text-[#5B9BD5]"
                                    : "text-amber-500";
                                const iconClasses = isDelivered
                                    ? "text-[#5B9BD5]"
                                    : "text-amber-500";

                                return (
                                    <div
                                        key={order.id}
                                        className="group/order overflow-hidden rounded-xl border border-gray-100/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3 border-b border-gray-50/50 bg-gray-50/30 px-5 py-3 transition-colors group-hover/order:bg-[#5B9BD5]/5">
                                            <div className="relative">
                                                <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-700 p-2 shadow-inner">
                                                    <Package className="size-4 text-white" />
                                                </div>
                                                {isDelivered && (
                                                    <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 size-3.5 fill-[#5B9BD5] text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <p
                                                    className={`text-[13px] font-bold ${statusColor} mb-1 capitalize leading-none`}
                                                >
                                                    {order.status}
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    On{" "}
                                                    {format(
                                                        new Date(
                                                            order.createdAt
                                                        ),
                                                        "E, d MMM"
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() =>
                                                handleOrderSelect(order)
                                            }
                                            className="group flex w-full items-center gap-5 p-5 text-left transition-colors hover:bg-gray-50/50"
                                        >
                                            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
                                                <Image
                                                    src={img.url}
                                                    alt={img.alt}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[13px] font-bold text-gray-900">
                                                    {order.items[0]?.product
                                                        ?.brand?.name ??
                                                        "Brand"}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-gray-600">
                                                    {order.items[0]?.product
                                                        ?.title ??
                                                        "Product Name"}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Includes {order.items.length} item
                                                    {order.items.length > 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                            </div>
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-50 transition-colors group-hover:bg-[#5B9BD5]/10">
                                                <ChevronRight
                                                    className="size-4 text-gray-400 transition-colors group-hover:text-[#5B9BD5]"
                                                    strokeWidth={2.5}
                                                />
                                            </div>
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-md border border-gray-100 bg-white py-12 text-center">
                                <Package className="mx-auto mb-3 size-12 text-gray-300" />
                                <p className="text-sm text-gray-500">
                                    No recent orders found.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (subStep === "select_issue" && selectedOrder) {
            return (
                <div className="duration-300 animate-in fade-in slide-in-from-right-4">
                    <button
                        onClick={resetFlow}
                        className="group mb-6 flex items-center text-xs font-semibold tracking-wide text-[#5B9BD5] transition-colors hover:text-[#4A8BC5]"
                    >
                        <ChevronRight className="mr-1 size-3 rotate-180 transition-transform group-hover:-translate-x-1" />{" "}
                        Back to orders
                    </button>
                    <h2 className="mb-6 text-xl font-bold tracking-tight text-gray-900">
                        What issue are you facing with this order?
                    </h2>
                    <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/5">
                        {CATEGORY_ISSUES.order.map((issue) => (
                            <FaqAccordion
                                key={issue.key}
                                issue={issue}
                                expanded={expandedAccordion === issue.key}
                                onToggle={() =>
                                    setExpandedAccordion(
                                        expandedAccordion === issue.key
                                            ? null
                                            : issue.key
                                    )
                                }
                                onContactSupport={() =>
                                    handleIssueSelect(issue)
                                }
                            />
                        ))}
                    </div>
                </div>
            );
        }

        if (subStep === "create_ticket") return renderCreateTicket();
    };

    // 2. Non-Order Flow View
    const renderNonOrderFlow = () => {
        if (subStep === "list") {
            return (
                <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#5B9BD5]">
                        Browse Topics
                    </h2>
                    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                        {CATEGORY_META.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() =>
                                        handleCategorySelect(cat.key)
                                    }
                                    className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#5B9BD5] hover:shadow-md"
                                >
                                    <div className="rounded-full bg-gradient-to-br from-gray-50 to-gray-100 p-4 shadow-inner ring-1 ring-gray-200/50 transition-all duration-300 group-hover:from-[#5B9BD5]/10 group-hover:to-[#5B9BD5]/5 group-hover:ring-[#5B9BD5]/20">
                                        <Icon
                                            className="size-6 text-gray-600 transition-colors group-hover:text-[#5B9BD5]"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <span className="text-center text-sm font-semibold tracking-tight text-gray-900">
                                        {cat.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/5">
                        <div className="divide-y divide-gray-100">
                            {CATEGORY_ISSUES.account
                                .slice(0, 4)
                                .map((issue) => (
                                    <FaqAccordion
                                        key={issue.key}
                                        issue={issue}
                                        expanded={
                                            expandedAccordion === issue.key
                                        }
                                        onToggle={() =>
                                            setExpandedAccordion(
                                                expandedAccordion === issue.key
                                                    ? null
                                                    : issue.key
                                            )
                                        }
                                        onContactSupport={() => {
                                            setSelectedCategory("account");
                                            handleIssueSelect(issue);
                                        }}
                                    />
                                ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (subStep === "select_issue" && selectedCategory) {
            const catMeta = CATEGORY_META.find(
                (c) => c.key === selectedCategory
            ) || { label: selectedCategory, icon: User };
            const Icon = catMeta.icon;

            return (
                <div className="duration-300 animate-in fade-in slide-in-from-right-4">
                    {/* Horizontal topic switcher */}
                    <div className="scrollbar-hide mb-8 flex gap-2 overflow-x-auto border-b border-gray-100 pb-0">
                        {CATEGORY_META.map((cat) => {
                            const isCurrent = cat.key === selectedCategory;
                            const CatIcon = cat.icon;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() =>
                                        handleCategorySelect(cat.key)
                                    }
                                    className={`relative flex min-w-[110px] flex-col items-center justify-center px-4 pb-4 transition-colors ${isCurrent ? "" : "rounded-t-xl hover:bg-gray-50/50"}`}
                                >
                                    {isCurrent && (
                                        <div className="absolute inset-y-0 left-0 right-0 rounded-t-xl bg-gradient-to-t from-[#5B9BD5]/10 to-transparent opacity-50" />
                                    )}
                                    {isCurrent && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5B9BD5]" />
                                    )}
                                    <div
                                        className={`mb-3 rounded-full p-2.5 shadow-sm ring-1 transition-all ${isCurrent ? "bg-white ring-gray-100/50" : "bg-gray-50 ring-transparent"}`}
                                    >
                                        <CatIcon
                                            className={`size-5 ${isCurrent ? "text-gray-900" : "text-gray-500"}`}
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <span
                                        className={`text-center text-[11px] font-semibold leading-tight ${isCurrent ? "text-gray-900" : "text-gray-500"}`}
                                    >
                                        {cat.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/5">
                        <div className="bg-gradient-to-r from-gray-50 to-white p-8">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-gray-100">
                                    <Icon
                                        className="size-5 text-[#5B9BD5]"
                                        strokeWidth={2}
                                    />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-gray-900">
                                    {catMeta.label}
                                </h3>
                            </div>
                            <p className="max-w-2xl text-[13px] leading-relaxed text-gray-500">
                                For {catMeta.label.toLowerCase()} related issues
                                refer to the below questions to get the complete
                                information and if you're still unable to
                                resolve it, click on the{" "}
                                <strong className="text-gray-700">
                                    Contact Us
                                </strong>{" "}
                                option to talk to our customer care.
                            </p>
                        </div>

                        <div className="divide-y divide-gray-100 border-t border-gray-100">
                            {CATEGORY_ISSUES[selectedCategory].map((issue) => (
                                <FaqAccordion
                                    key={issue.key}
                                    issue={issue}
                                    expanded={expandedAccordion === issue.key}
                                    onToggle={() =>
                                        setExpandedAccordion(
                                            expandedAccordion === issue.key
                                                ? null
                                                : issue.key
                                        )
                                    }
                                    onContactSupport={() =>
                                        handleIssueSelect(issue)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (subStep === "create_ticket") return renderCreateTicket();
    };

    // 3. Recent Flow View
    const renderRecentFlow = () => {
        let filteredTickets = myTickets || [];
        if (recentFilter === "30_days") {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            filteredTickets = filteredTickets.filter(
                (t) => new Date(t.createdAt) >= cutoff
            );
        } else if (recentFilter === "six_months") {
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - 6);
            filteredTickets = filteredTickets.filter(
                (t) => new Date(t.createdAt) >= cutoff
            );
        }

        return (
            <div className="duration-300 animate-in fade-in">
                <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-white p-2 shadow-sm ring-1 ring-gray-100">
                            <MessageCircle
                                className="size-4 text-[#5B9BD5]"
                                strokeWidth={2}
                            />
                        </div>
                        <p className="text-sm text-gray-600">
                            Showing queries from{" "}
                            <strong className="font-bold text-gray-900">
                                {recentFilter === "30_days" && "Last 30 Days"}
                                {recentFilter === "six_months" &&
                                    "Last 6 Months"}
                                {recentFilter === "all_time" && "All Time"}
                            </strong>
                        </p>
                    </div>
                    <select
                        value={recentFilter}
                        onChange={(e) => setRecentFilter(e.target.value as any)}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-[#5B9BD5] focus:ring-1 focus:ring-[#5B9BD5]"
                    >
                        <option value="30_days">Last 30 Days</option>
                        <option value="six_months">Last 6 Months</option>
                        <option value="all_time">All Time</option>
                    </select>
                </div>

                {filteredTickets.length > 0 ? (
                    <div
                        className="max-h-[600px] space-y-4 overflow-y-auto pr-2"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        {filteredTickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/profile/help-center/${ticket.id}`}
                                className="group block rounded-xl border border-gray-100/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5B9BD5]/30 hover:shadow-md"
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <h3 className="text-base font-bold text-gray-900 transition-colors group-hover:text-[#5B9BD5]">
                                        {ticket.title}
                                    </h3>
                                    <span className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm">
                                        {ticket.status.replace("_", " ")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <span className="flex items-center gap-1.5 rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-gray-600">
                                        ID: {ticket.id.slice(0, 8)}
                                    </span>
                                    <span>
                                        Created{" "}
                                        {format(
                                            new Date(ticket.createdAt),
                                            "MMM d, yyyy"
                                        )}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-24">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                            <MessageCircle
                                className="size-10 text-gray-300"
                                strokeWidth={1}
                            />
                        </div>
                        <h3 className="mb-2 text-lg font-bold tracking-tight text-gray-900">
                            No queries found
                        </h3>
                        <p className="text-center text-sm leading-relaxed text-gray-500">
                            You haven't raised any support tickets
                            <br />
                            in the{" "}
                            <strong>
                                {recentFilter === "30_days"
                                    ? "Last 30 Days"
                                    : recentFilter === "six_months"
                                      ? "Last 6 Months"
                                      : "All Time"}
                            </strong>{" "}
                            timeframe.
                        </p>
                        {recentFilter !== "all_time" && (
                            <button
                                onClick={() => setRecentFilter("all_time")}
                                className="mt-8 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-[#5B9BD5]"
                            >
                                View All Previous Queries
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // 4. FAQ Flow View
    const renderFaqFlow = () => {
        return (
            <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900">
                        Frequently Asked Questions
                    </h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {FAQ_LIST.map((faq, i) => (
                        <div key={i} className="px-6 py-4">
                            <h3 className="mb-2 text-sm font-bold text-gray-900">
                                {faq.q}
                            </h3>
                            <p className="text-sm leading-relaxed text-gray-600">
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Shared Form: Create Ticket
    const renderCreateTicket = () => {
        const isOrderSupportFlow =
            selectedCategory === "order" && !!selectedIssue && !!selectedOrder;
        const statusOptions = getOrderSupportOptions(
            ORDER_SUPPORT_STATUS_OPTIONS,
            selectedIssue?.key
        );
        const resolutionOptions = getOrderSupportOptions(
            ORDER_SUPPORT_RESOLUTION_OPTIONS,
            selectedIssue?.key
        );
        const needsPackagingCheck =
            !!selectedIssue && PACKAGING_RELEVANT_ISSUES.has(selectedIssue.key);
        const isOrderSupportReady =
            !!orderSupportIntake.issueSummary.trim() &&
            !!orderSupportIntake.currentStatus &&
            !!orderSupportIntake.preferredResolution &&
            (!needsPackagingCheck || !!orderSupportIntake.packagingStatus);
        const canStartOrderSupportChat =
            isOrderSupportReady && orderSupportStep === "done";

        return (
            <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100/80 bg-white p-8 shadow-sm ring-1 ring-black/5 duration-300 animate-in fade-in slide-in-from-bottom-4">
                <button
                    onClick={() => setSubStep("select_issue")}
                    className="group mb-8 flex items-center text-xs font-semibold tracking-wide text-[#5B9BD5] transition-colors hover:text-[#4A8BC5]"
                >
                    <ChevronRight className="mr-1 size-3 rotate-180 transition-transform group-hover:-translate-x-1" />{" "}
                    Back to issues
                </button>
                <div className="mb-8 flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B9BD5]/20 to-[#5B9BD5]/5 ring-1 ring-[#5B9BD5]/20">
                        <MessageCircle
                            className="size-6 text-[#5B9BD5]"
                            strokeWidth={1.5}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-gray-900">
                            Create Support Ticket
                        </h2>
                        <p className="text-sm text-gray-500">
                            Tell us how we can help
                        </p>
                    </div>
                </div>

                <div className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50 ring-1 ring-black/5">
                    <div className="border-b border-gray-100 bg-white px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Query Type
                        </p>
                    </div>
                    <div className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                            {selectedIssue?.label}
                        </p>
                    </div>
                </div>

                {isOrderSupportFlow ? (
                    <>
                        <div className="mb-8 overflow-hidden rounded-2xl border border-[#D7E7F8] bg-[linear-gradient(180deg,#F9FCFF_0%,#F4F8FC_100%)] shadow-sm ring-1 ring-[#E8F1FA]">
                            <div className="flex items-center justify-between border-b border-[#E4EEF8] bg-white/80 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-[#5B9BD5]/10">
                                        <MessageCircle
                                            className="size-5 text-[#5B9BD5]"
                                            strokeWidth={1.8}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Support Assistant
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Guided order intake
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={resetOrderSupportChat}
                                    className="text-xs font-semibold text-[#5B9BD5] transition-colors hover:text-[#4A8BC5]"
                                >
                                    Reset chat
                                </button>
                            </div>

                            <div className="space-y-4 px-4 py-5 md:px-5">
                                <ChatAssistantBubble>
                                    Before I connect you to the order support
                                    team, I&apos;ll collect the basics in this
                                    chat so they can review the case faster.
                                </ChatAssistantBubble>

                                <ChatAssistantBubble>
                                    <span className="font-semibold text-gray-900">
                                        Order #{selectedOrder?.id.slice(0, 8)}
                                    </span>
                                    <span className="mt-1 block">
                                        Issue: {selectedIssue?.label}
                                    </span>
                                    <span className="mt-1 block">
                                        Item:{" "}
                                        {selectedOrder?.items[0]?.product?.title ??
                                            "Product"}
                                    </span>
                                    <span className="mt-1 block capitalize">
                                        Status:{" "}
                                        {selectedOrder?.status.replace(/_/g, " ")}
                                    </span>
                                </ChatAssistantBubble>

                                <ChatAssistantBubble>
                                    1. What best describes the current
                                    situation?
                                </ChatAssistantBubble>
                                {orderSupportStep === "currentStatus" && (
                                    <div className="pl-8">
                                        <div className="flex flex-wrap gap-2">
                                            {statusOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() =>
                                                        selectOrderSupportOption(
                                                            "currentStatus",
                                                            option.value
                                                        )
                                                    }
                                                    className={cn(
                                                        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                                                        orderSupportIntake.currentStatus ===
                                                            option.value
                                                            ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                                            : "border-[#D7E7F8] bg-[#F8FBFF] text-gray-700 hover:border-[#5B9BD5] hover:bg-[#EEF6FF] hover:text-[#4A8BC5]"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!!orderSupportIntake.currentStatus && (
                                    <>
                                        <ChatUserBubble>
                                            {getIntakeOptionLabel(
                                                statusOptions,
                                                orderSupportIntake.currentStatus
                                            )}
                                        </ChatUserBubble>
                                        <ChatAssistantBubble>
                                            2. What would you like the support
                                            team to do next?
                                        </ChatAssistantBubble>
                                        {orderSupportStep ===
                                            "preferredResolution" && (
                                            <div className="pl-8">
                                                <div className="flex flex-wrap gap-2">
                                                    {resolutionOptions.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() =>
                                                                selectOrderSupportOption(
                                                                    "preferredResolution",
                                                                    option.value
                                                                )
                                                            }
                                                            className={cn(
                                                                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                                                                orderSupportIntake.preferredResolution ===
                                                                    option.value
                                                                    ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                                                    : "border-[#D7E7F8] bg-[#F8FBFF] text-gray-700 hover:border-[#5B9BD5] hover:bg-[#EEF6FF] hover:text-[#4A8BC5]"
                                                            )}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {!!orderSupportIntake.preferredResolution && (
                                    <>
                                        <ChatUserBubble>
                                            {getIntakeOptionLabel(
                                                resolutionOptions,
                                                orderSupportIntake.preferredResolution
                                            )}
                                        </ChatUserBubble>
                                    </>
                                )}

                                {needsPackagingCheck &&
                                    !!orderSupportIntake.preferredResolution && (
                                        <>
                                            <ChatAssistantBubble>
                                                3. Do you still have the item
                                                and outer packaging with you?
                                            </ChatAssistantBubble>
                                            {orderSupportStep ===
                                                "packagingStatus" && (
                                                <div className="pl-8">
                                                <div className="flex flex-wrap gap-2">
                                                    {PACKAGING_STATUS_OPTIONS.map(
                                                        (option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() =>
                                                                    selectOrderSupportOption(
                                                                        "packagingStatus",
                                                                        option.value
                                                                    )
                                                                }
                                                                className={cn(
                                                                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                                                                    orderSupportIntake.packagingStatus ===
                                                                        option.value
                                                                        ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                                                        : "border-[#D7E7F8] bg-[#F8FBFF] text-gray-700 hover:border-[#5B9BD5] hover:bg-[#EEF6FF] hover:text-[#4A8BC5]"
                                                                )}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                {needsPackagingCheck &&
                                    !!orderSupportIntake.packagingStatus && (
                                        <ChatUserBubble>
                                            {getIntakeOptionLabel(
                                                PACKAGING_STATUS_OPTIONS,
                                                orderSupportIntake.packagingStatus
                                            )}
                                        </ChatUserBubble>
                                    )}

                                {((!needsPackagingCheck &&
                                    !!orderSupportIntake.preferredResolution) ||
                                    (needsPackagingCheck &&
                                        !!orderSupportIntake.packagingStatus)) && (
                                    <>
                                        <ChatAssistantBubble>
                                            {needsPackagingCheck ? "4" : "3"}.
                                            Lastly, please describe what
                                            happened in your own words so I can
                                            hand this over properly.
                                        </ChatAssistantBubble>
                                        {orderSupportStep ===
                                            "issueSummary" && (
                                            <div className="pl-8">
                                                <textarea
                                                    value={orderSupportDraft}
                                                    onChange={(e) =>
                                                        setOrderSupportDraft(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={`Describe what happened with "${selectedIssue?.label?.toLowerCase()}" in your own words.`}
                                                    rows={4}
                                                    className="w-full resize-y rounded-2xl rounded-tl-md border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow-inner transition-all focus:border-[#5B9BD5] focus:outline-none focus:ring-4 focus:ring-[#5B9BD5]/10"
                                                />
                                                <div className="mt-3 flex justify-end">
                                                    <Button
                                                        type="button"
                                                        onClick={
                                                            submitOrderSupportDraft
                                                        }
                                                        className="rounded-xl bg-[#5B9BD5] px-5 py-2.5 font-semibold text-white hover:bg-[#4A8BC5]"
                                                    >
                                                        Finish Intake
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {orderSupportStep === "done" &&
                                            !!orderSupportIntake.issueSummary.trim() && (
                                            <ChatUserBubble>
                                                {orderSupportIntake.issueSummary.trim()}
                                            </ChatUserBubble>
                                        )}
                                    </>
                                )}

                                {orderSupportStep === "done" && (
                                    <ChatAssistantBubble>
                                        Perfect. Your support summary is ready.
                                        Start the chat and our team will continue
                                        from here.
                                    </ChatAssistantBubble>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mb-8">
                        <label className="mb-2 flex items-center justify-between font-semibold text-gray-900">
                            <span>Additional Details</span>
                            <span className="text-xs font-normal text-gray-400">
                                Optional but recommended
                            </span>
                        </label>
                        <textarea
                            value={ticketDescription}
                            onChange={(e) => setTicketDescription(e.target.value)}
                            placeholder="Please describe your issue in detail. The more info you provide, the faster we can help resolve it."
                            rows={5}
                            className="w-full resize-y rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow-inner transition-all focus:border-[#5B9BD5] focus:outline-none focus:ring-4 focus:ring-[#5B9BD5]/10"
                        />
                    </div>
                )}

                <Button
                    onClick={handleSubmitTicket}
                    disabled={
                        createTicketMutation.isPending ||
                        (isOrderSupportFlow && !canStartOrderSupportChat)
                    }
                    className="w-full rounded-xl bg-[#5B9BD5] py-6 font-bold tracking-wide text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#4A8BC5] hover:shadow-lg active:translate-y-0 active:shadow-sm"
                >
                    {createTicketMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 size-5 animate-spin" />{" "}
                            {isOrderSupportFlow
                                ? "STARTING CHAT..."
                                : "SUBMITTING..."}
                        </>
                    ) : isOrderSupportFlow ? (
                        "START SUPPORT CHAT"
                    ) : (
                        "SUBMIT TICKET"
                    )}
                </Button>
            </div>
        );
    };

    // ── Main Render Structure ──────────────────────────────────────────
    return (
        <div className="mx-auto mb-10 w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-xl shadow-gray-200/40">
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur-xl md:px-10">
                <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5B9BD5] to-[#4A8BC5] shadow-lg shadow-[#5B9BD5]/20">
                        <HelpCircle
                            className="size-7 text-white"
                            strokeWidth={2}
                        />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold uppercase leading-none tracking-tight text-gray-900 md:text-2xl">
                            HELP CENTER
                        </h1>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            We are here to help you
                        </p>
                    </div>
                </div>
                <div className="hidden items-center gap-8 md:flex">
                    <div className="flex items-center gap-5 border-r border-gray-200 pr-8">
                        <ShoppingBag
                            className="size-10 text-gray-300"
                            strokeWidth={1.5}
                        />
                        <div className="flex flex-col justify-center">
                            <p className="text-xs font-bold tracking-wider text-gray-800">
                                TRACK, CANCEL, RETURN
                            </p>
                            <p className="text-xs text-gray-500">
                                Manage your purchases
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/profile/orders"
                        className="rounded-full border-2 border-[#5B9BD5] px-8 py-2.5 text-xs font-bold tracking-widest text-[#5B9BD5] shadow-sm transition-all hover:bg-[#5B9BD5] hover:text-white"
                    >
                        ORDERS
                    </Link>
                </div>
            </div>

            <div className="flex min-h-[650px] flex-col items-stretch bg-[#f4f4f5]/30 md:flex-row">
                {/* Left Sidebar Menu */}
                <div className="z-10 flex w-full shrink-0 flex-col items-stretch border-r border-gray-200 bg-white pt-8 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] md:w-[300px]">
                    <div className="mb-6 px-10">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#5B9BD5]">
                            Select Query Type
                        </p>
                    </div>
                    <nav className="flex flex-col gap-1 px-4">
                        <SidebarItem
                            tab="order"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("order")}
                            label="Order Related Queries"
                            icon={<Package className="size-4" />}
                        />
                        <SidebarItem
                            tab="non_order"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("non_order")}
                            label="Non-order Related Issues"
                            icon={<HelpCircle className="size-4" />}
                        />
                        <SidebarItem
                            tab="recent"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("recent")}
                            label="Recent Issues"
                            icon={<MessageCircle className="size-4" />}
                        />

                        <div className="mx-6 my-4 border-t border-gray-100" />

                        <SidebarItem
                            tab="faq"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("faq")}
                            label="Frequently Asked Questions"
                            icon={<HelpCircle className="size-4" />}
                        />
                    </nav>
                    <div className="mt-auto border-t border-gray-100 bg-gradient-to-b from-transparent to-gray-50/50 px-8 py-8 md:pb-12">
                        <div className="flex items-center gap-3 opacity-60 transition-opacity hover:opacity-100">
                            <div className="rounded-full bg-gray-200 p-2">
                                <Truck className="size-4 text-gray-600" />
                            </div>
                            <p className="text-xs font-bold leading-relaxed tracking-wide text-gray-500">
                                Want to reach us old style? <br />
                                Here is our{" "}
                                <a
                                    href="#"
                                    className="font-extrabold text-[#5B9BD5] hover:underline"
                                >
                                    postal address
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Main Content */}
                <div className="relative flex-1 p-6 md:p-10">
                    <div className="mx-auto h-full max-w-4xl">
                        {sidebarTab === "order" && renderOrderFlow()}
                        {sidebarTab === "non_order" && renderNonOrderFlow()}
                        {sidebarTab === "recent" && renderRecentFlow()}
                        {sidebarTab === "faq" && renderFaqFlow()}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Shared Sub-components ────────────────────────────────────────────

function ChatAssistantBubble({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm leading-relaxed text-gray-700 shadow-sm ring-1 ring-black/5">
                {children}
            </div>
        </div>
    );
}

function ChatUserBubble({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#5B9BD5] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                {children}
            </div>
        </div>
    );
}

function SidebarItem({
    tab,
    current,
    onClick,
    label,
    icon,
}: {
    tab: string;
    current: string;
    onClick: () => void;
    label: string;
    icon?: React.ReactNode;
}) {
    const isActive = tab === current;
    return (
        <button
            onClick={onClick}
            className={`group flex items-center justify-between rounded-xl px-4 py-4 text-[13px] font-bold tracking-wide transition-all duration-200 ${isActive ? "bg-[#5B9BD5] text-white shadow-md shadow-[#5B9BD5]/20" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
        >
            <div className="flex items-center gap-3">
                {icon && (
                    <span
                        className={`${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"} transition-colors`}
                    >
                        {icon}
                    </span>
                )}
                {label}
            </div>
            <ChevronRight
                className={`size-4 transition-transform group-hover:translate-x-1 ${isActive ? "text-white/80" : "text-gray-300 group-hover:text-gray-400"}`}
                strokeWidth={isActive ? 2.5 : 2}
            />
        </button>
    );
}

function FaqAccordion({
    issue,
    expanded,
    onToggle,
    onContactSupport,
}: {
    issue: IssueOption;
    expanded: boolean;
    onToggle: () => void;
    onContactSupport: () => void;
}) {
    return (
        <div className="bg-white transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50/30">
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between px-6 py-5 outline-none"
            >
                <span className="text-left text-sm font-semibold text-gray-900">
                    {issue.label}
                </span>
                <div
                    className={`flex size-6 items-center justify-center rounded-full transition-colors ${expanded ? "bg-[#5B9BD5]/10" : "bg-gray-50 group-hover:bg-gray-100"}`}
                >
                    <ChevronDown
                        className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180 text-[#5B9BD5]" : "text-gray-400"}`}
                    />
                </div>
            </button>

            {expanded && (
                <div className="px-6 pb-6 pt-0 text-sm">
                    {issue.faq ? (
                        <>
                            <p className="mb-4 whitespace-pre-line rounded-md border border-gray-100 bg-gray-50/50 p-4 text-[13px] leading-relaxed text-gray-600">
                                {issue.faq}
                            </p>
                            <p className="text-[13px] font-medium text-gray-500">
                                Still unable to resolve it?{" "}
                                <button
                                    onClick={onContactSupport}
                                    className="ml-1 font-bold uppercase tracking-wide text-[#5B9BD5] hover:underline"
                                >
                                    Contact Us
                                </button>
                            </p>
                        </>
                    ) : (
                        <p className="text-[13px] font-medium text-gray-500">
                            Need help with this?{" "}
                            <button
                                onClick={onContactSupport}
                                className="ml-1 font-bold uppercase tracking-wide text-[#5B9BD5] hover:underline"
                            >
                                Contact Us
                            </button>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

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

    const resetFlow = () => {
        setSubStep("list");
        setSelectedOrder(null);
        setSelectedCategory(null);
        setSelectedIssue(null);
        setExpandedAccordion(null);
        setTicketDescription("");
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
        setSubStep("create_ticket");
    };

    const handleSubmitTicket = () => {
        if (!selectedCategory || !selectedIssue) return;

        const titleParts = [selectedIssue.label];
        if (selectedOrder) {
            titleParts.push(`(Order #${selectedOrder.id.slice(0, 8)})`);
        }

        createTicketMutation.mutate({
            title: titleParts.join(" "),
            category: selectedCategory,
            issueType: selectedIssue.key,
            description: ticketDescription || undefined,
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
                <div>
                    <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wide text-gray-700">
                        Select the item we can help you with
                    </h2>
                    <div
                        className="max-h-[550px] space-y-4 overflow-y-auto pr-2"
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
                                        className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/30 px-5 py-3">
                                            <div className="relative">
                                                <div className="flex items-center justify-center rounded-full bg-gray-800 p-1.5">
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
                                            className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-gray-50/50"
                                        >
                                            <div className="relative size-16 shrink-0 overflow-hidden rounded bg-gray-100">
                                                <Image
                                                    src={img.url}
                                                    alt={img.alt}
                                                    fill
                                                    className="object-cover mix-blend-multiply"
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
                                                    Size:{" "}
                                                    {order.items[0]?.variant
                                                        ?.size ?? "N/A"}{" "}
                                                    {order.items.length > 1 &&
                                                        `| +${order.items.length - 1} more items`}
                                                </p>
                                            </div>
                                            <ChevronRight className="size-5 shrink-0 text-gray-300 transition group-hover:text-gray-600" />
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
                <div>
                    <button
                        onClick={resetFlow}
                        className="mb-4 text-xs font-semibold text-[#5B9BD5] hover:underline"
                    >
                        &larr; Back to orders
                    </button>
                    <h2 className="mb-6 text-base font-bold text-gray-900">
                        What issue are you facing with this order?
                    </h2>
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white shadow-sm">
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
                <div>
                    <h2 className="mb-4 text-[15px] font-bold text-gray-900">
                        Browse Topics
                    </h2>
                    <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                        {CATEGORY_META.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() =>
                                        handleCategorySelect(cat.key)
                                    }
                                    className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition hover:border-[#5B9BD5]"
                                >
                                    <div className="rounded-full bg-[#5B9BD5]/5 p-2.5 transition-colors group-hover:bg-[#5B9BD5]/10">
                                        <Icon
                                            className="size-5 text-gray-800"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <span className="text-left text-[13px] font-bold leading-tight text-gray-900">
                                        {cat.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
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
                <div>
                    {/* Horizontal topic switcher */}
                    <div className="scrollbar-hide mb-8 flex gap-1 overflow-x-auto border-b border-gray-200 pb-0">
                        {CATEGORY_META.map((cat) => {
                            const isCurrent = cat.key === selectedCategory;
                            const CatIcon = cat.icon;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() =>
                                        handleCategorySelect(cat.key)
                                    }
                                    className={`flex min-w-[100px] flex-col items-center justify-center border-b-2 px-3 pb-3 transition-colors ${isCurrent ? "border-[#5B9BD5]" : "border-transparent hover:border-gray-300"}`}
                                >
                                    <div
                                        className={`mb-2 rounded-full p-2 ${isCurrent ? "bg-[#5B9BD5]/10" : "bg-gray-50"}`}
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

                    <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="p-6 pb-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Icon
                                    className="size-5 text-gray-800"
                                    strokeWidth={1.5}
                                />
                                <h3 className="text-[15px] font-bold text-gray-900">
                                    {catMeta.label}
                                </h3>
                            </div>
                            <p className="text-[13px] leading-relaxed text-gray-500">
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
            <div>
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-[13px] text-gray-600">
                        Queries from{" "}
                        <strong className="font-bold text-gray-900">
                            {recentFilter === "30_days" && "Last 30 Days"}
                            {recentFilter === "six_months" && "Last 6 Months"}
                            {recentFilter === "all_time" && "All Time"}
                        </strong>
                    </p>
                    <select
                        value={recentFilter}
                        onChange={(e) => setRecentFilter(e.target.value as any)}
                        className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] font-bold text-gray-600 outline-none hover:border-gray-300 focus:border-[#5B9BD5]"
                    >
                        <option value="30_days">Last 30 Days</option>
                        <option value="six_months">Last 6 Months</option>
                        <option value="all_time">All Time</option>
                    </select>
                </div>

                {filteredTickets.length > 0 ? (
                    <div
                        className="max-h-[550px] space-y-4 overflow-y-auto pr-2"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        {filteredTickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/profile/help-center/${ticket.id}`}
                                className="group block rounded-md border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="mb-2 flex items-start justify-between">
                                    <h3 className="text-sm font-bold text-gray-900 transition group-hover:text-[#5B9BD5]">
                                        {ticket.title}
                                    </h3>
                                    <span className="rounded-sm bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        {ticket.status.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Query ID: {ticket.id}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Created:{" "}
                                    {format(
                                        new Date(ticket.createdAt),
                                        "dd MMM yyyy, hh:mm a"
                                    )}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="mb-6 h-24 w-24 rounded-full bg-blue-50"></div>
                        <h3 className="mb-2 text-base font-bold text-gray-900">
                            No queries found
                        </h3>
                        <p className="text-center text-[13px] leading-relaxed text-gray-500">
                            There were no queries raised
                            <br />
                            in{" "}
                            <strong>
                                {recentFilter === "30_days"
                                    ? "Last 30 Days"
                                    : recentFilter === "six_months"
                                      ? "Last 6 Months"
                                      : "All Time"}
                            </strong>
                        </p>
                        {recentFilter !== "all_time" && (
                            <button
                                onClick={() => setRecentFilter("all_time")}
                                className="mt-8 text-[13px] font-medium text-gray-500"
                            >
                                Search queries from{" "}
                                <strong className="cursor-pointer text-[#5B9BD5] hover:underline">
                                    Different dates
                                </strong>
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
        return (
            <div className="mx-auto max-w-2xl rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                <button
                    onClick={() => setSubStep("select_issue")}
                    className="mb-6 text-xs font-semibold text-[#5B9BD5] hover:underline"
                >
                    &larr; Back to issues
                </button>
                <h2 className="mb-6 text-lg font-bold text-gray-900">
                    Tell us more about your issue
                </h2>

                <div className="mb-6 rounded-md border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
                        Issue Type
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                        {selectedIssue?.label}
                    </p>
                </div>

                <div className="mb-6">
                    <label className="mb-2 block text-[13px] font-bold text-gray-900">
                        Description{" "}
                        <span className="text-xs font-normal text-gray-400">
                            (optional)
                        </span>
                    </label>
                    <textarea
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder="Please provide any extra details so we can assist you faster."
                        rows={5}
                        className="w-full resize-none rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-[#5B9BD5] focus:outline-none focus:ring-1 focus:ring-[#5B9BD5]"
                    />
                </div>

                <Button
                    onClick={handleSubmitTicket}
                    disabled={createTicketMutation.isPending}
                    className="w-full rounded-sm bg-[#5B9BD5] py-6 font-bold tracking-wide text-white hover:bg-[#4A8BC5]"
                >
                    {createTicketMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />{" "}
                            SUBMITTING...
                        </>
                    ) : (
                        "SUBMIT TICKET"
                    )}
                </Button>
            </div>
        );
    };

    // ── Main Render Structure ──────────────────────────────────────────
    return (
        <div className="mx-auto mb-10 w-full max-w-6xl overflow-hidden rounded-sm border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-gray-100 bg-white p-6 shadow-sm md:px-8">
                <div>
                    <h1 className="text-xl font-extrabold uppercase leading-none tracking-wide text-gray-900 md:text-2xl">
                        HELP CENTER
                    </h1>
                    <p className="mt-1 text-xs text-gray-500 md:text-sm">
                        We are here to help you
                    </p>
                </div>
                <div className="hidden items-center gap-6 md:flex">
                    <div className="flex items-center gap-4 border-r border-gray-200 pr-6">
                        <ShoppingBag
                            className="size-8 font-light text-gray-400"
                            strokeWidth={1}
                        />
                        <div className="flex flex-col justify-center">
                            <p className="text-[11px] font-bold tracking-wider text-gray-800">
                                TRACK, CANCEL, RETURN/EXCHANGE
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Manage your purchases
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/profile/orders"
                        className="rounded-sm border border-[#5B9BD5] px-8 py-2.5 text-[11px] font-bold tracking-widest text-[#5B9BD5] transition hover:bg-[#5B9BD5]/5 hover:shadow-sm"
                    >
                        ORDERS
                    </Link>
                </div>
            </div>

            <div className="flex min-h-[600px] flex-col items-stretch md:flex-row">
                {/* Left Sidebar Menu */}
                <div className="flex w-full shrink-0 flex-col items-stretch border-r border-gray-100 bg-white pt-8 md:w-[280px]">
                    <div className="mb-4 px-8">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                            SELECT QUERY TYPE
                        </p>
                    </div>
                    <nav className="flex flex-col">
                        <SidebarItem
                            tab="order"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("order")}
                            label="Order Related Queries"
                        />
                        <SidebarItem
                            tab="non_order"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("non_order")}
                            label="Non-order Related Issues"
                        />
                        <SidebarItem
                            tab="recent"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("recent")}
                            label="Recent Issues"
                        />

                        <div className="mx-8 my-5 border-t border-gray-100" />

                        <SidebarItem
                            tab="faq"
                            current={sidebarTab}
                            onClick={() => changeSidebarTab("faq")}
                            label="Frequently Asked Questions"
                        />
                    </nav>
                    <div className="mt-auto border-t border-gray-50 bg-gray-50/30 px-8 py-8 md:pb-12">
                        <p className="text-[11px] font-bold leading-relaxed tracking-wide text-gray-500">
                            Want to reach us old style? Here is our <br />
                            <a
                                href="#"
                                className="text-[#5B9BD5] hover:underline"
                            >
                                postal address
                            </a>
                        </p>
                    </div>
                </div>

                {/* Right Main Content */}
                <div className="relative flex-1 bg-[#f4f4f5]/60 p-6 md:p-8">
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

function SidebarItem({
    tab,
    current,
    onClick,
    label,
}: {
    tab: string;
    current: string;
    onClick: () => void;
    label: string;
}) {
    const isActive = tab === current;
    return (
        <button
            onClick={onClick}
            className={`group flex items-center justify-between border-l-4 px-8 py-4 text-[13px] font-bold tracking-wide transition-colors ${isActive ? "border-[#5B9BD5] bg-[#5B9BD5]/5 text-[#5B9BD5] hover:bg-[#5B9BD5]/10" : "border-transparent text-gray-600 hover:bg-gray-50"}`}
        >
            {label}{" "}
            <ChevronRight
                className={`size-4 ${isActive ? "text-[#5B9BD5]" : "text-gray-300 group-hover:text-gray-500"}`}
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
        <div className="bg-white">
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between px-6 py-5 transition hover:bg-gray-50/50"
            >
                <span className="text-left text-[13px] font-bold text-gray-900">
                    {issue.label}
                </span>
                <ChevronDown
                    className={`size-4 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                />
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

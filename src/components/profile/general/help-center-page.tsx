"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    CreditCard,
    HelpCircle,
    Loader2,
    MessageCircle,
    Package,
    RefreshCw,
    Send,
    ShoppingBag,
    Truck,
    User,
    XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────
type Step =
    | "home"
    | "select_order"
    | "select_category"
    | "select_issue"
    | "create_ticket"
    | "my_tickets";

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
    color: string;
}[] = [
    {
        key: "payment",
        label: "Payment Issues",
        description: "Failed payments, refunds, charges",
        icon: CreditCard,
        color: "bg-violet-50 text-violet-600 border-violet-200",
    },
    {
        key: "account",
        label: "Account Issues",
        description: "Login, profile, settings",
        icon: User,
        color: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
        key: "product",
        label: "Product Inquiry",
        description: "Size, availability, details",
        icon: ShoppingBag,
        color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
        key: "shipping",
        label: "Shipping Query",
        description: "Delivery, tracking, address",
        icon: Truck,
        color: "bg-green-50 text-green-600 border-green-200",
    },
    {
        key: "other",
        label: "Other",
        description: "Anything else",
        icon: HelpCircle,
        color: "bg-gray-50 text-gray-600 border-gray-200",
    },
];

// ── Main Component ───────────────────────────────────────────────────
interface PageProps {
    initialOrders: OrderWithItemAndBrand[];
    user: CachedUser;
}

export function HelpCenterPage({ initialOrders, user }: PageProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("home");
    const [selectedOrder, setSelectedOrder] =
        useState<OrderWithItemAndBrand | null>(null);
    const [selectedCategory, setSelectedCategory] =
        useState<SupportCategory | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<IssueOption | null>(
        null
    );
    const [showFaq, setShowFaq] = useState<string | null>(null);
    const [ticketDescription, setTicketDescription] = useState("");

    // Tickets query
    const { data: myTickets, refetch: refetchTickets } =
        trpc.general.userSupport.listMyTickets.useQuery(
            { limit: 50, page: 1 },
            { enabled: true }
        );

    // Orders
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

    // Reset flow
    const resetFlow = () => {
        setStep("home");
        setSelectedOrder(null);
        setSelectedCategory(null);
        setSelectedIssue(null);
        setShowFaq(null);
        setTicketDescription("");
    };

    // Go back
    const goBack = () => {
        if (step === "select_order") {
            resetFlow();
            return;
        }
        if (step === "select_category") {
            resetFlow();
            return;
        }
        if (step === "select_issue") {
            if (selectedOrder) setStep("select_order");
            else setStep("select_category");
            setSelectedIssue(null);
            setShowFaq(null);
            return;
        }
        if (step === "create_ticket") {
            setStep("select_issue");
            return;
        }
        if (step === "my_tickets") {
            resetFlow();
            return;
        }
    };

    // Handle order selection
    const handleOrderSelect = (order: OrderWithItemAndBrand) => {
        setSelectedOrder(order);
        setSelectedCategory("order");
        setStep("select_issue");
    };

    // Handle category selection
    const handleCategorySelect = (cat: SupportCategory) => {
        setSelectedCategory(cat);
        setStep("select_issue");
    };

    // Handle issue selection
    const handleIssueSelect = (issue: IssueOption) => {
        setSelectedIssue(issue);
        if (issue.faq) {
            setShowFaq(issue.key);
        } else {
            setStep("create_ticket");
        }
    };

    // Submit ticket
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

    // Get order image
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

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="min-w-0 flex-1">
            {/* Header with breadcrumb */}
            <div className="mb-6">
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    {step !== "home" && (
                        <button
                            onClick={goBack}
                            className="flex items-center gap-1 text-blue-600 transition-colors hover:text-blue-700"
                        >
                            <ArrowLeft className="size-4" />
                            Back
                        </button>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    {step === "home" && "Help Center"}
                    {step === "select_order" && "Select an Order"}
                    {step === "select_category" && "Select a Category"}
                    {step === "select_issue" && "What's your issue?"}
                    {step === "create_ticket" && "Describe your issue"}
                    {step === "my_tickets" && "My Support Tickets"}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    {step === "home" && "How can we help you today?"}
                    {step === "select_order" &&
                        "Choose the order you need help with"}
                    {step === "select_category" &&
                        "Pick the category that best describes your concern"}
                    {step === "select_issue" &&
                        "Select the issue you're facing"}
                    {step === "create_ticket" &&
                        "Tell us more so we can help you better"}
                    {step === "my_tickets" &&
                        "View and track your support requests"}
                </p>
            </div>

            {/* ── STEP: Home ────────────────────────────────────────── */}
            {step === "home" && (
                <div className="space-y-6">
                    {/* Main action cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Order Related */}
                        <button
                            onClick={() => setStep("select_order")}
                            className="group relative flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                        >
                            <div className="rounded-xl bg-blue-50 p-3">
                                <Package className="size-7 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Order Related
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Track orders, returns, refunds,
                                    cancellations
                                </p>
                            </div>
                            <ArrowRight className="absolute right-5 top-1/2 size-5 -translate-y-1/2 text-gray-300 transition-colors group-hover:text-blue-500" />
                        </button>

                        {/* Non-Order */}
                        <button
                            onClick={() => setStep("select_category")}
                            className="group relative flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                        >
                            <div className="rounded-xl bg-emerald-50 p-3">
                                <HelpCircle className="size-7 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Non-Order Issue
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Account, payments, products, general queries
                                </p>
                            </div>
                            <ArrowRight className="absolute right-5 top-1/2 size-5 -translate-y-1/2 text-gray-300 transition-colors group-hover:text-emerald-500" />
                        </button>
                    </div>

                    {/* My Tickets */}
                    {myTickets && myTickets.length > 0 && (
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Recent Tickets
                                </h2>
                                <button
                                    onClick={() => setStep("my_tickets")}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    View all →
                                </button>
                            </div>
                            <div className="space-y-3">
                                {myTickets.slice(0, 3).map((ticket) => (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Help */}
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-3">
                            {[
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
                            ].map(({ q, a }, i) => (
                                <FaqItem key={i} question={q} answer={a} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP: Select Order ────────────────────────────────── */}
            {step === "select_order" && (
                <div className="space-y-4">
                    {orders && orders.length > 0 ? (
                        orders.slice(0, 10).map((order) => {
                            const img = getOrderImage(order);
                            const statusColor =
                                order.status === "delivered"
                                    ? "text-green-600 bg-green-50"
                                    : order.status === "cancelled"
                                      ? "text-red-600 bg-red-50"
                                      : order.status === "shipped"
                                        ? "text-blue-600 bg-blue-50"
                                        : "text-amber-600 bg-amber-50";

                            return (
                                <button
                                    key={order.id}
                                    onClick={() => handleOrderSelect(order)}
                                    className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                                >
                                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                        <Image
                                            src={img.url}
                                            alt={img.alt}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-gray-900">
                                                {order.items[0]?.product
                                                    ?.title ?? "Order"}
                                            </p>
                                            {order.items.length > 1 && (
                                                <span className="shrink-0 text-xs text-gray-400">
                                                    +{order.items.length - 1}{" "}
                                                    more
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                            <span>
                                                Order #{order.id.slice(0, 8)}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {format(
                                                    new Date(order.createdAt),
                                                    "dd MMM yyyy"
                                                )}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {formatPriceTag(
                                                    parseFloat(
                                                        convertPaiseToRupees(
                                                            Number(
                                                                order.totalAmount
                                                            )
                                                        )
                                                    ),
                                                    true
                                                )}
                                            </span>
                                        </div>
                                        <div className="mt-1.5">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                                    statusColor
                                                )}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
                                </button>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-12">
                            <Package className="size-10 text-gray-400" />
                            <p className="text-sm text-gray-500">
                                No orders found
                            </p>
                            <Link
                                href="/shop"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Start shopping →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* ── STEP: Select Category ─────────────────────────────── */}
            {step === "select_category" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {CATEGORY_META.map(
                        ({ key, label, description, icon: Icon, color }) => (
                            <button
                                key={key}
                                onClick={() => handleCategorySelect(key)}
                                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                            >
                                <div
                                    className={cn(
                                        "flex size-12 shrink-0 items-center justify-center rounded-xl border",
                                        color
                                    )}
                                >
                                    <Icon className="size-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {label}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {description}
                                    </p>
                                </div>
                                <ChevronRight className="size-5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
                            </button>
                        )
                    )}
                </div>
            )}

            {/* ── STEP: Select Issue ────────────────────────────────── */}
            {step === "select_issue" && selectedCategory && (
                <div className="space-y-4">
                    {/* Show order context if order-related */}
                    {selectedOrder && (
                        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                    src={getOrderImage(selectedOrder).url}
                                    alt={getOrderImage(selectedOrder).alt}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {selectedOrder.items[0]?.product?.title ??
                                        "Order"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Order #{selectedOrder.id.slice(0, 8)} •{" "}
                                    {format(
                                        new Date(selectedOrder.createdAt),
                                        "dd MMM yyyy"
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Issue options */}
                    <div className="space-y-2">
                        {CATEGORY_ISSUES[selectedCategory].map((issue) => (
                            <div key={issue.key}>
                                <button
                                    onClick={() => handleIssueSelect(issue)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md",
                                        showFaq === issue.key
                                            ? "border-blue-300 shadow-md"
                                            : "border-gray-200"
                                    )}
                                >
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {issue.label}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {issue.description}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        className={cn(
                                            "size-5 shrink-0 transition-transform",
                                            showFaq === issue.key
                                                ? "rotate-90 text-blue-500"
                                                : "text-gray-300"
                                        )}
                                    />
                                </button>

                                {/* FAQ quick answer */}
                                {showFaq === issue.key && issue.faq && (
                                    <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                                        <p className="text-sm leading-relaxed text-gray-700">
                                            {issue.faq}
                                        </p>
                                        <div className="mt-4 flex items-center gap-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={resetFlow}
                                                className="text-xs"
                                            >
                                                This solved my issue
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedIssue(issue);
                                                    setStep("create_ticket");
                                                }}
                                                className="text-xs"
                                            >
                                                Still need help
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── STEP: Create Ticket ───────────────────────────────── */}
            {step === "create_ticket" && selectedCategory && selectedIssue && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                            Issue Summary
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-20 text-xs text-gray-400">
                                    Category
                                </span>
                                <span className="text-sm font-medium capitalize text-gray-900">
                                    {selectedCategory}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-20 text-xs text-gray-400">
                                    Issue
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                    {selectedIssue.label}
                                </span>
                            </div>
                            {selectedOrder && (
                                <div className="flex items-center gap-2">
                                    <span className="w-20 text-xs text-gray-400">
                                        Order
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        #{selectedOrder.id.slice(0, 8)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                            Describe your issue{" "}
                            <span className="font-normal text-gray-400">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            value={ticketDescription}
                            onChange={(e) =>
                                setTicketDescription(e.target.value)
                            }
                            placeholder="Tell us more about your issue so we can help you better..."
                            rows={4}
                            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={goBack}
                            className="flex-1 sm:flex-initial"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSubmitTicket}
                            disabled={createTicketMutation.isPending}
                            className="flex-1 sm:flex-initial"
                        >
                            {createTicketMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 size-4" />
                                    Submit Ticket
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STEP: My Tickets ──────────────────────────────────── */}
            {step === "my_tickets" && (
                <div className="space-y-3">
                    {myTickets && myTickets.length > 0 ? (
                        myTickets.map((ticket) => (
                            <TicketCard key={ticket.id} ticket={ticket} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 py-12">
                            <MessageCircle className="size-10 text-gray-400" />
                            <p className="text-sm text-gray-500">
                                No support tickets yet
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Ticket Card ──────────────────────────────────────────────────────
function TicketCard({
    ticket,
}: {
    ticket: {
        id: string;
        title: string;
        status: string;
        category: string;
        issueType: string;
        createdAt: Date;
        orderId: string | null;
    };
}) {
    const statusConfig: Record<
        string,
        { color: string; icon: React.ElementType }
    > = {
        open: {
            color: "bg-amber-50 text-amber-700 border-amber-200",
            icon: AlertCircle,
        },
        in_progress: {
            color: "bg-blue-50 text-blue-700 border-blue-200",
            icon: RefreshCw,
        },
        resolved: {
            color: "bg-green-50 text-green-700 border-green-200",
            icon: XCircle,
        },
    };

    const config = statusConfig[ticket.status] ?? statusConfig.open;
    const StatusIcon = config.icon;

    return (
        <Link
            href={`/profile/help-center/${ticket.id}`}
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-900">
                        {ticket.title}
                    </h3>
                    <span
                        className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            config.color
                        )}
                    >
                        <StatusIcon className="size-3" />
                        {ticket.status.replace("_", " ")}
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize">{ticket.category}</span>
                    <span>•</span>
                    <span>
                        {format(
                            new Date(ticket.createdAt),
                            "dd MMM yyyy, hh:mm a"
                        )}
                    </span>
                    {ticket.orderId && (
                        <>
                            <span>•</span>
                            <span>Order #{ticket.orderId.slice(0, 8)}</span>
                        </>
                    )}
                </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
        </Link>
    );
}

// ── FAQ Item ─────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <span className="text-sm font-medium text-gray-900">
                    {question}
                </span>
                <ChevronRight
                    className={cn(
                        "size-4 shrink-0 text-gray-400 transition-transform",
                        open && "rotate-90"
                    )}
                />
            </button>
            {open && (
                <div className="border-t border-gray-100 px-4 py-3">
                    <p className="text-sm leading-relaxed text-gray-600">
                        {answer}
                    </p>
                </div>
            )}
        </div>
    );
}

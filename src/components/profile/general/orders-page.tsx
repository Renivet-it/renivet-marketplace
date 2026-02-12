"use client";

import { UnavailableOrdersModal } from "@/components/globals/modals";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import { Checkbox } from "@/components/ui/checkbox";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-general";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { differenceInDays, differenceInMonths, format } from "date-fns";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Droplets,
    Eye,
    Heart,
    Leaf,
    MoreHorizontal,
    Package,
    RefreshCw,
    RotateCcw,
    Shirt,
    ShoppingBag,
    Star,
    Truck,
    XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ReplaceModal } from "./replace-modal";
import { ReturnModal } from "./return-modal";

// ── Types ────────────────────────────────────────────────────────────
type Tab = "on_the_way" | "delivered";
type StatusFilter = "in_transit" | "processing" | "delivered" | "cancelled";
type DeliveredSubFilter = "all" | "needs_review" | "most_worn";

const ORDERS_PER_PAGE_ON_THE_WAY = 5;
const ORDERS_PER_PAGE_DELIVERED = 4;

interface PageProps extends GenericProps {
    initialData: OrderWithItemAndBrand[];
    user: CachedUser;
}

// ── Helpers ──────────────────────────────────────────────────────────
function getOrderDisplayStatus(order: OrderWithItemAndBrand): StatusFilter {
    if (order.status === "cancelled") return "cancelled";
    if (order.status === "delivered") return "delivered";
    if (order.status === "shipped") return "in_transit";
    return "processing";
}

function statusLabel(s: StatusFilter) {
    switch (s) {
        case "in_transit":
            return "In Transit";
        case "processing":
            return "Processing";
        case "delivered":
            return "Delivered";
        case "cancelled":
            return "Cancelled";
    }
}

function statusColor(s: StatusFilter) {
    switch (s) {
        case "in_transit":
            return "bg-blue-50 text-blue-600 border-blue-200";
        case "processing":
            return "bg-amber-50 text-amber-600 border-amber-200";
        case "delivered":
            return "bg-green-50 text-green-600 border-green-200";
        case "cancelled":
            return "bg-red-50 text-red-600 border-red-200";
    }
}

/** Estimate wear count from months since delivery */
function estimateWearCount(deliveredAt: Date | null): number {
    if (!deliveredAt) return 0;
    const months = differenceInMonths(new Date(), deliveredAt);
    // Assume ~5-6 wears per month for clothing
    return Math.max(0, Math.round(months * 5.5 + Math.random() * 3));
}

/** CO₂ saved estimate (roughly 0.03kg per wear for sustainable clothing) */
function estimateCO2Saved(wearCount: number): number {
    return Math.round(wearCount * 0.035 * 10) / 10;
}

// ── Main Component ───────────────────────────────────────────────────
export function OrdersPage({
    className,
    initialData,
    user,
    ...props
}: PageProps) {
    const [activeTab, setActiveTab] = useState<Tab>("on_the_way");
    const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
    const [deliveredSubFilter, setDeliveredSubFilter] =
        useState<DeliveredSubFilter>("all");
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page on tab or filter change
    const handleTabChange = useCallback((tab: Tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
    }, []);
    const handleDeliveredSubFilterChange = useCallback(
        (filter: DeliveredSubFilter) => {
            setDeliveredSubFilter(filter);
            setCurrentPage(1);
        },
        []
    );

    const { data: orders } = trpc.general.orders.getOrdersByUserId.useQuery(
        { userId: user.id },
        { initialData }
    );

    // ── Derived data ─────────────────────────────────────────────────
    const availableOrders = useMemo(
        () =>
            orders.filter((order) =>
                order.status === "pending"
                    ? order.items.filter(
                          (item) =>
                              item.product.verificationStatus === "approved" &&
                              !item.product.isDeleted &&
                              item.product.isAvailable &&
                              (!!item.product.quantity
                                  ? item.product.quantity > 0
                                  : true) &&
                              (!item.variant ||
                                  (item.variant &&
                                      !item.variant.isDeleted &&
                                      item.variant.quantity > 0))
                      ).length > 0
                    : true
            ),
        [orders]
    );

    const unavailableOrders = useMemo(
        () =>
            orders.filter((order) =>
                order.status === "pending"
                    ? order.items.filter(
                          (item) =>
                              item.product.verificationStatus !== "approved" &&
                              item.product.isDeleted &&
                              !item.product.isAvailable &&
                              (!!item.product.quantity
                                  ? item.product.quantity === 0
                                  : true) &&
                              (!item.variant ||
                                  (item.variant &&
                                      item.variant.isDeleted &&
                                      item.variant.quantity === 0))
                      ).length > 0
                    : false
            ),
        [orders]
    );

    // Tab groups
    const onTheWayOrders = useMemo(
        () =>
            availableOrders.filter((o) =>
                ["pending", "processing", "shipped"].includes(o.status)
            ),
        [availableOrders]
    );
    const deliveredOrders = useMemo(
        () => availableOrders.filter((o) => o.status === "delivered"),
        [availableOrders]
    );

    // On The Way filtered
    const filteredOnTheWay = useMemo(() => {
        if (statusFilters.length === 0) return onTheWayOrders;
        return onTheWayOrders.filter((o) =>
            statusFilters.includes(getOrderDisplayStatus(o))
        );
    }, [onTheWayOrders, statusFilters]);

    // Delivered filtered with sub-filter
    const filteredDelivered = useMemo(() => {
        let filtered = deliveredOrders;
        if (deliveredSubFilter === "needs_review") {
            // Show orders that haven't been "reviewed" — for now, all delivered orders
            filtered = deliveredOrders;
        } else if (deliveredSubFilter === "most_worn") {
            // Sort by delivery age (older = more worn)
            filtered = [...deliveredOrders].sort((a, b) => {
                const aDate = a.shipments?.[0]?.updatedAt
                    ? new Date(a.shipments[0].updatedAt).getTime()
                    : new Date(a.createdAt).getTime();
                const bDate = b.shipments?.[0]?.updatedAt
                    ? new Date(b.shipments[0].updatedAt).getTime()
                    : new Date(b.createdAt).getTime();
                return aDate - bDate; // oldest first = most worn
            });
        }
        return filtered;
    }, [deliveredOrders, deliveredSubFilter]);

    const filteredOrders =
        activeTab === "on_the_way" ? filteredOnTheWay : filteredDelivered;

    // Pagination
    const perPage =
        activeTab === "delivered"
            ? ORDERS_PER_PAGE_DELIVERED
            : ORDERS_PER_PAGE_ON_THE_WAY;
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredOrders.slice(start, start + perPage);
    }, [filteredOrders, currentPage, perPage]);

    // Stats
    const stats = useMemo(() => {
        const total = availableOrders.length;
        const inTransit = availableOrders.filter(
            (o) => o.status === "shipped"
        ).length;
        const delivered = deliveredOrders.length;
        const totalSpent = availableOrders.reduce(
            (sum, o) => sum + Number(o.totalAmount),
            0
        );
        // Delivered impact stats
        const totalWears = deliveredOrders.reduce((sum, o) => {
            const dAt = o.shipments?.[0]?.updatedAt
                ? new Date(o.shipments[0].updatedAt)
                : null;
            return sum + estimateWearCount(dAt);
        }, 0);
        const totalCO2 = deliveredOrders.reduce((sum, o) => {
            const dAt = o.shipments?.[0]?.updatedAt
                ? new Date(o.shipments[0].updatedAt)
                : null;
            return sum + estimateCO2Saved(estimateWearCount(dAt));
        }, 0);
        const cancelled = availableOrders.filter(
            (o) => o.status === "cancelled"
        ).length;
        return {
            total,
            inTransit,
            delivered,
            totalSpent,
            totalWears,
            totalCO2: Math.round(totalCO2 * 10) / 10,
            cancelled,
        };
    }, [availableOrders, deliveredOrders]);

    const toggleFilter = (filter: StatusFilter) => {
        setStatusFilters((prev) =>
            prev.includes(filter)
                ? prev.filter((f) => f !== filter)
                : [...prev, filter]
        );
        setCurrentPage(1);
    };

    return (
        <>
            <div className={cn("min-w-0 flex-1", className)} {...props}>
                {/* ── Header ──────────────────────────────── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                        {activeTab === "delivered"
                            ? "Delivered Orders"
                            : "My Orders"}
                    </h1>
                    <p className="mt-1 hidden text-sm text-gray-500 md:block">
                        {activeTab === "delivered"
                            ? "Track your conscious wardrobe journey"
                            : "Track and manage your sustainable purchases"}
                    </p>
                </div>

                {/* ── Layout: Content + Sidebar ───────────── */}
                <div className="flex gap-6">
                    {/* ── Left / Main Content ─────────────── */}
                    <div className="min-w-0 flex-1">
                        {/* ── Tabs ────────────────────────── */}
                        <div className="mb-5 flex gap-3">
                            <button
                                onClick={() => handleTabChange("on_the_way")}
                                className={cn(
                                    "rounded-full px-5 py-2 text-sm font-medium transition-all",
                                    activeTab === "on_the_way"
                                        ? "bg-[#5B9BD5] text-white shadow-sm"
                                        : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                On The Way
                                <span className="ml-1">
                                    ({onTheWayOrders.length})
                                </span>
                            </button>
                            <button
                                onClick={() => handleTabChange("delivered")}
                                className={cn(
                                    "rounded-full px-5 py-2 text-sm font-medium transition-all",
                                    activeTab === "delivered"
                                        ? "bg-[#5B9BD5] text-white shadow-sm"
                                        : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                Delivered
                                <span className="ml-1">
                                    ({deliveredOrders.length})
                                </span>
                            </button>
                        </div>

                        {/* ── Delivered Sub-filters ───────── */}
                        {activeTab === "delivered" && (
                            <div className="mb-5 flex items-center gap-2 text-sm">
                                <span className="hidden text-gray-500 md:inline">
                                    Filter:
                                </span>
                                {(
                                    [
                                        { key: "all" as const, label: "All" },
                                        {
                                            key: "needs_review" as const,
                                            label: "Needs Review",
                                            count: deliveredOrders.length,
                                        },
                                        {
                                            key: "most_worn" as const,
                                            label: "Most Worn",
                                        },
                                    ] as const
                                ).map(({ key, label, count }) => (
                                    <button
                                        key={key}
                                        onClick={() =>
                                            handleDeliveredSubFilterChange(key)
                                        }
                                        className={cn(
                                            "rounded-full px-3 py-1 text-xs font-medium transition-all",
                                            deliveredSubFilter === key
                                                ? "bg-[#5B9BD5] text-white"
                                                : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {label}
                                        {count !== undefined && (
                                            <span
                                                className={cn(
                                                    "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded text-[10px]",
                                                    deliveredSubFilter === key
                                                        ? "bg-white/30 text-white"
                                                        : "bg-gray-200 text-gray-600"
                                                )}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Unavailable warning ─────────── */}
                        {activeTab === "on_the_way" &&
                            unavailableOrders.length > 0 && (
                                <Notice className="mb-4">
                                    <NoticeContent>
                                        <NoticeTitle>
                                            <NoticeIcon />
                                            <span>Warning</span>
                                        </NoticeTitle>
                                        <p className="text-sm">
                                            {unavailableOrders.length} order(s)
                                            contain item(s) that are no longer
                                            available.
                                        </p>
                                    </NoticeContent>
                                    <NoticeButton asChild>
                                        <Button
                                            size="sm"
                                            className="text-xs"
                                            onClick={() =>
                                                setIsOrderModalOpen(true)
                                            }
                                        >
                                            Show Order(s)
                                        </Button>
                                    </NoticeButton>
                                </Notice>
                            )}

                        {/* ── Order cards ─────────────────── */}
                        {filteredOrders.length === 0 ? (
                            <NoOrdersCard
                                isDelivered={activeTab === "delivered"}
                            />
                        ) : activeTab === "delivered" ? (
                            /* ── Delivered: grid of detailed cards ── */
                            <div className="grid gap-5 md:grid-cols-2">
                                {paginatedOrders.map((order) => (
                                    <DeliveredOrderCard
                                        key={order.id}
                                        order={order}
                                        user={user}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* ── On The Way: compact cards ── */
                            <div className="space-y-4">
                                {paginatedOrders.map((order) => (
                                    <OnTheWayOrderCard
                                        key={order.id}
                                        order={order}
                                        user={user}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ── Pagination ────────────────────── */}
                        {totalPages > 1 && (
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredOrders.length}
                                perPage={perPage}
                            />
                        )}
                    </div>

                    {/* ── Right Sidebar (desktop) ─────────── */}
                    <div className="hidden w-[260px] shrink-0 space-y-5 lg:block">
                        {activeTab === "on_the_way" ? (
                            /* ── On The Way sidebar ── */
                            <>
                                {/* Filter Panel */}
                                <div className="rounded-xl border border-gray-200 bg-white p-5">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-800">
                                        Filter Orders
                                    </h3>
                                    <div className="space-y-3">
                                        {(
                                            [
                                                "in_transit",
                                                "processing",
                                                "delivered",
                                                "cancelled",
                                            ] as StatusFilter[]
                                        ).map((filter) => (
                                            <label
                                                key={filter}
                                                className="flex cursor-pointer items-center gap-2.5"
                                            >
                                                <Checkbox
                                                    checked={statusFilters.includes(
                                                        filter
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(filter)
                                                    }
                                                    className="data-[state=checked]:border-[#5B9BD5] data-[state=checked]:bg-[#5B9BD5]"
                                                />
                                                <span className="text-sm text-gray-600">
                                                    {statusLabel(filter)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Panel */}
                                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-5">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-800">
                                        Your Orders
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {stats.total}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Total Orders
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {stats.inTransit}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                In Transit
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {stats.delivered}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Delivered
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {formatPriceTag(
                                                    parseFloat(
                                                        convertPaiseToRupees(
                                                            stats.totalSpent
                                                        )
                                                    ),
                                                    true
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Total Spent
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* ── Delivered sidebar ── */
                            <>
                                {/* Delivered Stats Panel */}
                                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            Your Delivered Orders
                                        </h3>
                                        <span className="rounded-full border border-[#5B9BD5] px-2.5 py-0.5 text-xs font-medium text-[#5B9BD5]">
                                            {new Date().getFullYear()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {stats.delivered}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                orders
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {stats.inTransit}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                in transit
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {stats.totalWears}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                wears
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#5B9BD5]">
                                                {formatPriceTag(
                                                    parseFloat(
                                                        convertPaiseToRupees(
                                                            stats.totalSpent
                                                        )
                                                    ),
                                                    true
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                total spent
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Impact Panel */}
                                <div className="rounded-xl border border-gray-200 bg-white p-5">
                                    <h3 className="mb-4 text-sm font-semibold text-gray-800">
                                        Your Delivered Impact
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2.5">
                                            <Leaf className="h-4 w-4 text-green-500" />
                                            <span className="text-sm text-gray-600">
                                                {stats.totalCO2}kg CO₂ saved
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <Droplets className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm text-gray-600">
                                                {Math.round(
                                                    stats.totalWears * 2.5
                                                )}
                                                L water conserved
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <Heart className="h-4 w-4 text-red-400" />
                                            <span className="text-sm text-gray-600">
                                                {stats.delivered} artisans
                                                supported
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <Shirt className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm text-gray-600">
                                                {Math.ceil(
                                                    stats.delivered * 0.6
                                                )}{" "}
                                                wardrobe champions
                                            </span>
                                        </div>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="mt-3 block text-xs font-medium text-[#5B9BD5] hover:underline"
                                    >
                                        View full impact dashboard →
                                    </Link>
                                </div>

                                {/* Filter by Date */}
                                <div className="rounded-xl border border-gray-200 bg-white p-5">
                                    <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                        Filter Orders
                                    </h3>
                                    <label className="text-xs text-gray-500">
                                        Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#5B9BD5] focus:outline-none focus:ring-1 focus:ring-[#5B9BD5]"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <UnavailableOrdersModal
                isOpen={isOrderModalOpen}
                setIsOpen={setIsOrderModalOpen}
                unavailableOrders={unavailableOrders}
                selectedYear={new Date().getFullYear()}
                userId={user.id}
            />
        </>
    );
}

// ── No Orders Card ───────────────────────────────────────────────────
function NoOrdersCard({ isDelivered }: { isDelivered?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-10">
            <EmptyPlaceholder
                isBackgroundVisible={false}
                className="w-full max-w-full border-none"
            >
                <EmptyPlaceholderIcon>
                    <Package className="size-10 text-gray-400" />
                </EmptyPlaceholderIcon>
                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>
                        {isDelivered
                            ? "No delivered orders yet"
                            : "No orders found"}
                    </EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        Continue shopping and keep adding products to your cart.
                    </EmptyPlaceholderDescription>
                </EmptyPlaceholderContent>
                <Button asChild>
                    <Link href="/shop">Continue Shopping</Link>
                </Button>
            </EmptyPlaceholder>
        </div>
    );
}

// ── Shared helpers for cards ─────────────────────────────────────────
function getOrderImage(order: OrderWithItemAndBrand) {
    const firstItem = order.items[0];
    const itemMedia = firstItem?.product?.media?.[0]?.mediaItem ?? null;
    return {
        url:
            itemMedia?.url ??
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1",
        alt: itemMedia?.alt ?? firstItem?.product?.title ?? "Product",
    };
}

function getProductDisplayName(order: OrderWithItemAndBrand): string {
    const firstItem = order.items[0];
    if (!firstItem) return "Unknown product";
    const variant = firstItem.variant;
    const variantName = variant
        ? firstItem.product.options
              .map((opt) => {
                  const combo = firstItem.product.variants.find(
                      (v) => v.id === firstItem.variantId
                  )?.combinations[opt.id];
                  const val = opt.values.find((v) => v.id === combo);
                  return val?.name;
              })
              .filter(Boolean)
              .join(" - ")
        : null;
    const title = firstItem.product.title;
    return variantName ? `${variantName} - ${title}` : title;
}

// ═══════════════════════════════════════════════════════════════════════
// ── ON THE WAY ORDER CARD ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
function OnTheWayOrderCard({
    order,
    user,
}: {
    order: OrderWithItemAndBrand;
    user: CachedUser;
}) {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [returnItem, setReturnItem] = useState<any>(null);
    const [replaceItem, setReplaceItem] = useState<any>(null);

    const { refetch } = trpc.general.orders.getOrdersByUserId.useQuery({
        userId: order.userId,
    });

    const { mutate: cancelOrder, isPending: isCancelling } =
        trpc.general.orders.cancelOrder.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Cancelling order...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                setIsCancelModalOpen(false);
                toast.success("Order cancelled successfully", { id: toastId });
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const deliveredAt =
        order.status === "delivered" && order.shipments?.[0]?.updatedAt
            ? new Date(order.shipments[0].updatedAt)
            : null;
    const daysPassed = deliveredAt
        ? differenceInDays(new Date(), deliveredAt)
        : null;
    const isWithinReturnWindow =
        order.status === "delivered" && daysPassed !== null && daysPassed <= 7;
    const isReturnOrReplaceInitiated =
        order.shipments?.[0]?.is_return_label_generated === true ||
        order.shipments?.[0]?.is_replacement_label_generated === true;
    const showReturnReplaceButtons =
        isWithinReturnWindow && !isReturnOrReplaceInitiated;

    const displayStatus = getOrderDisplayStatus(order);
    const { url: imageUrl, alt: imageAlt } = getOrderImage(order);
    const productDisplay = getProductDisplayName(order);
    const canCancel =
        order.status === "pending" || order.status === "processing";

    return (
        <>
            {/* ── Desktop Card ── */}
            <div className="hidden rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md md:block">
                <div className="flex items-center gap-4">
                    <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-gray-100">
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-medium text-gray-500">
                                #{order.receiptId}
                            </span>
                            <span>•</span>
                            <span>
                                {format(
                                    new Date(order.createdAt),
                                    "MMM dd, yyyy"
                                )}
                            </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-gray-800">
                            {productDisplay}
                            {order.items.length > 1 && (
                                <span className="ml-1 text-gray-400">
                                    +{order.items.length - 1} more
                                </span>
                            )}
                        </p>
                    </div>
                    <span
                        className={cn(
                            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                            statusColor(displayStatus)
                        )}
                    >
                        {statusLabel(displayStatus)}
                    </span>
                    <button
                        onClick={() => {
                            localStorage.setItem(
                                "trackingOrder",
                                JSON.stringify(order)
                            );
                            window.location.href = `/orders/${order.id}/tracking`;
                        }}
                        className="shrink-0 rounded-lg bg-[#5B9BD5] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4A8BC5]"
                    >
                        Track Order
                    </button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1">
                            <Link
                                href={`/orders/${order.id}`}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Eye className="h-4 w-4" /> View Details
                            </Link>
                            <button
                                onClick={() => {
                                    localStorage.setItem(
                                        "trackingOrder",
                                        JSON.stringify(order)
                                    );
                                    window.location.href = `/orders/${order.id}/tracking`;
                                }}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Truck className="h-4 w-4" /> Track Shipment
                            </button>
                            {canCancel && (
                                <button
                                    onClick={() => setIsCancelModalOpen(true)}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4" /> Cancel Order
                                </button>
                            )}
                            {showReturnReplaceButtons && (
                                <>
                                    <button
                                        onClick={() =>
                                            setReturnItem(order.items[0])
                                        }
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                                    >
                                        <RotateCcw className="h-4 w-4" /> Return
                                    </button>
                                    <button
                                        onClick={() =>
                                            setReplaceItem(order.items[0])
                                        }
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                    >
                                        <Package className="h-4 w-4" /> Replace
                                    </button>
                                </>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* ── Mobile Card ── */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 md:hidden">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-400">
                            #{order.receiptId}
                        </p>
                        <p className="text-xs text-gray-400">
                            {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </p>
                    </div>
                    <span
                        className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            statusColor(displayStatus)
                        )}
                    >
                        {statusLabel(displayStatus)}
                    </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                    <div className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-lg border border-gray-100">
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-gray-800">
                        {productDisplay}
                        {order.items.length > 1 && (
                            <span className="ml-1 text-gray-400">
                                +{order.items.length - 1} more
                            </span>
                        )}
                    </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <button
                        onClick={() => {
                            localStorage.setItem(
                                "trackingOrder",
                                JSON.stringify(order)
                            );
                            window.location.href = `/orders/${order.id}/tracking`;
                        }}
                        className="flex-1 rounded-lg bg-[#5B9BD5] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4A8BC5]"
                    >
                        Track Order
                    </button>
                    <Link
                        href={`/orders/${order.id}`}
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                        View Details
                    </Link>
                    {canCancel && (
                        <button
                            onClick={() => setIsCancelModalOpen(true)}
                            className="rounded-lg border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-50"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AlertDialog
                open={isCancelModalOpen}
                onOpenChange={setIsCancelModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to cancel this order?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cancelling this order will not be reversible. Refund
                            will be initiated if payment has been made.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() => setIsCancelModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() =>
                                cancelOrder({
                                    orderId: order.id,
                                    userId: order.userId,
                                })
                            }
                        >
                            Cancel Order
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {returnItem && (
                <ReturnModal
                    orderItem={returnItem}
                    isOpen={!!returnItem}
                    onClose={() => setReturnItem(null)}
                />
            )}
            {replaceItem && (
                <ReplaceModal
                    orderItem={replaceItem}
                    isOpen={!!replaceItem}
                    onClose={() => setReplaceItem(null)}
                />
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── DELIVERED ORDER CARD ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
function DeliveredOrderCard({
    order,
    user,
}: {
    order: OrderWithItemAndBrand;
    user: CachedUser;
}) {
    const [returnItem, setReturnItem] = useState<any>(null);
    const [replaceItem, setReplaceItem] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    const { url: imageUrl, alt: imageAlt } = getOrderImage(order);
    const productDisplay = getProductDisplayName(order);

    // Delivery data
    const deliveredAt = order.shipments?.[0]?.updatedAt
        ? new Date(order.shipments[0].updatedAt)
        : new Date(order.createdAt);
    const monthsInWardrobe = differenceInMonths(new Date(), deliveredAt);
    const wearCount = estimateWearCount(deliveredAt);
    const WEAR_TARGET = 30;
    const wearProgress = Math.min((wearCount / WEAR_TARGET) * 100, 100);
    const targetExceeded = wearCount >= WEAR_TARGET;

    // Price and sustainability
    const firstItem = order.items[0];
    const itemPrice = firstItem
        ? firstItem.variantId && firstItem.product.variants.length > 0
            ? (firstItem.product.variants.find(
                  (v) => v.id === firstItem.variantId
              )?.price ??
              firstItem.product.price ??
              0)
            : (firstItem.product.price ?? 0)
        : 0;
    const costPerWear =
        wearCount > 0
            ? parseFloat(convertPaiseToRupees(itemPrice)) / wearCount
            : parseFloat(convertPaiseToRupees(itemPrice));
    const co2Saved = estimateCO2Saved(wearCount);

    const daysPassed = differenceInDays(new Date(), deliveredAt);
    const isWithinReturnWindow = daysPassed <= 7;
    const isReturnOrReplaceInitiated =
        order.shipments?.[0]?.is_return_label_generated === true ||
        order.shipments?.[0]?.is_replacement_label_generated === true;
    const showReturnReplaceButtons =
        isWithinReturnWindow && !isReturnOrReplaceInitiated;

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
                {/* ── Header: Order ID + Status ── */}
                <div className="p-4 pb-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-400">
                                #{order.receiptId}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1">
                                <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                                    Delivered <Check className="h-3 w-3" />
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-400">
                                Delivered {format(deliveredAt, "MMM d, yyyy")}
                            </p>
                            <p className="mt-0.5 text-xs text-[#5B9BD5]">
                                {monthsInWardrobe} month
                                {monthsInWardrobe !== 1 ? "s" : ""} in your
                                wardrobe
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Product Image + Name ── */}
                <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 md:h-[80px] md:w-full md:max-w-none md:shrink">
                            <Image
                                src={imageUrl}
                                alt={imageAlt}
                                width={400}
                                height={400}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <p className="line-clamp-2 text-sm font-medium text-gray-800 md:hidden">
                            {productDisplay}
                        </p>
                    </div>
                    <p className="mt-2 hidden text-sm font-medium text-gray-800 md:block">
                        {productDisplay}
                    </p>
                </div>

                {/* ── Sustainability Stats ── */}
                <div className="mx-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-green-50/50 p-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <Shirt className="mx-auto mb-1 h-5 w-5 text-[#5B9BD5]" />
                            <p className="text-xs text-gray-500">Worn</p>
                            <p className="text-sm font-bold text-[#5B9BD5]">
                                {wearCount} times
                            </p>
                        </div>
                        <div>
                            <Heart className="mx-auto mb-1 h-5 w-5 text-green-500" />
                            <p className="text-xs text-gray-500">Cost/wear</p>
                            <p className="text-sm font-bold text-[#5B9BD5]">
                                {formatPriceTag(
                                    Math.round(costPerWear * 100) / 100,
                                    true
                                )}
                            </p>
                        </div>
                        <div>
                            <Leaf className="mx-auto mb-1 h-5 w-5 text-green-500" />
                            <p className="text-xs text-gray-500">CO₂ saved</p>
                            <p className="text-sm font-bold text-[#5B9BD5]">
                                {co2Saved}kg
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Wear Progress ── */}
                <div className="px-4 pt-3">
                    <div className="mb-1 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            {wearCount}/{WEAR_TARGET} wears to target
                            {targetExceeded && " ✓ Target exceeded!"}
                        </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                targetExceeded ? "bg-green-500" : "bg-[#5B9BD5]"
                            )}
                            style={{ width: `${wearProgress}%` }}
                        />
                    </div>
                </div>

                {/* ── Write Review CTA ── */}
                <div className="mx-4 mt-3 rounded-xl bg-gray-50 p-3 text-center">
                    <p className="mb-2 flex items-center justify-center gap-1.5 text-xs text-gray-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        Share your experience to help conscious shoppers
                    </p>
                    <button
                        onClick={() =>
                            toast.info("Review feature coming soon!")
                        }
                        className="w-full rounded-lg bg-[#5B9BD5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4A8BC5]"
                    >
                        Write Review
                    </button>
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex items-center gap-2 p-4">
                    <button
                        onClick={() => toast.info("Wear logging coming soon!")}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Log Wear
                    </button>
                    <button
                        onClick={() =>
                            toast.info("Reorder feature coming soon!")
                        }
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Reorder
                    </button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-gray-50">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1">
                            <Link
                                href={`/orders/${order.id}`}
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Eye className="h-4 w-4" /> View Details
                            </Link>
                            {showReturnReplaceButtons && (
                                <>
                                    <button
                                        onClick={() =>
                                            setReturnItem(order.items[0])
                                        }
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                                    >
                                        <RotateCcw className="h-4 w-4" /> Return
                                    </button>
                                    <button
                                        onClick={() =>
                                            setReplaceItem(order.items[0])
                                        }
                                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                    >
                                        <RefreshCw className="h-4 w-4" />{" "}
                                        Replace
                                    </button>
                                </>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* ── View Details Toggle ── */}
                <div className="border-t border-gray-100 px-4 py-2.5">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-xs font-medium text-[#5B9BD5] hover:underline"
                    >
                        {showDetails ? "Hide details −" : "View details +"}
                    </button>
                    {showDetails && (
                        <div className="mt-2 space-y-1 text-xs text-gray-500">
                            <p>Order ID: {order.id}</p>
                            <p>Receipt: #{order.receiptId}</p>
                            <p>Items: {order.items.length}</p>
                            <p>
                                Total:{" "}
                                {formatPriceTag(
                                    parseFloat(
                                        convertPaiseToRupees(
                                            Number(order.totalAmount)
                                        )
                                    ),
                                    true
                                )}
                            </p>
                            <p>Status: {order.status}</p>
                            {order.items.length > 1 && (
                                <div className="mt-1 space-y-0.5">
                                    {order.items.slice(1).map((item) => (
                                        <p
                                            key={item.id}
                                            className="text-gray-400"
                                        >
                                            + {item.product.title}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {returnItem && (
                <ReturnModal
                    orderItem={returnItem}
                    isOpen={!!returnItem}
                    onClose={() => setReturnItem(null)}
                />
            )}
            {replaceItem && (
                <ReplaceModal
                    orderItem={replaceItem}
                    isOpen={!!replaceItem}
                    onClose={() => setReplaceItem(null)}
                />
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ── PAGINATION CONTROLS ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    perPage: number;
}

function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    perPage,
}: PaginationControlsProps) {
    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalItems);

    // Generate page numbers to show (max 5 visible)
    const getPageNumbers = () => {
        const pages: (number | "ellipsis")[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("ellipsis");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("ellipsis");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-gray-500">
                Showing {startItem}–{endItem} of {totalItems} orders
            </p>

            <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                        "flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        currentPage === 1
                            ? "cursor-not-allowed text-gray-300"
                            : "text-gray-600 hover:bg-gray-100"
                    )}
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, idx) =>
                    page === "ellipsis" ? (
                        <span
                            key={`ellipsis-${idx}`}
                            className="flex h-8 w-8 items-center justify-center text-xs text-gray-400"
                        >
                            ···
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                                page === currentPage
                                    ? "bg-[#5B9BD5] text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                        "flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        currentPage === totalPages
                            ? "cursor-not-allowed text-gray-300"
                            : "text-gray-600 hover:bg-gray-100"
                    )}
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

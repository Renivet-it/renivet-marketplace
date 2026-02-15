"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import {
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Droplets,
    Leaf,
    Lock,
    MapPin,
    RotateCcw,
    ShoppingBag,
    Star,
    TrendingUp,
    XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════
//  DISPLAY STEPS (shared by both mobile & desktop)
// ═══════════════════════════════════════════════════════════════════
const DISPLAY_STEPS = [
    {
        key: "confirmed",
        label: "confirmed",
        // step is done when the internal status is one of these
        matchStatuses: [
            "pending",
            "pickup_scheduled",
            "pickup_completed",
            "in_transit",
            "out_for_delivery",
            "delivered",
        ],
        getSubtitle: (order: any, _shipment: any) =>
            `Confirmed on ${format(new Date(order.createdAt), "MMM dd, yyyy")}`,
    },
    {
        key: "preparing",
        label: "preparing for dispatch",
        matchStatuses: [
            "pickup_scheduled",
            "pickup_completed",
            "in_transit",
            "out_for_delivery",
            "delivered",
        ],
        getSubtitle: (_order: any, _shipment: any) => "Being crafted with care",
    },
    {
        key: "shipped",
        label: "shipped",
        matchStatuses: ["in_transit", "out_for_delivery", "delivered"],
        getSubtitle: (order: any, _shipment: any) => {
            const matchedStatuses = [
                "in_transit",
                "out_for_delivery",
                "delivered",
            ];
            const currentStatus = order?.shipments?.[0]?.status || "pending";
            return matchedStatuses.includes(currentStatus)
                ? "On its way to you"
                : "Awaiting dispatch";
        },
    },
    {
        key: "delivered",
        label: "delivered",
        matchStatuses: ["delivered"],
        getSubtitle: (order: any, shipment: any) => {
            if (shipment?.status === "delivered") {
                const date = shipment?.updatedAt ?? order.updatedAt;
                return `Delivered on ${format(new Date(date), "MMM dd, yyyy")}`;
            }
            const est = new Date(order.createdAt);
            est.setDate(est.getDate() + 7);
            return `Estimated: ${format(est, "MMM dd, yyyy")}`;
        },
    },
];

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════
function getSustainabilityScore(): number {
    return Math.floor(Math.random() * 15) + 75;
}

function getCareInstruction(categoryName?: string): string {
    if (!categoryName) return "Hand wash";
    const lower = categoryName.toLowerCase();
    if (
        lower.includes("silk") ||
        lower.includes("dress") ||
        lower.includes("sari")
    )
        return "Hand wash recommended";
    if (lower.includes("cotton") || lower.includes("linen"))
        return "Machine wash cold";
    if (lower.includes("wool") || lower.includes("knit"))
        return "Dry clean only";
    return "Hand wash recommended";
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function TrackingPage() {
    const [order, setOrder] = useState<any>(null);
    const [sustainScore] = useState(() => getSustainabilityScore());
    const [showDashboard, setShowDashboard] = useState(false);

    const { data: currentUser } = trpc.general.users.currentUser.useQuery();

    useEffect(() => {
        const stored = localStorage.getItem("trackingOrder");
        if (stored) setOrder(JSON.parse(stored));
    }, []);

    const awb =
        order?.shipments?.[0]?.awbNumber !== undefined
            ? order.shipments[0].awbNumber
            : "";

    const { data: _liveTracking } =
        trpc.general.returnReplace.trackShipment.useQuery(
            { awb },
            { enabled: Boolean(awb) }
        );

    if (!order) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading tracking...
                </p>
            </div>
        );
    }

    const shipment = order.shipments?.[0];
    const currentStatus = shipment?.status || "pending";

    // Shared data
    const firstItem = order.items?.[0];
    const brandName = firstItem?.product?.brand?.name ?? "Artisan";
    const productTitle = firstItem?.product?.title ?? "Product";
    const productImage =
        firstItem?.product?.media?.[0]?.mediaItem?.url ??
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
    const categoryName =
        firstItem?.product?.subcategory?.name ??
        firstItem?.product?.category?.name ??
        "";
    const careLabel = getCareInstruction(categoryName);
    const isReturnInitiated =
        shipment?.is_return_label_generated === true ||
        shipment?.is_replacement_label_generated === true;
    const canCancel =
        order.status === "pending" || order.status === "processing";

    const userName =
        currentUser?.firstName ?? currentUser?.name?.split(" ")[0] ?? "there";

    return (
        <>
            {/* ═══════════════════════════════════════════════════════ */}
            {/*  MOBILE LAYOUT                                        */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="min-h-screen bg-[#FAFBFC] md:hidden">
                {/* ── Top bar ── */}
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
                    <button
                        onClick={() => window.history.back()}
                        className="text-gray-600"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-sm font-semibold text-gray-800">
                        Your Orders
                    </h1>
                    <ShoppingBag className="h-5 w-5 text-[#5B9BD5]" />
                </div>

                <div className="px-4 pb-8">
                    {/* ── Welcome section ── */}
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gradient-to-b from-[#FDF8F0] to-white p-4">
                        <h2 className="text-base font-bold text-gray-800">
                            Welcome back, {userName}
                        </h2>
                        <p className="text-xs text-gray-400">
                            Your sustainable impact this year
                        </p>

                        {/* Impact stats row */}
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex flex-col items-center">
                                <Lock className="mb-1 h-5 w-5 text-[#5B9BD5]" />
                                <p className="text-base font-bold text-gray-800">
                                    4
                                </p>
                                <p className="text-center text-[10px] leading-tight text-gray-400">
                                    conscious
                                    <br />
                                    purchases
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <Leaf className="mb-1 h-5 w-5 text-[#5B9BD5]" />
                                <p className="text-base font-bold text-gray-800">
                                    3.2kg
                                </p>
                                <p className="text-center text-[10px] leading-tight text-gray-400">
                                    CO₂ saved
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <Star className="mb-1 h-5 w-5 text-[#D4A853]" />
                                <p className="text-base font-bold text-gray-800">
                                    89
                                </p>
                                <p className="text-center text-[10px] leading-tight text-gray-400">
                                    eco-score
                                </p>
                            </div>
                        </div>

                        {/* Tap to see full dashboard */}
                        <button
                            onClick={() => setShowDashboard(!showDashboard)}
                            className="mt-3 flex w-full items-center justify-center gap-1 text-xs font-medium text-[#5B9BD5]"
                        >
                            Tap to see full impact dashboard
                            <ChevronDown
                                className={`h-3 w-3 transition-transform ${showDashboard ? "rotate-180" : ""}`}
                            />
                        </button>
                    </div>

                    {/* Tracking journey text */}
                    <p className="mt-4 text-sm text-gray-500">
                        Tracking your sustainable journey with Renivet.
                    </p>

                    {/* Year badge */}
                    <div className="mb-5 mt-3">
                        <span className="inline-block rounded-full border border-gray-300 px-3 py-0.5 text-xs font-medium text-gray-500">
                            {new Date(order.createdAt).getFullYear()}
                        </span>
                    </div>

                    {/* ── Order header ── */}
                    <div className="mb-2">
                        <p className="text-base font-bold text-gray-900">
                            Order #{order.id}
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                Placed on{" "}
                                {format(
                                    new Date(order.createdAt),
                                    "MMM dd, yyyy"
                                )}
                            </span>
                        </p>
                    </div>

                    {/* ── Artisan badge ── */}
                    <div className="mb-5 flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                            <Image
                                src={productImage}
                                alt={brandName}
                                width={36}
                                height={36}
                                className="h-full w-full rounded-full object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400">
                                Handcrafted by
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                                {brandName}
                            </p>
                        </div>
                    </div>

                    {/* ── Status timeline ── */}
                    <div className="relative mb-6 space-y-5 pl-6">
                        {/* Vertical line */}
                        <div className="absolute bottom-2 left-[9px] top-2 w-[2px] bg-gray-200" />

                        {DISPLAY_STEPS.map((step) => {
                            const isCompleted =
                                step.matchStatuses.includes(currentStatus);
                            const subtitle = step.getSubtitle(order, shipment);

                            return (
                                <div
                                    key={step.key}
                                    className="relative flex items-start gap-3"
                                >
                                    {/* Node */}
                                    <div
                                        className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                                            isCompleted
                                                ? "bg-[#5B9BD5] text-white"
                                                : "border-2 border-gray-300 bg-white"
                                        }`}
                                    >
                                        {isCompleted && (
                                            <CheckCircle size={12} />
                                        )}
                                    </div>

                                    <div>
                                        <p
                                            className={`text-sm font-semibold ${
                                                isCompleted
                                                    ? "text-gray-800"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {step.label}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {subtitle}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Return Initiated */}
                        {isReturnInitiated && (
                            <div className="relative flex items-start gap-3">
                                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-white">
                                    <RotateCcw size={12} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-orange-600">
                                        Return Initiated
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Return pickup scheduled
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Impact tip ── */}
                    <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#F0F6FC] p-4">
                        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#5B9BD5]" />
                        <p className="text-sm leading-relaxed text-gray-600">
                            Based on your style, you&apos;ll likely wear this
                            40+ times in the first year
                        </p>
                    </div>

                    {/* ── Product card ── */}
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-100">
                            <Image
                                src={productImage}
                                alt={productTitle}
                                width={120}
                                height={120}
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">
                                {brandName.toUpperCase()} {productTitle}
                            </p>
                            <p className="text-xs text-gray-400">
                                Qty: {firstItem?.quantity ?? 1}
                                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                                    <Droplets className="h-2.5 w-2.5" />
                                    {careLabel}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div className="mb-6 space-y-2">
                        {canCancel && (
                            <button className="w-full text-center text-sm font-medium text-red-400">
                                Cancel Order
                            </button>
                        )}
                        <Link
                            href={`/orders/${order.id}`}
                            className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600"
                        >
                            View Details
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {/* ── 30-Day Wear Challenge ── */}
                    <div className="flex flex-col items-center rounded-xl bg-white p-6 text-center shadow-sm">
                        <Leaf className="mb-2 h-6 w-6 text-green-500" />
                        <h3 className="text-base font-bold text-gray-800">
                            Join the 30-Day Wear Challenge
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Commit to wearing items you already own 30 times
                            before buying new
                        </p>
                        <Button className="mt-4 rounded-lg bg-[#5B9BD5] px-6 text-white hover:bg-[#4A8BC5]">
                            Join Challenge
                        </Button>
                        <p className="mt-2 text-xs font-medium text-[#5B9BD5]">
                            87 mindful shoppers participating
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/*  DESKTOP LAYOUT                                       */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="mx-auto hidden max-w-5xl px-4 py-10 md:block">
                {/* Title bar */}
                <div className="mb-2">
                    <h1 className="text-xl font-bold text-gray-900">
                        Your Sustainable Journey
                    </h1>
                    <p className="mt-0.5 text-sm text-gray-400">
                        Track your conscious purchases and their impact
                    </p>
                </div>

                {/* Year badge */}
                <div className="mb-6">
                    <span className="inline-block rounded-full border border-[#5B9BD5] px-3 py-0.5 text-xs font-medium text-[#5B9BD5]">
                        {new Date(order.createdAt).getFullYear()}
                    </span>
                </div>

                {/* Main card */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {/* Order header */}
                    <div className="border-b border-gray-100 px-8 py-5">
                        <p className="text-lg font-bold text-gray-900">
                            Order #{order.id}
                            <span className="ml-2 text-sm font-normal text-gray-400">
                                • Placed on{" "}
                                {format(
                                    new Date(order.createdAt),
                                    "MMM dd, yyyy"
                                )}
                            </span>
                        </p>
                    </div>

                    {/* Two-column body */}
                    <div className="flex">
                        {/* ── LEFT COLUMN ── */}
                        <div className="flex-1 border-r border-gray-100 px-8 py-6">
                            {/* Artisan badge */}
                            <div className="mb-8 flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200">
                                    <Image
                                        src={productImage}
                                        alt={brandName}
                                        width={40}
                                        height={40}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">
                                        Handcrafted by
                                    </p>
                                    <p className="text-sm font-bold text-gray-800">
                                        {brandName}
                                    </p>
                                </div>
                            </div>

                            {/* Status timeline — same steps as mobile */}
                            <div className="relative space-y-7 pl-8">
                                {/* Vertical line */}
                                <div className="absolute bottom-3 left-[11px] top-3 w-[2px] bg-gray-200" />

                                {DISPLAY_STEPS.map((step) => {
                                    const isCompleted =
                                        step.matchStatuses.includes(
                                            currentStatus
                                        );
                                    const subtitle = step.getSubtitle(
                                        order,
                                        shipment
                                    );

                                    return (
                                        <div
                                            key={step.key}
                                            className="relative flex items-start gap-4"
                                        >
                                            {/* Node */}
                                            <div
                                                className={`absolute -left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                                                    isCompleted
                                                        ? "bg-[#5B9BD5] text-white"
                                                        : "border-2 border-gray-300 bg-white text-gray-400"
                                                }`}
                                            >
                                                {isCompleted && (
                                                    <CheckCircle size={14} />
                                                )}
                                            </div>

                                            <div>
                                                <p
                                                    className={`text-sm font-bold ${
                                                        isCompleted
                                                            ? "text-gray-800"
                                                            : "text-gray-400"
                                                    }`}
                                                >
                                                    {step.label}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-400">
                                                    {subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Return Initiated step */}
                                {isReturnInitiated && (
                                    <div className="relative flex items-start gap-4">
                                        <div className="absolute -left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-400 text-white">
                                            <RotateCcw size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-orange-600">
                                                Return Initiated
                                            </p>
                                            <p className="mt-0.5 text-xs text-gray-400">
                                                Return pickup has been scheduled
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dotted separator */}
                            <div className="my-6 border-t border-dashed border-gray-200" />

                            {/* Product card */}
                            <div className="flex items-start gap-4">
                                {/* Sustainability score badge */}
                                <div className="relative shrink-0">
                                    {/* <div className="absolute -left-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-[#5B9BD5] text-[10px] font-bold text-white shadow-sm">
                                        <span>
                                            {sustainScore}
                                            <span className="text-[8px] opacity-70">
                                                /100
                                            </span>
                                        </span>
                                    </div> */}
                                    <div className="h-24 w-24 overflow-hidden rounded-xl border border-gray-200">
                                        <Image
                                            src={productImage}
                                            alt={productTitle}
                                            width={200}
                                            height={200}
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 pt-1">
                                    <p className="text-sm font-bold text-gray-800">
                                        {brandName.toUpperCase()} {productTitle}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Qty: {firstItem?.quantity ?? 1}
                                    </p>
                                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                                        <Droplets className="h-3 w-3" />
                                        {careLabel}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div className="flex w-[340px] shrink-0 flex-col px-8 py-6">
                            {/* Impact tip */}
                            <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#F0F6FC] p-5">
                                <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#5B9BD5]" />
                                <p className="text-sm leading-relaxed text-gray-700">
                                    <span className="font-semibold">
                                        Based on your style,
                                    </span>{" "}
                                    you&apos;ll likely wear this 40+ times in
                                    the first year
                                </p>
                            </div>

                            {/* Milestone card */}
                            <div className="mb-5 rounded-xl border border-green-100 bg-green-50/50 p-5">
                                <div className="mb-2">
                                    <Leaf className="h-5 w-5 text-green-500" />
                                </div>
                                <p className="mb-1 text-sm font-semibold text-gray-800">
                                    This order marks your conscious purchase
                                    with Renivet!
                                </p>
                                <p className="text-xs leading-relaxed text-gray-500">
                                    You&apos;ve now saved 5kg CO₂ – equivalent
                                    to 30km by car
                                </p>
                                <Link
                                    href="/profile"
                                    className="mt-2 block text-xs font-medium text-[#5B9BD5] hover:underline"
                                >
                                    Unlocked: Priority access to new collections
                                </Link>
                            </div>

                            {/* Divider + actions */}
                            <div className="mt-auto border-t border-gray-200 pt-4">
                                <div className="flex items-center gap-4 text-xs">
                                    {canCancel && (
                                        <button className="flex items-center gap-1.5 text-gray-500 transition-colors hover:text-red-600">
                                            <XCircle className="h-3.5 w-3.5" />
                                            Cancel Order
                                        </button>
                                    )}
                                    {shipment?.awbNumber && (
                                        <Link
                                            href={`https://www.delhivery.com/track-v2/package/${shipment.awbNumber}`}
                                            target="_blank"
                                            className="flex items-center gap-1.5 text-gray-500 transition-colors hover:text-[#5B9BD5]"
                                        >
                                            <MapPin className="h-3.5 w-3.5" />
                                            Track Shipment
                                        </Link>
                                    )}
                                </div>

                                <Button
                                    asChild
                                    className="mt-4 w-full rounded-lg bg-[#5B9BD5] text-white hover:bg-[#4A8BC5]"
                                >
                                    <Link href="/shop">
                                        Prepare Your Wardrobe
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 30-Day Wear Challenge ── */}
                <div className="mt-10 flex flex-col items-center text-center">
                    <Leaf className="mb-2 h-6 w-6 text-green-500" />
                    <h3 className="text-lg font-semibold italic text-gray-800">
                        Join the 30-Day Wear Challenge
                    </h3>
                    <p className="mt-1 max-w-md text-sm text-gray-500">
                        Commit to wearing items you already own 30 times before
                        buying new
                    </p>
                    <p className="mt-2 text-xs font-medium text-[#5B9BD5]">
                        87 mindful shoppers participating
                    </p>
                    <Button className="mt-3 rounded-lg bg-[#5B9BD5] px-6 text-white hover:bg-[#4A8BC5]">
                        Join Challenge
                    </Button>
                </div>
            </div>
        </>
    );
}

import {
    getLiveTrackingByAwb,
    getOrderTrackingByAwb,
} from "@/actions/order-tracking";
import { Button } from "@/components/ui/button-general";
import { format } from "date-fns";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Leaf,
    MapPin,
    Package,
    Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const DISPLAY_STEPS = [
    {
        key: "confirmed",
        label: "Order confirmed",
        matchStatuses: [
            "pending",
            "processing",
            "pickup_scheduled",
            "pickup_completed",
            "in_transit",
            "out_for_delivery",
            "delivered",
        ],
    },
    {
        key: "packed",
        label: "Preparing for dispatch",
        matchStatuses: [
            "processing",
            "pickup_scheduled",
            "pickup_completed",
            "in_transit",
            "out_for_delivery",
            "delivered",
        ],
    },
    {
        key: "shipped",
        label: "Shipped",
        matchStatuses: ["in_transit", "out_for_delivery", "delivered"],
    },
    {
        key: "delivered",
        label: "Delivered",
        matchStatuses: ["delivered"],
    },
];
const DELHIVERY_TO_INTERNAL: Record<string, string> = {
    "Manifested": "pending",
    "Pickup Exception": "pickup_exception",
    "Pickup Scheduled": "pickup_scheduled",
    "Picked Up": "pickup_completed",
    "In Transit": "in_transit",
    "Out For Delivery": "out_for_delivery",
    "Delivered": "delivered",
    "RTO Initiated": "rto_initiated",
    "RTO Delivered": "rto_delivered",
    "Undelivered": "failed",
    "Cancelled": "cancelled",
};

const STATUS_ORDER = [
    "pending",
    "processing",
    "pickup_scheduled",
    "pickup_completed",
    "in_transit",
    "out_for_delivery",
    "delivered",
];

function getResolvedStatus(dbStatus: string, liveScans: any[]) {
    let resolved = dbStatus;

    if (liveScans && liveScans.length > 0) {
        const latestScan = liveScans[liveScans.length - 1];
        if (latestScan?.status) {
            const scanStatusLower = latestScan.status.trim().toLowerCase();
            const matchedKey = Object.keys(DELHIVERY_TO_INTERNAL).find(
                (k) => k.toLowerCase() === scanStatusLower
            );
            if (matchedKey) {
                const liveStatus = DELHIVERY_TO_INTERNAL[matchedKey];
                const dbIndex = STATUS_ORDER.indexOf(resolved);
                const liveIndex = STATUS_ORDER.indexOf(liveStatus);
                if (liveIndex > dbIndex) {
                    resolved = liveStatus;
                }
            }
        }
    }
    return resolved;
}

function statusLabel(value?: string | null) {
    return value
        ? value
              .split("_")
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ")
        : "Pending";
}

export default async function DashboardTrackingPage({
    params,
}: {
    params: Promise<{ awb: string }>;
}) {
    const { awb } = await params;
    const decodedAwb = decodeURIComponent(awb);
    const [order, liveScans] = await Promise.all([
        getOrderTrackingByAwb(decodedAwb),
        getLiveTrackingByAwb(decodedAwb),
    ]);

    if (!order) notFound();

    const shipment =
        order.shipments?.find(
            (item: any) =>
                item.awbNumber === decodedAwb ||
                item.uploadWbn === decodedAwb ||
                item.trackingNumber === decodedAwb
        ) ?? order.shipments?.[0];
    const currentStatus = getResolvedStatus(shipment?.status ?? "pending", liveScans);
    const firstItem = order.items?.[0];
    const brandName = firstItem?.product?.brand?.name ?? "Renivet Brand";
    const productTitle = firstItem?.product?.title ?? "Order Item";
    const productImage =
        firstItem?.product?.media?.[0]?.mediaItem?.url ??
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
    const destination = [order.address?.city, order.address?.state, order.address?.zip]
        .filter(Boolean)
        .join(", ");

    return (
        <main className="min-h-screen bg-[#f6f7f2] px-4 py-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <Button asChild variant="ghost" className="mb-3 px-0">
                            <Link href="/dashboard/general/orders">
                                <ArrowLeft className="mr-2 size-4" />
                                Back to orders
                            </Link>
                        </Button>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                            Renivet tracking
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                            Shipment #{decodedAwb}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Order #{order.id} placed on{" "}
                            {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white bg-white px-5 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase text-gray-400">
                            Current status
                        </p>
                        <p className="mt-1 text-lg font-bold text-gray-900">
                            {statusLabel(currentStatus)}
                        </p>
                    </div>
                </div>

                <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
                        <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r lg:p-8">
                            <div className="mb-8 flex items-center gap-4 rounded-2xl bg-[#f8faf7] p-4">
                                <div className="size-16 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                                    <Image
                                        src={productImage}
                                        alt={productTitle}
                                        width={96}
                                        height={96}
                                        className="size-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-400">
                                        Handcrafted by
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {brandName}
                                    </p>
                                    <p className="mt-1 truncate text-sm text-gray-500">
                                        {productTitle}
                                    </p>
                                </div>
                            </div>

                            <div className="relative space-y-7 pl-9">
                                <div className="absolute bottom-3 left-3 top-3 w-px bg-gray-200" />
                                {DISPLAY_STEPS.map((step) => {
                                    const complete =
                                        step.matchStatuses.includes(currentStatus);

                                    return (
                                        <div key={step.key} className="relative">
                                            <div
                                                className={`absolute -left-9 top-0 flex size-6 items-center justify-center rounded-full ${
                                                    complete
                                                        ? "bg-[#5B9BD5] text-white"
                                                        : "border border-gray-300 bg-white text-gray-300"
                                                }`}
                                            >
                                                <CheckCircle2 className="size-4" />
                                            </div>
                                            <p
                                                className={`text-sm font-semibold ${
                                                    complete
                                                        ? "text-gray-900"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {step.key === "confirmed"
                                                    ? `Confirmed on ${format(
                                                          new Date(order.createdAt),
                                                          "MMM dd, yyyy"
                                                      )}`
                                                    : step.key === "delivered" &&
                                                        currentStatus === "delivered"
                                                      ? `Delivered on ${format(
                                                            new Date(
                                                                shipment?.updatedAt ??
                                                                    order.updatedAt
                                                            ),
                                                            "MMM dd, yyyy"
                                                        )}`
                                                      : statusLabel(currentStatus)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <aside className="space-y-4 p-6 lg:p-8">
                            <div className="rounded-2xl bg-[#eef6ff] p-5">
                                <Truck className="mb-3 size-5 text-[#5B9BD5]" />
                                <p className="text-sm font-semibold text-gray-900">
                                    {shipment?.courierName || "Courier pending"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    AWB {decodedAwb}
                                </p>
                                {destination && (
                                    <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <MapPin className="size-3.5" />
                                        {destination}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-2xl bg-[#f4faf3] p-5">
                                <Leaf className="mb-3 size-5 text-green-600" />
                                <p className="text-sm font-semibold text-gray-900">
                                    Renivet verified shipment
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                    This page is generated by Renivet using your
                                    internal order and courier tracking data.
                                </p>
                            </div>

                            <Button asChild className="w-full bg-[#5B9BD5] text-white hover:bg-[#4A8BC5]">
                                <Link
                                    href={`https://www.delhivery.com/track-v2/package/${decodedAwb}`}
                                    target="_blank"
                                >
                                    Open courier tracking
                                    <ExternalLink className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </aside>
                    </div>
                </section>

                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Live tracking updates
                            </h2>
                            <p className="text-sm text-gray-500">
                                Latest courier scan history for this AWB.
                            </p>
                        </div>
                        <Package className="size-5 text-gray-400" />
                    </div>

                    {liveScans.length === 0 ? (
                        <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
                            No live scan updates available yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {liveScans
                                .slice()
                                .reverse()
                                .map((scan, index) => (
                                    <div
                                        key={`${scan.status}-${scan.time}-${index}`}
                                        className="flex gap-4 rounded-2xl border border-gray-100 p-4"
                                    >
                                        <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eef6ff] text-[#5B9BD5]">
                                            <Clock3 className="size-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {scan.status}
                                            </p>
                                            {scan.detail && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {scan.detail}
                                                </p>
                                            )}
                                            {scan.time && (
                                                <p className="mt-2 text-xs font-medium text-gray-400">
                                                    {scan.time}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertValueToLabel,
    formatINR,
    generatePickupLocationCode,
    handleClientError,
} from "@/lib/utils";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";

export function CorporateOrdersTable({ initialData }: { initialData: any }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [shipmentOrderId, setShipmentOrderId] = useState<string | null>(null);
    const { data, isFetching, refetch } =
        trpc.general.corporateOrders.listOrders.useQuery(
            {
                page: 1,
                limit: 50,
                search: search || undefined,
                status: (status || undefined) as any,
            },
            {
                initialData,
            }
        );

    return (
        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
                <Input
                    placeholder="Search by order ID, company, contact, or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="payment_pending">Payment Pending</option>
                    <option value="inquiry_received">Inquiry Received</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="in_production">In Production</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="ready_for_dispatch">Ready for Dispatch</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                </select>
                <Button onClick={() => refetch()} disabled={isFetching}>
                    {isFetching ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3">Order ID</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Quantity</th>
                            <th className="px-4 py-3">Total Value</th>
                            <th className="px-4 py-3">Advance Paid</th>
                            <th className="px-4 py-3">Balance Due</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.length ? (
                            data.data.map((order: any) => (
                                <Fragment key={order.id}>
                                    <tr
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {order.publicOrderId}
                                        </td>
                                        <td className="px-4 py-3">{order.companyName}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {order.contactPersonName}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {order.emailAddress}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{order.quantity}</td>
                                        <td className="px-4 py-3">
                                            {formatINR(order.totalPaise)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatINR(order.advancePaidPaise)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatINR(order.balanceDuePaise)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {convertValueToLabel(order.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {new Date(order.createdAt).toLocaleDateString(
                                                "en-IN"
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Link
                                                    href={`/dashboard/general/corporate-orders/${order.id}`}
                                                    className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                >
                                                    View details
                                                </Link>
                                                {[
                                                    "ready_for_dispatch",
                                                    "dispatched",
                                                    "delivered",
                                                    "completed",
                                                ].includes(order.status) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShipmentOrderId((current) =>
                                                                current === order.id
                                                                    ? null
                                                                    : order.id
                                                            )
                                                        }
                                                        className="font-semibold text-emerald-700 underline-offset-4 hover:underline"
                                                    >
                                                        Shipment
                                                    </button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                    {shipmentOrderId === order.id ? (
                                        <tr className="border-t border-slate-100 bg-slate-50/60">
                                            <td colSpan={10} className="p-4">
                                                <CorporateShipmentInlinePanel
                                                    corporateOrderId={order.id}
                                                    quantity={order.quantity}
                                                    onSaved={() => {
                                                        void refetch();
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ) : null}
                                </Fragment>
                            ))
                        ) : (
                            <tr>
                                <td
                                    className="px-4 py-8 text-slate-500"
                                    colSpan={10}
                                >
                                    No corporate orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CorporateShipmentInlinePanel({
    corporateOrderId,
    quantity,
    onSaved,
}: {
    corporateOrderId: string;
    quantity: number;
    onSaved: () => void;
}) {
    const utils = trpc.useUtils();
    const { data, isLoading } = trpc.general.corporateOrders.getOrderById.useQuery({
        corporateOrderId,
    });
    const [provider, setProvider] = useState("manual");
    const [courierName, setCourierName] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [awbNumber, setAwbNumber] = useState("");
    const [trackingUrl, setTrackingUrl] = useState("");
    const [dispatchDate, setDispatchDate] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [shipmentStatus, setShipmentStatus] = useState("ready");
    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [shipmentCreated, setShipmentCreated] = useState(false);

    const saveShipment = trpc.general.corporatePlatform.saveShipment.useMutation({
        onSuccess: async () => {
            await Promise.all([
                utils.general.corporateOrders.getOrderById.invalidate({
                    corporateOrderId,
                }),
                utils.general.corporateOrders.listOrders.invalidate(),
            ]);
            toast.success("Shipment details saved");
            onSaved();
        },
        onError: (error) => handleClientError(error),
    });

    const shipment = data?.shipment;
    const brand = data?.brand;

    useEffect(() => {
        setProvider(shipment?.provider ?? "manual");
        setCourierName(shipment?.courierName ?? "");
        setTrackingNumber(shipment?.trackingNumber ?? "");
        setAwbNumber(shipment?.awbNumber ?? "");
        setTrackingUrl(shipment?.trackingUrl ?? "");
        setDispatchDate(shipment?.dispatchDate ?? "");
        setDeliveryDate(shipment?.deliveryDate ?? "");
        setShipmentStatus(shipment?.status ?? "ready");
        setShipmentCreated(Boolean(shipment));
    }, [
        shipment,
        shipment?.provider,
        shipment?.courierName,
        shipment?.trackingNumber,
        shipment?.awbNumber,
        shipment?.trackingUrl,
        shipment?.dispatchDate,
        shipment?.deliveryDate,
        shipment?.status,
    ]);

    if (isLoading || !data) {
        return (
            <div className="rounded-lg border bg-white p-4 text-sm text-slate-500">
                Loading shipment workspace...
            </div>
        );
    }

    const pickupLocation =
        brand?.id && brand?.name
            ? generatePickupLocationCode({
                  brandId: brand.id,
                  brandName: brand.name,
              })
            : "";

    const persistShipment = async (nextStatus?: string) => {
        await saveShipment.mutateAsync({
            orderId: corporateOrderId,
            courierName: courierName || null,
            trackingNumber: trackingNumber || null,
            awbNumber: awbNumber || null,
            trackingUrl: trackingUrl || null,
            dispatchDate: dispatchDate || null,
            deliveryDate: deliveryDate || null,
            status: (nextStatus ?? shipmentStatus) as any,
            provider,
        });
    };

    const createShipmentFirst = async () => {
        try {
            await persistShipment("ready");
            setShipmentCreated(true);
            toast.success("Shipment created. Now choose the pickup date.");
        } catch (error) {
            handleClientError(error);
        }
    };

    const scheduleDelhiveryPickup = async () => {
        if (!awbNumber.trim()) {
            toast.error("Add the AWB number first");
            return;
        }

        if (!pickupDate || !pickupTime) {
            toast.error("Select pickup date and time");
            return;
        }

        if (!pickupLocation) {
            toast.error("Brand pickup location is not available");
            return;
        }

        try {
            await persistShipment("ready");

            const res = await fetch("/api/delhivery/pickup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pickup_location: pickupLocation,
                    pickup_date: pickupDate,
                    pickup_time: pickupTime,
                    expected_package_count: quantity,
                }),
            });

            const result = await res.json();
            if (!result.success) {
                toast.error(result.message || "Failed to schedule Delhivery pickup");
                return;
            }

            await persistShipment("dispatched");
            toast.success("Delhivery pickup scheduled");
        } catch (error) {
            handleClientError(error);
        }
    };

    return (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        Shipment Workspace
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Create and manage shipment directly from the corporate orders table.
                    </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Qty {quantity}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                >
                    <option value="manual">Manual shipment</option>
                    <option value="delhivery">Delhivery</option>
                </select>
                <Input
                    placeholder="Courier name"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                />
                <Input
                    placeholder="Tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                />
                <Input
                    placeholder="AWB number"
                    value={awbNumber}
                    onChange={(e) => setAwbNumber(e.target.value)}
                />
                <Input
                    placeholder="Tracking URL"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                />
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={shipmentStatus}
                    onChange={(e) => setShipmentStatus(e.target.value)}
                >
                    <option value="ready">Ready</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                </select>
                <Input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                />
                <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                <Button
                    onClick={() =>
                        shipmentCreated
                            ? void persistShipment()
                            : void createShipmentFirst()
                    }
                    disabled={saveShipment.isPending}
                >
                    {saveShipment.isPending
                        ? "Saving..."
                        : shipmentCreated
                          ? "Save Shipment"
                          : "Ship Now"}
                </Button>
                {provider === "delhivery" && shipmentCreated ? (
                    <>
                        <Input
                            className="max-w-[190px]"
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                        />
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                        >
                            <option value="">Select pickup time</option>
                            <option value="09:00:00">9 AM - 10 AM</option>
                            <option value="11:00:00">11 AM - 12 PM</option>
                            <option value="14:00:00">2 PM - 3 PM</option>
                            <option value="16:00:00">4 PM - 5 PM</option>
                            <option value="18:00:00">6 PM - 7 PM</option>
                        </select>
                        <Button
                            variant="outline"
                            onClick={() => void scheduleDelhiveryPickup()}
                            disabled={saveShipment.isPending}
                        >
                            Schedule Delhivery Pickup
                        </Button>
                    </>
                ) : null}
            </div>

            {!shipmentCreated ? (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Click <span className="font-medium text-slate-900">Ship Now</span>{" "}
                    first to create the shipment. After that, the pickup date and
                    time options will appear here.
                </div>
            ) : null}

            {provider === "delhivery" && pickupLocation ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Pickup location: <span className="font-medium text-slate-900">{pickupLocation}</span>
                </div>
            ) : null}
        </div>
    );
}

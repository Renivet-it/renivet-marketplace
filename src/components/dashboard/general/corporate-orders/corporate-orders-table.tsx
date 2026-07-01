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
import { Fragment, useState } from "react";
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
                                                    order={order}
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
    order,
    quantity,
    onSaved,
}: {
    order: any;
    quantity: number;
    onSaved: () => void;
}) {
    const utils = trpc.useUtils();
    const {
        data: hydratedOrderData,
        isFetching: isHydratingOrder,
        error: hydrateOrderError,
    } = trpc.general.corporateOrders.getOrderById.useQuery(
        {
            corporateOrderId: order.id,
        },
        {
            enabled: !order?.brand || !order?.shipment,
            retry: 1,
        }
    );
    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const createForwardOrder =
        trpc.general.corporatePlatform.createForwardOrder.useMutation({
            onSuccess: async () => {
                await Promise.all([
                    utils.general.corporateOrders.listOrders.invalidate(),
                    utils.general.corporateOrders.getOrderById.invalidate({
                        corporateOrderId: order.id,
                    }),
                ]);
                toast.success("Forward order created successfully");
                onSaved();
            },
            onError: (error) => handleClientError(error),
        });
    const schedulePickup =
        trpc.general.corporatePlatform.scheduleCorporatePickup.useMutation({
            onSuccess: async () => {
                await Promise.all([
                    utils.general.corporateOrders.listOrders.invalidate(),
                    utils.general.corporateOrders.getOrderById.invalidate({
                        corporateOrderId: order.id,
                    }),
                ]);
                toast.success("Pickup scheduled successfully");
                onSaved();
            },
            onError: (error) => handleClientError(error),
        });

    const hydratedOrder = hydratedOrderData ?? order;
    const shipment = hydratedOrder?.shipment ?? order?.shipment;
    const brand = hydratedOrder?.brand ?? order?.brand;

    const pickupLocation =
        brand?.id && brand?.name
            ? generatePickupLocationCode({
                  brandId: brand.id,
                  brandName: brand.name,
              })
            : "";
    const shipmentCreated = Boolean(shipment?.awbNumber);
    const shipmentDispatched =
        shipment?.status === "dispatched" || shipment?.status === "in_transit";
    const currentStep = shipmentDispatched ? 2 : shipmentCreated ? 1 : 0;
    const forwardOrderAction = async () => {
        await createForwardOrder.mutateAsync({
            orderId: order.id,
        });
    };
    const scheduleDelhiveryPickup = async () => {
        if (!pickupDate || !pickupTime) {
            toast.error("Select pickup date and time");
            return;
        }

        if (!pickupLocation) {
            toast.error("Brand pickup location is not available");
            return;
        }

        await schedulePickup.mutateAsync({
            orderId: order.id,
            pickupDate,
            pickupTime,
        });
    };

    return (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        Shipment Workspace
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Create the Delhivery forward order first, then continue to pickup scheduling.
                    </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Qty {quantity}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <StepperCard
                    step={1}
                    title="Create Forward Order"
                    description="Push this corporate order to Delhivery and generate the AWB automatically."
                    state={currentStep >= 1 ? "done" : currentStep === 0 ? "active" : "upcoming"}
                />
                <StepperCard
                    step={2}
                    title="Schedule Pickup"
                    description="Choose pickup date and time after the forward order is created."
                    state={currentStep >= 2 ? "done" : currentStep === 1 ? "active" : "upcoming"}
                />
                <StepperCard
                    step={3}
                    title="Dispatch Tracking"
                    description="Track the AWB and continue shipment follow-up from the order detail view."
                    state={shipmentDispatched ? "active" : "upcoming"}
                />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Step 1
                </p>
                <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h4 className="text-base font-semibold text-slate-900">
                            Create Delhivery Forward Order
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                            Delivery details will be picked from this corporate order automatically.
                        </p>
                    </div>
                    <Button
                        onClick={() => void forwardOrderAction()}
                        disabled={createForwardOrder.isPending || shipmentCreated}
                    >
                        {createForwardOrder.isPending
                            ? "Creating..."
                            : shipmentCreated
                              ? "Forward Order Created"
                              : "Create Forward Order"}
                    </Button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InlineValue
                        label="Provider"
                        value={shipment?.provider || "Delhivery"}
                    />
                    <InlineValue
                        label="AWB Number"
                        value={shipment?.awbNumber || "Will be generated"}
                    />
                    <InlineValue
                        label="Tracking Number"
                        value={shipment?.trackingNumber || "Will be generated"}
                    />
                    <InlineValue
                        label="Pickup Location"
                        value={
                            pickupLocation ||
                            (isHydratingOrder
                                ? "Loading assigned pickup location..."
                                : "Assigned pickup location unavailable")
                        }
                    />
                </div>
                {hydrateOrderError ? (
                    <p className="mt-3 text-sm text-amber-700">
                        Could not load the assigned pickup location from order details yet.
                    </p>
                ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Step 2
                </p>
                <div className="mt-2">
                    <h4 className="text-base font-semibold text-slate-900">
                        Pickup Schedule
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                        Once the forward order is ready, choose the pickup slot for Delhivery.
                    </p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto]">
                    <Input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        disabled={!shipmentCreated || schedulePickup.isPending}
                    />
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        disabled={!shipmentCreated || schedulePickup.isPending}
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
                        disabled={!shipmentCreated || schedulePickup.isPending}
                    >
                        {schedulePickup.isPending
                            ? "Scheduling..."
                            : shipmentDispatched
                              ? "Pickup Scheduled"
                              : "Schedule Pickup"}
                    </Button>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
                {shipment?.trackingUrl ? (
                    <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-slate-300"
                    >
                        Open Tracking
                    </a>
                ) : null}
                <Link
                    href={`/dashboard/general/corporate-orders/${order.id}`}
                    className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-slate-300"
                >
                    Open Full Shipment View
                </Link>
            </div>

            {!shipmentCreated ? (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Start with <span className="font-medium text-slate-900">Create Forward Order</span>.
                    After the AWB is generated, the pickup scheduling step will unlock.
                </div>
            ) : null}

            {shipmentCreated ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Forward order created for{" "}
                    <span className="font-medium text-slate-900">
                        {order.publicOrderId}
                    </span>
                    {shipment?.awbNumber ? (
                        <>
                            {" "}with AWB{" "}
                            <span className="font-medium text-slate-900">
                                {shipment.awbNumber}
                            </span>
                        </>
                    ) : null}
                    .
                </div>
            ) : null}
        </div>
    );
}

function StepperCard({
    step,
    title,
    description,
    state,
}: {
    step: number;
    title: string;
    description: string;
    state: "done" | "active" | "upcoming";
}) {
    const stateClasses =
        state === "done"
            ? "border-emerald-200 bg-emerald-50/70"
            : state === "active"
              ? "border-sky-200 bg-sky-50/70"
              : "border-slate-200 bg-white";

    return (
        <div className={`rounded-2xl border p-4 ${stateClasses}`}>
            <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full border border-current/10 bg-white text-sm font-semibold text-slate-900">
                    {step}
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}

function InlineValue({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}

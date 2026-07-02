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

const volumetricWeightGrams = (length: number, width: number, height: number) =>
    Math.round((length * width * height) / 5);

const buildPresetDimensions = (packingType?: {
    baseLength?: number | null;
    baseWidth?: number | null;
    baseHeight?: number | null;
} | null) => ({
    length: Number(packingType?.baseLength ?? 0),
    width: Number(packingType?.baseWidth ?? 0),
    height: Number(packingType?.baseHeight ?? 0),
});

const PICKUP_TIME_SLOTS = [
    { value: "09:00:00", label: "9 AM - 10 AM", hour: 9 },
    { value: "11:00:00", label: "11 AM - 12 PM", hour: 11 },
    { value: "14:00:00", label: "2 PM - 3 PM", hour: 14 },
    { value: "16:00:00", label: "4 PM - 5 PM", hour: 16 },
    { value: "18:00:00", label: "6 PM - 7 PM", hour: 18 },
] as const;

export function CorporateOrdersTable({ initialData }: { initialData: any }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [showReplacements, setShowReplacements] = useState<"exclude" | "only" | "all">("all");
    const [shipmentOrderId, setShipmentOrderId] = useState<string | null>(null);
    const { data, isFetching, refetch } =
        trpc.general.corporateOrders.listOrders.useQuery(
            {
                page: 1,
                limit: 50,
                search: search || undefined,
                status: (status || undefined) as any,
                showReplacements,
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
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium text-slate-700"
                    value={showReplacements}
                    onChange={(e) => setShowReplacements(e.target.value as any)}
                >
                    <option value="exclude">Standard Orders</option>
                    <option value="only">Replacement Orders</option>
                    <option value="all">All Orders</option>
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
                                        <td className="px-4 py-3 text-slate-900">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="font-semibold text-slate-900">
                                                        {order.publicOrderId}
                                                    </span>
                                                    {order.publicOrderId.startsWith("REN-CORP-RPL-") ? (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                            Replacement
                                                        </span>
                                                    ) : order.replacementRequests && order.replacementRequests.length > 0 ? (
                                                        <Link
                                                            href={`/dashboard/general/corporate-orders/replacements?search=${order.publicOrderId}`}
                                                            className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100/80 transition-colors"
                                                        >
                                                            Has Replacement ({order.replacementRequests.length})
                                                        </Link>
                                                    ) : null}
                                                </div>
                                                {order.publicOrderId.startsWith("REN-CORP-RPL-") &&
                                                    order.companySnapshot?.replacementForPublicOrderId && (
                                                        <div className="text-xs text-slate-500">
                                                            Replacement for{" "}
                                                            <Link
                                                                href={`/dashboard/general/corporate-orders/${order.companySnapshot.replacementForOrderId}`}
                                                                className="font-semibold text-sky-700 hover:underline"
                                                            >
                                                                {order.companySnapshot.replacementForPublicOrderId}
                                                            </Link>
                                                        </div>
                                                )}
                                            </div>
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
                                                ].includes(order.status) || (order.status === "approved" && order.publicOrderId.startsWith("REN-CORP-RPL-")) ? (
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
    const { data: packingTypesData } = trpc.general.packingTypes.getAll.useQuery({
        page: 1,
        limit: 100,
    });
    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const existingPackageSelection =
        order?.shipment?.rawPayload &&
        typeof order.shipment.rawPayload === "object" &&
        !Array.isArray(order.shipment.rawPayload)
            ? (
                  order.shipment.rawPayload as Record<string, unknown>
              ).packageSelection as Record<string, unknown> | undefined
            : undefined;
    const [packageSource, setPackageSource] = useState<"preset" | "custom">(
        existingPackageSelection?.source === "custom" ? "custom" : "preset"
    );
    const [selectedPackingTypeId, setSelectedPackingTypeId] = useState(
        typeof existingPackageSelection?.packingTypeId === "string"
            ? existingPackageSelection.packingTypeId
            : ""
    );
    const [customLength, setCustomLength] = useState(
        typeof existingPackageSelection?.lengthCm === "number"
            ? String(existingPackageSelection.lengthCm)
            : ""
    );
    const [customWidth, setCustomWidth] = useState(
        typeof existingPackageSelection?.widthCm === "number"
            ? String(existingPackageSelection.widthCm)
            : ""
    );
    const [customHeight, setCustomHeight] = useState(
        typeof existingPackageSelection?.heightCm === "number"
            ? String(existingPackageSelection.heightCm)
            : ""
    );
    const [weightGrams, setWeightGrams] = useState(
        typeof existingPackageSelection?.weightGrams === "number"
            ? String(existingPackageSelection.weightGrams)
            : ""
    );
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
            onSuccess: async (result) => {
                await Promise.all([
                    utils.general.corporateOrders.listOrders.invalidate(),
                    utils.general.corporateOrders.getOrderById.invalidate({
                        corporateOrderId: order.id,
                    }),
                ]);
                toast.success(
                    result.pickupAlreadyExists
                        ? "Pickup request already existed for this slot, so this order was linked to it."
                        : "Order added to pickup successfully"
                );
                onSaved();
            },
            onError: (error) => handleClientError(error),
        });

    const hydratedOrder = hydratedOrderData ?? order;
    const shipment = hydratedOrder?.shipment ?? order?.shipment;
    const brand = hydratedOrder?.brand ?? order?.brand;
    const packingTypes = packingTypesData?.data ?? [];
    const selectedPackingType =
        packingTypes.find((packingType) => packingType.id === selectedPackingTypeId) ??
        null;
    const presetDimensions = buildPresetDimensions(selectedPackingType);
    const customDimensions = {
        length: Number(customLength) || 0,
        width: Number(customWidth) || 0,
        height: Number(customHeight) || 0,
    };
    const activeDimensions =
        packageSource === "custom" ? customDimensions : presetDimensions;
    const activeVolumetricWeight =
        activeDimensions.length > 0 &&
        activeDimensions.width > 0 &&
        activeDimensions.height > 0
            ? volumetricWeightGrams(
                  activeDimensions.length,
                  activeDimensions.width,
                  activeDimensions.height
              )
            : 0;
    const parsedWeightGrams = Number(weightGrams) || 0;
    const packageSelectionReady =
        parsedWeightGrams > 0 &&
        activeDimensions.length > 0 &&
        activeDimensions.width > 0 &&
        activeDimensions.height > 0 &&
        (packageSource === "custom" || Boolean(selectedPackingTypeId));
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const isPickupToday = pickupDate === todayIso;
    const availablePickupSlots = PICKUP_TIME_SLOTS.filter((slot) =>
        isPickupToday ? slot.hour > today.getHours() : true
    );

    const pickupLocation =
        brand?.id && brand?.name
            ? generatePickupLocationCode({
                  brandId: brand.id,
                  brandName: brand.name,
              })
            : "";
    const shipmentBlockedReason = !brand
        ? "No brand or pickup warehouse is assigned to this corporate order yet."
        : !pickupLocation
          ? "Assigned pickup location could not be resolved yet."
          : null;
    const canCreateForwardOrder = Boolean(pickupLocation);
    const shipmentCreated = Boolean(shipment?.awbNumber);
    const shipmentDispatched =
        shipment?.status === "dispatched" || shipment?.status === "in_transit";
    const pickupRequest =
        shipment?.rawPayload &&
        typeof shipment.rawPayload === "object" &&
        !Array.isArray(shipment.rawPayload)
            ? (
                  shipment.rawPayload as Record<string, unknown>
              ).pickupRequest as Record<string, unknown> | undefined
            : undefined;
    const pickupScheduled = Boolean(
        pickupRequest?.pickupId ||
            pickupRequest?.scheduledAt ||
            pickupRequest?.pickupDate
    );
    const currentStep = shipmentDispatched
        ? 2
        : pickupScheduled
          ? 2
          : shipmentCreated
            ? 1
            : 0;
    const forwardOrderAction = async () => {
        if (!packageSelectionReady) {
            toast.error(
                packageSource === "preset"
                    ? "Select a saved package option and enter shipment weight in grams"
                    : "Enter custom L x B x H and shipment weight in grams"
            );
            return;
        }

        await createForwardOrder.mutateAsync({
            orderId: order.id,
            packageSource,
            selectedPackingTypeId:
                packageSource === "preset" ? selectedPackingTypeId : null,
            lengthCm: activeDimensions.length,
            widthCm: activeDimensions.width,
            heightCm: activeDimensions.height,
            weightGrams: parsedWeightGrams,
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
                        Create the Delhivery forward order first, then add this shipment to the pickup request.
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
                    title="Add to Pickup"
                    description="Choose the pickup date and slot, then add this shipment to the warehouse pickup request."
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
                        disabled={
                            createForwardOrder.isPending ||
                            shipmentCreated ||
                            !packageSelectionReady ||
                            !canCreateForwardOrder
                        }
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
                                : "Pickup location unavailable")
                        }
                    />
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                Package Details for Delhivery
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Start with the saved package options you already have, or switch to a custom box size.
                            </p>
                        </div>
                        <div className="text-sm font-medium text-slate-700">
                            Volumetric estimate:{" "}
                            <span className="text-slate-900">
                                {activeVolumetricWeight > 0
                                    ? `${activeVolumetricWeight} g`
                                    : "Select a package first"}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Saved Package Options
                            </label>
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={packageSource === "preset" ? selectedPackingTypeId : ""}
                                onChange={(e) => {
                                    setPackageSource("preset");
                                    setSelectedPackingTypeId(e.target.value);
                                }}
                                disabled={shipmentCreated || createForwardOrder.isPending}
                            >
                                <option value="">Select existing package option</option>
                                {packingTypes.map((packingType) => (
                                    <option key={packingType.id} value={packingType.id}>
                                        {packingType.name} ({packingType.baseLength} x{" "}
                                        {packingType.baseWidth} x {packingType.baseHeight} cm)
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                    packageSource === "custom"
                                        ? "border-sky-200 bg-sky-50"
                                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                                }`}
                                onClick={() => setPackageSource("custom")}
                                disabled={shipmentCreated || createForwardOrder.isPending}
                            >
                                <span className="block text-sm font-semibold text-slate-900">
                                    Custom package option
                                </span>
                                <span className="mt-1 block text-sm text-slate-500">
                                    Enter custom L x B x H if none of the saved presets match this shipment.
                                </span>
                            </button>

                            {packageSource === "custom" ? (
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Length (cm)"
                                        value={customLength}
                                        onChange={(e) => setCustomLength(e.target.value)}
                                        disabled={shipmentCreated || createForwardOrder.isPending}
                                    />
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Breadth (cm)"
                                        value={customWidth}
                                        onChange={(e) => setCustomWidth(e.target.value)}
                                        disabled={shipmentCreated || createForwardOrder.isPending}
                                    />
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Height (cm)"
                                        value={customHeight}
                                        onChange={(e) => setCustomHeight(e.target.value)}
                                        disabled={shipmentCreated || createForwardOrder.isPending}
                                    />
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Shipment Weight
                            </label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="Enter weight in grams"
                                value={weightGrams}
                                onChange={(e) => setWeightGrams(e.target.value)}
                                disabled={shipmentCreated || createForwardOrder.isPending}
                            />
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                Shipping with{" "}
                                <span className="font-medium text-slate-900">
                                    {activeDimensions.length || 0} x {activeDimensions.width || 0} x{" "}
                                    {activeDimensions.height || 0} cm
                                </span>
                                {" · "}
                                <span className="font-medium text-slate-900">
                                    {parsedWeightGrams || 0} g
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {shipmentBlockedReason ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {shipmentBlockedReason}
                    </div>
                ) : null}
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
                        Add to Pickup
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                        Once the forward order is ready, choose the Delhivery pickup date and slot for this warehouse.
                    </p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_auto]">
                    <Input
                        type="date"
                        min={todayIso}
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
                        {availablePickupSlots.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                                {slot.label}
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="outline"
                        onClick={() => void scheduleDelhiveryPickup()}
                        disabled={!shipmentCreated || schedulePickup.isPending}
                    >
                        {schedulePickup.isPending
                            ? "Adding..."
                            : pickupScheduled || shipmentDispatched
                              ? "Added to Pickup"
                              : "Add to Pickup"}
                    </Button>
                </div>
                {pickupScheduled ? (
                    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                        Pickup request recorded for {pickupRequest?.pickupDate as string}
                        {typeof pickupRequest?.pickupTime === "string"
                            ? ` at ${pickupRequest.pickupTime}`
                            : ""}
                        {pickupRequest?.pickupId
                            ? ` · Request ID ${String(pickupRequest.pickupId)}`
                            : ""}
                        . This order has been added to the Delhivery pickup flow. Delhivery can still show <span className="font-medium">Ready to ship</span> until the parcel is physically scanned and picked up.
                    </div>
                ) : null}
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

            {shipmentBlockedReason ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Shipment cannot be completed from here until this order has an assigned pickup source.
                    Open the full order view and make sure the order is assigned to the correct brand/warehouse first.
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

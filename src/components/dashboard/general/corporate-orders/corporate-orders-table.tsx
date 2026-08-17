"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import {
    formatCorporateDeliveryAddress,
    isCorporateDeliveryAddressValid,
} from "@/lib/corporate-delivery-address";
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

const volumetricWeightGrams = (length: number, width: number, height: number) =>
    Math.round((length * width * height) / 5);

const buildPresetDimensions = (
    packingType?: {
        baseLength?: number | null;
        baseWidth?: number | null;
        baseHeight?: number | null;
    } | null
) => ({
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
    const [showReplacements, setShowReplacements] = useState<
        "exclude" | "only" | "all"
    >("all");
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
                    <option value="ready_for_dispatch">
                        Ready for Dispatch
                    </option>
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
                                    <tr className="border-t border-slate-100">
                                        <td className="px-4 py-3 text-slate-900">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="font-semibold text-slate-900">
                                                        {order.publicOrderId}
                                                    </span>
                                                    {order.publicOrderId.startsWith(
                                                        "REN-CORP-RPL-"
                                                    ) ? (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                            Replacement
                                                        </span>
                                                    ) : order.replacementRequests &&
                                                      order.replacementRequests
                                                          .length > 0 ? (
                                                        <Link
                                                            href={`/dashboard/general/corporate-orders/replacements?search=${order.publicOrderId}`}
                                                            className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 transition-colors hover:bg-amber-100/80"
                                                        >
                                                            Has Replacement (
                                                            {
                                                                order
                                                                    .replacementRequests
                                                                    .length
                                                            }
                                                            )
                                                        </Link>
                                                    ) : null}
                                                </div>
                                                {order.publicOrderId.startsWith(
                                                    "REN-CORP-RPL-"
                                                ) &&
                                                    order.companySnapshot
                                                        ?.replacementForPublicOrderId && (
                                                        <div className="text-xs text-slate-500">
                                                            Replacement for{" "}
                                                            <Link
                                                                href={`/dashboard/general/corporate-orders/${order.companySnapshot.replacementForOrderId}`}
                                                                className="font-semibold text-sky-700 hover:underline"
                                                            >
                                                                {
                                                                    order
                                                                        .companySnapshot
                                                                        .replacementForPublicOrderId
                                                                }
                                                            </Link>
                                                        </div>
                                                    )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.companyName}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {order.contactPersonName}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {order.emailAddress}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.quantity}
                                        </td>
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
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-3">
                                                <Link
                                                    href={`/dashboard/general/corporate-orders/${order.id}`}
                                                    className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                >
                                                    View details
                                                </Link>
                                                {order.taxInvoice ? (
                                                    <a
                                                        href={`/api/corporate-orders/${order.id}/invoice.pdf`}
                                                        className="font-semibold text-indigo-700 underline-offset-4 hover:underline"
                                                    >
                                                        Download invoice
                                                    </a>
                                                ) : null}
                                                {[
                                                    "ready_for_dispatch",
                                                    "dispatched",
                                                    "delivered",
                                                    "completed",
                                                ].includes(order.status) ||
                                                (order.status === "approved" &&
                                                    order.publicOrderId.startsWith(
                                                        "REN-CORP-RPL-"
                                                    )) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShipmentOrderId(
                                                                (current) =>
                                                                    current ===
                                                                    order.id
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
    const { data: packingTypesData } =
        trpc.general.packingTypes.getAll.useQuery({
            page: 1,
            limit: 100,
        });

    const hydratedOrder = hydratedOrderData ?? order;
    const shipment = hydratedOrder?.shipment ?? order?.shipment;
    const brand = hydratedOrder?.brand ?? order?.brand;

    const [consigneeName, setConsigneeName] = useState(
        hydratedOrder?.contactPersonName ?? order?.contactPersonName ?? ""
    );
    const [consigneePhone, setConsigneePhone] = useState(
        hydratedOrder?.mobileNumber ?? order?.mobileNumber ?? ""
    );
    const [consigneeAddress, setConsigneeAddress] = useState(
        (hydratedOrder?.deliveryAddress ?? order?.deliveryAddress ?? "").toLowerCase() ===
            "address not provided"
            ? ""
            : (hydratedOrder?.deliveryAddress ?? order?.deliveryAddress ?? "")
    );
    const [consigneeCity, setConsigneeCity] = useState(
        (hydratedOrder?.deliveryCity ?? order?.deliveryCity ?? "").toLowerCase() ===
            "unknown"
            ? ""
            : (hydratedOrder?.deliveryCity ?? order?.deliveryCity ?? "")
    );
    const [consigneeState, setConsigneeState] = useState(
        ((hydratedOrder?.companySnapshot ?? order?.companySnapshot) as
            | Record<string, unknown>
            | undefined)?.deliveryState
            ? String(
                  (
                      (hydratedOrder?.companySnapshot ??
                          order?.companySnapshot) as Record<string, unknown>
                  ).deliveryState
              )
            : ""
    );
    const [consigneePincode, setConsigneePincode] = useState(
        (hydratedOrder?.deliveryPincode ?? order?.deliveryPincode ?? "") ===
            "000000"
            ? ""
            : (hydratedOrder?.deliveryPincode ?? order?.deliveryPincode ?? "")
    );
    const [consigneeCountry, setConsigneeCountry] = useState(
        hydratedOrder?.deliveryCountry ?? order?.deliveryCountry ?? "India"
    );

    useEffect(() => {
        if (hydratedOrderData) {
            setConsigneeName(hydratedOrderData.contactPersonName || "");
            setConsigneePhone(hydratedOrderData.mobileNumber || "");
            setConsigneeAddress(
                (hydratedOrderData.deliveryAddress || "").toLowerCase() ===
                    "address not provided"
                    ? ""
                    : hydratedOrderData.deliveryAddress || ""
            );
            setConsigneeCity(
                (hydratedOrderData.deliveryCity || "").toLowerCase() ===
                    "unknown"
                    ? ""
                    : hydratedOrderData.deliveryCity || ""
            );
            const snapshot = hydratedOrderData.companySnapshot as
                | Record<string, unknown>
                | undefined;
            if (snapshot?.deliveryState) {
                setConsigneeState(String(snapshot.deliveryState));
            }
            setConsigneePincode(
                hydratedOrderData.deliveryPincode === "000000"
                    ? ""
                    : hydratedOrderData.deliveryPincode || ""
            );
            setConsigneeCountry(hydratedOrderData.deliveryCountry || "India");
        }
    }, [hydratedOrderData]);

    const isExistingAddressValid = isCorporateDeliveryAddressValid({
        contactPersonName:
            hydratedOrder?.contactPersonName ?? order?.contactPersonName,
        mobileNumber: hydratedOrder?.mobileNumber ?? order?.mobileNumber,
        deliveryAddress:
            hydratedOrder?.deliveryAddress ?? order?.deliveryAddress,
        deliveryCity: hydratedOrder?.deliveryCity ?? order?.deliveryCity,
        deliveryPincode:
            hydratedOrder?.deliveryPincode ?? order?.deliveryPincode,
        deliveryCountry:
            hydratedOrder?.deliveryCountry ?? order?.deliveryCountry,
    });

    const [isEditingAddress, setIsEditingAddress] = useState(
        !isExistingAddressValid
    );

    const isCurrentFormAddressValid = isCorporateDeliveryAddressValid({
        contactPersonName: consigneeName,
        mobileNumber: consigneePhone,
        deliveryAddress: consigneeAddress,
        deliveryCity: consigneeCity,
        deliveryPincode: consigneePincode,
        deliveryCountry: consigneeCountry,
    });

    const lastDelhiveryError = (() => {
        if (shipment?.awbNumber) return null;
        const raw = shipment?.rawPayload as Record<string, unknown> | undefined;
        if (!raw) return null;
        const pkgs = raw.packages as
            | Array<Record<string, unknown>>
            | undefined;
        if (
            Array.isArray(pkgs) &&
            pkgs.length > 0 &&
            Array.isArray(pkgs[0]?.remarks)
        ) {
            return (pkgs[0].remarks as string[]).join(", ");
        }
        if (typeof raw.rmk === "string") return raw.rmk;
        return null;
    })();

    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const existingPackageSelection =
        order?.shipment?.rawPayload &&
        typeof order.shipment.rawPayload === "object" &&
        !Array.isArray(order.shipment.rawPayload)
            ? ((order.shipment.rawPayload as Record<string, unknown>)
                  .packageSelection as Record<string, unknown> | undefined)
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

    const updateConsignee =
        trpc.general.corporatePlatform.updateConsigneeAddress.useMutation({
            onSuccess: async () => {
                await Promise.all([
                    utils.general.corporateOrders.listOrders.invalidate(),
                    utils.general.corporateOrders.getOrderById.invalidate({
                        corporateOrderId: order.id,
                    }),
                ]);
                toast.success("Consignee address saved");
                setIsEditingAddress(false);
            },
            onError: (error) => handleClientError(error),
        });

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
                setIsEditingAddress(false);
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

    const packingTypes = packingTypesData?.data ?? [];
    const selectedPackingType =
        packingTypes.find(
            (packingType) => packingType.id === selectedPackingTypeId
        ) ?? null;
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
            ? ((shipment.rawPayload as Record<string, unknown>)
                  .pickupRequest as Record<string, unknown> | undefined)
            : undefined;
    const pickupScheduled = Boolean(
        pickupRequest?.pickupId ||
            pickupRequest?.scheduledAt ||
            pickupRequest?.pickupDate
    );
    const forwardOrderAction = async () => {
        if (!isCurrentFormAddressValid) {
            toast.error(
                "Please enter a valid consignee name, mobile number, address, city, and 6-digit Indian PIN code."
            );
            setIsEditingAddress(true);
            return;
        }

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
            consignee: {
                contactPersonName: consigneeName.trim(),
                mobileNumber: consigneePhone.trim(),
                deliveryAddress: consigneeAddress.trim(),
                deliveryCity: consigneeCity.trim(),
                deliveryState: consigneeState.trim() || undefined,
                deliveryPincode: consigneePincode.trim(),
                deliveryCountry: consigneeCountry.trim() || "India",
            },
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
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Shipment
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        Delhivery · {quantity} units
                    </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                    {shipmentDispatched
                        ? "Dispatched"
                        : pickupScheduled
                          ? "Pickup scheduled"
                          : shipmentCreated
                            ? "AWB generated"
                            : "Setup required"}
                </div>
            </div>

            <div className="space-y-3 p-3">
                {/* Consignee / Delivery Address section */}
                <div className="rounded-md border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold text-slate-900">
                                Consignee / Delivery Address
                            </h4>
                            {!isExistingAddressValid ? (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                    Address Required
                                </span>
                            ) : (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                    Ready
                                </span>
                            )}
                        </div>
                        {!shipmentCreated ? (
                            <button
                                type="button"
                                onClick={() =>
                                    setIsEditingAddress((prev) => !prev)
                                }
                                className="text-[11px] font-semibold text-sky-700 hover:underline"
                            >
                                {isEditingAddress
                                    ? "Close edit"
                                    : "Edit consignee address"}
                            </button>
                        ) : null}
                    </div>

                    {lastDelhiveryError ? (
                        <div className="mx-3 mt-3 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                            <span className="font-semibold">
                                Delhivery Error:{" "}
                            </span>
                            {lastDelhiveryError}. Please update the consignee
                            address and PIN code below.
                        </div>
                    ) : null}

                    {isEditingAddress && !shipmentCreated ? (
                        <div className="space-y-3 p-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="space-y-1">
                                    <span className="block text-[10px] font-medium text-slate-500">
                                        Contact Person Name *
                                    </span>
                                    <Input
                                        className="h-9 py-1 text-xs"
                                        placeholder="e.g. Ayan Ganguly"
                                        value={consigneeName}
                                        onChange={(e) =>
                                            setConsigneeName(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="space-y-1">
                                    <span className="block text-[10px] font-medium text-slate-500">
                                        Mobile Number *
                                    </span>
                                    <Input
                                        className="h-9 py-1 text-xs"
                                        placeholder="e.g. 9876543210"
                                        value={consigneePhone}
                                        onChange={(e) =>
                                            setConsigneePhone(e.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            <label className="block space-y-1">
                                <span className="block text-[10px] font-medium text-slate-500">
                                    Delivery Street Address *
                                </span>
                                <Input
                                    className="h-9 py-1 text-xs"
                                    placeholder="e.g. Unit 402, Block B, Tech Park"
                                    value={consigneeAddress}
                                    onChange={(e) =>
                                        setConsigneeAddress(e.target.value)
                                    }
                                />
                            </label>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <label className="space-y-1">
                                    <span className="block text-[10px] font-medium text-slate-500">
                                        City *
                                    </span>
                                    <Input
                                        className="h-9 py-1 text-xs"
                                        placeholder="e.g. Kolkata"
                                        value={consigneeCity}
                                        onChange={(e) =>
                                            setConsigneeCity(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="space-y-1">
                                    <span className="block text-[10px] font-medium text-slate-500">
                                        State
                                    </span>
                                    <Input
                                        className="h-9 py-1 text-xs"
                                        placeholder="e.g. West Bengal"
                                        value={consigneeState}
                                        onChange={(e) =>
                                            setConsigneeState(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="space-y-1">
                                    <span className="block text-[10px] font-medium text-slate-500">
                                        6-digit PIN Code *
                                    </span>
                                    <Input
                                        className="h-9 py-1 text-xs"
                                        placeholder="e.g. 700091"
                                        maxLength={6}
                                        value={consigneePincode}
                                        onChange={(e) =>
                                            setConsigneePincode(e.target.value)
                                        }
                                    />
                                </label>
                                <label className="space-y-1">
                                    <span className="block text-[10px] font-medium text-slate-500">
                                        Country
                                    </span>
                                    <Input
                                        className="h-9 py-1 text-xs"
                                        value={consigneeCountry}
                                        onChange={(e) =>
                                            setConsigneeCountry(e.target.value)
                                        }
                                    />
                                </label>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                                <p className="text-[11px] text-slate-500">
                                    {isCurrentFormAddressValid ? (
                                        <span className="text-emerald-700">
                                            ✓ Address details are valid for
                                            Delhivery.
                                        </span>
                                    ) : (
                                        <span className="text-amber-700">
                                            ⚠ Fill in all required fields
                                            (valid 6-digit PIN).
                                        </span>
                                    )}
                                </p>
                                <Button
                                    variant="outline"
                                    className="h-8 px-3 text-[11px]"
                                    disabled={
                                        updateConsignee.isPending ||
                                        !isCurrentFormAddressValid
                                    }
                                    onClick={() => {
                                        updateConsignee.mutate({
                                            orderId: order.id,
                                            contactPersonName:
                                                consigneeName.trim(),
                                            mobileNumber:
                                                consigneePhone.trim(),
                                            deliveryAddress:
                                                consigneeAddress.trim(),
                                            deliveryCity:
                                                consigneeCity.trim(),
                                            deliveryState:
                                                consigneeState.trim() ||
                                                undefined,
                                            deliveryPincode:
                                                consigneePincode.trim(),
                                            deliveryCountry:
                                                consigneeCountry.trim() ||
                                                "India",
                                        });
                                    }}
                                >
                                    {updateConsignee.isPending
                                        ? "Saving..."
                                        : "Save address"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                            <InlineValue
                                label="Contact Person"
                                value={consigneeName || "Not provided"}
                            />
                            <InlineValue
                                label="Mobile Number"
                                value={consigneePhone || "Not provided"}
                            />
                            <InlineValue
                                label="Delivery Address"
                                value={
                                    formatCorporateDeliveryAddress({
                                        deliveryAddress: consigneeAddress,
                                        deliveryCity: consigneeCity,
                                        deliveryState: consigneeState,
                                        deliveryPincode: consigneePincode,
                                        deliveryCountry: consigneeCountry,
                                    }) || "Not provided"
                                }
                            />
                            <InlineValue
                                label="PIN Code"
                                value={
                                    consigneePincode &&
                                    consigneePincode !== "000000"
                                        ? consigneePincode
                                        : "Invalid PIN (000000)"
                                }
                            />
                        </div>
                    )}
                </div>

                <div className="rounded-md border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h4 className="text-xs font-semibold text-slate-900">
                                Create shipment
                            </h4>
                        </div>
                        <Button
                            className="h-8 w-auto self-start px-3 text-[11px] sm:self-auto"
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
                                  ? "Shipment created"
                                  : "Create shipment"}
                        </Button>
                    </div>
                    <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
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
                            value={
                                shipment?.trackingNumber || "Will be generated"
                            }
                        />
                        <InlineValue
                            label="Pickup Location"
                            value={
                                pickupLocation ||
                                (isHydratingOrder
                                    ? "Loading..."
                                    : "Unavailable")
                            }
                        />
                    </div>
                    <div className="p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Package
                            </p>
                            <div className="text-[11px] text-slate-500">
                                Volumetric:{" "}
                                <span className="font-medium text-slate-800">
                                    {activeVolumetricWeight > 0
                                        ? `${activeVolumetricWeight} g`
                                        : "—"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-2">
                            <label className="w-full min-w-[240px] space-y-1 sm:max-w-xl">
                                <span className="block text-[10px] font-medium text-slate-500">
                                    Product package
                                </span>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background !px-3 !py-0 !text-[11px] !leading-5"
                                    value={
                                        packageSource === "preset"
                                            ? selectedPackingTypeId
                                            : ""
                                    }
                                    onChange={(e) => {
                                        setPackageSource("preset");
                                        setSelectedPackingTypeId(
                                            e.target.value
                                        );
                                    }}
                                    disabled={
                                        shipmentCreated ||
                                        createForwardOrder.isPending
                                    }
                                >
                                    <option value="">
                                        Select product package
                                    </option>
                                    {packingTypes.map((packingType) => (
                                        <option
                                            key={packingType.id}
                                            value={packingType.id}
                                        >
                                            {packingType.name} (
                                            {packingType.baseLength} x{" "}
                                            {packingType.baseWidth} x{" "}
                                            {packingType.baseHeight} cm)
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <button
                                type="button"
                                className={`h-9 whitespace-nowrap rounded-md border px-3 text-[11px] font-medium transition ${
                                    packageSource === "custom"
                                        ? "border-sky-300 bg-sky-50 text-sky-800"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                                onClick={() => setPackageSource("custom")}
                                disabled={
                                    shipmentCreated ||
                                    createForwardOrder.isPending
                                }
                            >
                                Enter custom size
                            </button>

                            <label className="w-full space-y-1 sm:w-48">
                                <span className="block text-[10px] font-medium text-slate-500">
                                    Weight (g)
                                </span>
                                <Input
                                    className="h-9 min-w-0 py-1 text-xs"
                                    type="number"
                                    min="1"
                                    placeholder="Enter weight"
                                    value={weightGrams}
                                    onChange={(e) =>
                                        setWeightGrams(e.target.value)
                                    }
                                    disabled={
                                        shipmentCreated ||
                                        createForwardOrder.isPending
                                    }
                                />
                            </label>
                        </div>

                        {packageSource === "custom" ? (
                            <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                                <DimensionInput
                                    label="Length (cm)"
                                    value={customLength}
                                    onChange={setCustomLength}
                                    disabled={
                                        shipmentCreated ||
                                        createForwardOrder.isPending
                                    }
                                />
                                <DimensionInput
                                    label="Breadth (cm)"
                                    value={customWidth}
                                    onChange={setCustomWidth}
                                    disabled={
                                        shipmentCreated ||
                                        createForwardOrder.isPending
                                    }
                                />
                                <DimensionInput
                                    label="Height (cm)"
                                    value={customHeight}
                                    onChange={setCustomHeight}
                                    disabled={
                                        shipmentCreated ||
                                        createForwardOrder.isPending
                                    }
                                />
                                <div className="flex h-9 items-center whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-3 text-[10px] font-medium text-slate-900">
                                    {`${activeDimensions.length || 0} × ${activeDimensions.width || 0} × ${activeDimensions.height || 0} cm · ${parsedWeightGrams || 0} g`}
                                </div>
                            </div>
                        ) : null}
                    </div>
                    {shipmentBlockedReason ? (
                        <div className="mx-4 mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            {shipmentBlockedReason}
                        </div>
                    ) : null}
                    {hydrateOrderError ? (
                        <p className="mx-4 mb-4 text-xs text-amber-700">
                            Pickup location could not be loaded.
                        </p>
                    ) : null}
                </div>
                <div className="rounded-md border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 bg-slate-50/60 px-3 py-2.5">
                        <h4 className="text-xs font-semibold text-slate-900">
                            Schedule pickup
                        </h4>
                    </div>
                    <div className="flex flex-wrap items-end gap-2 p-3">
                        <label className="w-44 space-y-1">
                            <span className="block text-[10px] font-medium text-slate-500">
                                Pickup date
                            </span>
                            <Input
                                className="h-9 py-1 text-xs"
                                type="date"
                                min={todayIso}
                                value={pickupDate}
                                onChange={(e) => setPickupDate(e.target.value)}
                                disabled={
                                    !shipmentCreated || schedulePickup.isPending
                                }
                            />
                        </label>
                        <label className="w-52 space-y-1">
                            <span className="block text-[10px] font-medium text-slate-500">
                                Time slot
                            </span>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                disabled={
                                    !shipmentCreated || schedulePickup.isPending
                                }
                            >
                                <option value="">Select a time slot</option>
                                {availablePickupSlots.map((slot) => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button
                            className="h-9 w-auto px-3 text-[11px]"
                            variant="outline"
                            onClick={() => void scheduleDelhiveryPickup()}
                            disabled={
                                !shipmentCreated || schedulePickup.isPending
                            }
                        >
                            {schedulePickup.isPending
                                ? "Adding..."
                                : pickupScheduled || shipmentDispatched
                                  ? "Added to Pickup"
                                  : "Add to Pickup"}
                        </Button>
                    </div>
                    {pickupScheduled ? (
                        <div className="mx-3 mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                            Pickup: {pickupRequest?.pickupDate as string}
                            {typeof pickupRequest?.pickupTime === "string"
                                ? ` at ${pickupRequest.pickupTime}`
                                : ""}
                            {pickupRequest?.pickupId
                                ? ` · Request ID ${String(pickupRequest.pickupId)}`
                                : ""}
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
                    {shipment?.trackingUrl ? (
                        <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300"
                        >
                            Open Tracking
                        </a>
                    ) : null}
                    <Link
                        href={`/dashboard/general/corporate-orders/${order.id}`}
                        className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:border-slate-300"
                    >
                        Order details
                    </Link>
                </div>

                {shipmentBlockedReason ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Assign a valid brand pickup location to continue.
                    </div>
                ) : null}

                {shipmentCreated ? (
                    <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        Shipment created
                        {shipment?.awbNumber ? (
                            <>
                                {" "}
                                with AWB{" "}
                                <span className="font-medium text-slate-900">
                                    {shipment.awbNumber}
                                </span>
                            </>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function DimensionInput({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}) {
    return (
        <label className="w-28 space-y-1">
            <span className="block text-[10px] font-medium text-slate-500">
                {label}
            </span>
            <Input
                className="h-9 py-1 text-xs"
                type="number"
                min="1"
                placeholder="0"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
            />
        </label>
    );
}

function InlineValue({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0 bg-white px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {label}
            </p>
            <p className="mt-1 break-words text-[11px] font-medium leading-4 text-slate-900 [overflow-wrap:anywhere]">
                {value}
            </p>
        </div>
    );
}

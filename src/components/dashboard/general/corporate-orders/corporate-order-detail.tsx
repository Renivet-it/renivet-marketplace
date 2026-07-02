"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { formatCorporateDeliveryAddress } from "@/lib/corporate-delivery-address";
import { trpc } from "@/lib/trpc/client";
import {
    convertValueToLabel,
    formatINR,
    generatePickupLocationCode,
    handleClientError,
} from "@/lib/utils";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function CorporateOrderDetail({ initialData }: { initialData: any }) {
    const companySnapshot = (initialData.companySnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const productSnapshot = (initialData.productConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const brandingSnapshot = (initialData.brandingConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const pricingSnapshot = (initialData.pricingSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const selectedColors = readNamedList(productSnapshot.colors);
    const logoLocations = readNamedList(brandingSnapshot.logoLocations);
    const extraCharges = readChargeList(brandingSnapshot.appliedExtraCharges);
    const printMethod = readNamedValue(brandingSnapshot.printMethod);
    const productType = readNamedValue(productSnapshot.productType);
    const gsmLabel = readLabelValue(productSnapshot.gsmOption);
    const fabricComposition = readNamedValue(productSnapshot.fabricComposition);
    const sizeBreakdown = Object.entries(
        (initialData.sizeBreakdown ?? pricingSnapshot.sizeBreakdown ?? {}) as Record<
            string,
            number
        >
    );
    const [status, setStatus] = useState(initialData.status);
    const [statusNote, setStatusNote] = useState("");
    const [shipmentProvider, setShipmentProvider] = useState(
        initialData.shipment?.provider ?? "manual"
    );
    const [shipmentCourierName, setShipmentCourierName] = useState(
        initialData.shipment?.courierName ?? ""
    );
    const [shipmentTrackingNumber, setShipmentTrackingNumber] = useState(
        initialData.shipment?.trackingNumber ?? ""
    );
    const [shipmentAwbNumber, setShipmentAwbNumber] = useState(
        initialData.shipment?.awbNumber ?? ""
    );
    const [shipmentTrackingUrl, setShipmentTrackingUrl] = useState(
        initialData.shipment?.trackingUrl ?? ""
    );
    const [shipmentDispatchDate, setShipmentDispatchDate] = useState(
        initialData.shipment?.dispatchDate ?? ""
    );
    const [shipmentDeliveryDate, setShipmentDeliveryDate] = useState(
        initialData.shipment?.deliveryDate ?? ""
    );
    const [shipmentStatus, setShipmentStatus] = useState(
        initialData.shipment?.status ?? "ready"
    );
    const [pickupDate, setPickupDate] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const utils = trpc.useUtils();
    const customerPaymentPageHref =
        initialData.balancePaymentLink ||
        `/corporate-orders/confirmation/${initialData.id}`;
    const canManageShipment = [
        "ready_for_dispatch",
        "dispatched",
        "delivered",
        "completed",
    ].includes(initialData.status);
    const delhiveryPickupLocation =
        initialData.brand?.id && initialData.brand?.name
            ? generatePickupLocationCode({
                  brandId: initialData.brand.id,
                  brandName: initialData.brand.name,
              })
            : "";
    const updateStatus =
        trpc.general.corporateOrders.updateStatus.useMutation({
            onSuccess: async () => {
                await utils.general.corporateOrders.getOrderById.invalidate({
                    corporateOrderId: initialData.id,
                });
            },
            onError: (error) => handleClientError(error),
        });
    const sendReminder =
        trpc.general.corporateOrders.sendBalancePaymentReminder.useMutation({
            onSuccess: async () => {
                await utils.general.corporateOrders.getOrderById.invalidate({
                    corporateOrderId: initialData.id,
                });
            },
            onError: (error) => handleClientError(error),
        });
    const saveShipment = trpc.general.corporatePlatform.saveShipment.useMutation({
        onSuccess: async () => {
            await utils.general.corporateOrders.getOrderById.invalidate({
                corporateOrderId: initialData.id,
            });
            toast.success("Shipment details saved");
        },
        onError: (error) => handleClientError(error),
    });

    const scheduleDelhiveryPickup = async () => {
        if (!shipmentAwbNumber.trim()) {
            toast.error("Add the Delhivery AWB number first");
            return;
        }

        if (!pickupDate || !pickupTime) {
            toast.error("Select pickup date and pickup time");
            return;
        }

        if (!delhiveryPickupLocation) {
            toast.error("Linked brand pickup location could not be resolved");
            return;
        }

        try {
            await saveShipment.mutateAsync({
                orderId: initialData.id,
                courierName: shipmentCourierName || "Delhivery",
                trackingNumber: shipmentTrackingNumber || shipmentAwbNumber,
                awbNumber: shipmentAwbNumber,
                trackingUrl: shipmentTrackingUrl || null,
                dispatchDate: shipmentDispatchDate || pickupDate,
                deliveryDate: shipmentDeliveryDate || null,
                status: "ready",
                provider: "delhivery",
            });

            const res = await fetch("/api/delhivery/pickup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pickup_location: delhiveryPickupLocation,
                    pickup_date: pickupDate,
                    pickup_time: pickupTime,
                    expected_package_count: 1,
                }),
            });

            const data = await res.json();
            if (!data.success) {
                toast.error(data.message || "Failed to schedule Delhivery pickup");
                return;
            }

            await saveShipment.mutateAsync({
                orderId: initialData.id,
                courierName: shipmentCourierName || "Delhivery",
                trackingNumber: shipmentTrackingNumber || shipmentAwbNumber,
                awbNumber: shipmentAwbNumber,
                trackingUrl: shipmentTrackingUrl || null,
                dispatchDate: shipmentDispatchDate || pickupDate,
                deliveryDate: shipmentDeliveryDate || null,
                status: "dispatched",
                provider: "delhivery",
            });

            toast.success("Delhivery pickup scheduled");
        } catch (error) {
            handleClientError(error);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Corporate Order
                        </p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-900">
                            {initialData.publicOrderId}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            {initialData.companyName} • {initialData.contactPersonName}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-sm text-slate-500">
                            Status:{" "}
                            <span className="font-semibold text-slate-900">
                                {convertValueToLabel(initialData.status)}
                            </span>
                        </p>
                        <p className="text-sm text-slate-500">
                            Payment:{" "}
                            <span className="font-semibold text-slate-900">
                                {convertValueToLabel(initialData.paymentStatus)}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <DetailCard
                        label="Total Order Value"
                        value={formatINR(initialData.totalPaise)}
                    />
                    <DetailCard
                        label="Advance Paid"
                        value={formatINR(initialData.advancePaidPaise)}
                    />
                    <DetailCard
                        label="Balance Due"
                        value={formatINR(initialData.balanceDuePaise)}
                    />
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_360px]">
                <div className="space-y-6">
                    <Panel title="Order Snapshot">
                        <div className="space-y-5">
                            <SnapshotSection
                                title="Company & Delivery"
                                description="Core buyer information and final delivery destination."
                            >
                                <div className="grid gap-3 md:grid-cols-2">
                                    <SnapshotItem
                                        label="Company"
                                        value={initialData.companyName}
                                    />
                                    <SnapshotItem
                                        label="Contact Person"
                                        value={initialData.contactPersonName}
                                    />
                                    <SnapshotItem
                                        label="Email"
                                        value={initialData.emailAddress}
                                    />
                                    <SnapshotItem
                                        label="Phone"
                                        value={initialData.mobileNumber}
                                    />
                                    <SnapshotItem
                                        label="GST Number"
                                        value={
                                            initialData.gstNumber || "Not provided"
                                        }
                                    />
                                    <SnapshotItem
                                        label="Employees"
                                        value={String(
                                            initialData.numberOfEmployees ??
                                                companySnapshot.numberOfEmployees ??
                                                "-"
                                        )}
                                    />
                                </div>
                                <SnapshotBlock
                                    label="Delivery Address"
                                    value={
                                        formatCorporateDeliveryAddress(initialData) ||
                                        "No delivery address captured"
                                    }
                                />
                            </SnapshotSection>

                            <SnapshotSection
                                title="Product Configuration"
                                description="Base garment, fabric decisions, quantity, and selected colors."
                            >
                                <div className="grid gap-3 md:grid-cols-2">
                                    <SnapshotItem
                                        label="Product Type"
                                        value={productType || "Not selected"}
                                    />
                                    <SnapshotItem
                                        label="GSM"
                                        value={gsmLabel || "Not selected"}
                                    />
                                    <SnapshotItem
                                        label="Fabric Composition"
                                        value={
                                            fabricComposition || "Not selected"
                                        }
                                    />
                                    <SnapshotItem
                                        label="Quantity"
                                        value={String(initialData.quantity ?? "-")}
                                    />
                                </div>
                                {selectedColors.length ? (
                                    <ChipGroup
                                        label="Selected Colors"
                                        values={selectedColors}
                                    />
                                ) : null}
                                {sizeBreakdown.length ? (
                                    <MetricStrip
                                        label="Size Breakdown"
                                        items={sizeBreakdown.map(([size, count]) => ({
                                            label: size,
                                            value: String(count),
                                        }))}
                                    />
                                ) : null}
                            </SnapshotSection>

                            <SnapshotSection
                                title="Branding & Customization"
                                description="Printing selections, logo placement, and extra customization charges."
                            >
                                <div className="grid gap-3 md:grid-cols-2">
                                    <SnapshotItem
                                        label="Print Method"
                                        value={printMethod || "Not selected"}
                                    />
                                    <SnapshotItem
                                        label="Payment Preference"
                                        value={convertValueToLabel(
                                            String(
                                                brandingSnapshot.paymentPreference ??
                                                    "partial_advance"
                                            )
                                        )}
                                    />
                                </div>
                                {logoLocations.length ? (
                                    <ChipGroup
                                        label="Logo Placements"
                                        values={logoLocations}
                                    />
                                ) : null}
                                {extraCharges.length ? (
                                    <MetricStrip
                                        label="Applied Extra Charges"
                                        items={extraCharges}
                                    />
                                ) : null}
                            </SnapshotSection>

                            <SnapshotSection
                                title="Commercial Summary"
                                description="Pricing generated for this order at the time of checkout."
                            >
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <SnapshotMoneyCard
                                        label="Subtotal"
                                        value={initialData.subtotalPaise}
                                    />
                                    <SnapshotMoneyCard
                                        label="Customization"
                                        value={initialData.customizationPaise}
                                    />
                                    <SnapshotMoneyCard
                                        label="GST"
                                        value={initialData.gstPaise}
                                    />
                                    <SnapshotMoneyCard
                                        label="Total"
                                        value={initialData.totalPaise}
                                    />
                                </div>
                            </SnapshotSection>
                        </div>
                    </Panel>

                    <Panel title="Files">
                        <div className="space-y-3 text-sm">
                            <FileRow
                                label="Artwork File"
                                file={initialData.artworkFile}
                            />
                            <FileRow
                                label="Employee Size Sheet"
                                file={initialData.employeeSheetFile}
                            />
                            <a
                                href={`/api/corporate-orders/${initialData.id}/summary.pdf`}
                                className="inline-flex font-semibold text-sky-700 underline-offset-4 hover:underline"
                            >
                                Download summary PDF
                            </a>
                        </div>
                    </Panel>

                    <Panel title="Status Timeline">
                        <div className="space-y-3">
                            {initialData.statusHistory?.length ? (
                                initialData.statusHistory.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-slate-200 px-4 py-3"
                                    >
                                        <p className="font-semibold text-slate-900">
                                            {convertValueToLabel(item.toStatus)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(item.createdAt).toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>
                                        {item.note && (
                                            <p className="mt-2 text-sm text-slate-700">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">
                                    No status changes recorded yet.
                                </p>
                            )}
                        </div>
                    </Panel>
                </div>

                <div className="space-y-6">
                    <Panel title="Update Status">
                        <div className="space-y-3">
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="inquiry_received">
                                    Inquiry Received
                                </option>
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
                            <textarea
                                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Optional note for the status change"
                                value={statusNote}
                                onChange={(e) => setStatusNote(e.target.value)}
                            />
                            <Button
                                onClick={() =>
                                    updateStatus.mutate({
                                        corporateOrderId: initialData.id,
                                        toStatus: status as any,
                                        note: statusNote || undefined,
                                    })
                                }
                                disabled={updateStatus.isPending}
                            >
                                {updateStatus.isPending
                                    ? "Saving..."
                                    : "Update Status"}
                            </Button>
                        </div>
                    </Panel>

                    <Panel title="Balance Payment Actions">
                        <div className="space-y-3">
                            <Input value={customerPaymentPageHref} readOnly />
                            <p className="text-sm leading-6 text-slate-500">
                                Customers can pay the remaining balance directly from
                                their corporate order page. Use the reminder button
                                below if you want to nudge them.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    sendReminder.mutate({
                                        corporateOrderId: initialData.id,
                                    })
                                }
                                disabled={
                                    sendReminder.isPending ||
                                    !initialData.balanceDuePaise
                                }
                            >
                                {sendReminder.isPending
                                    ? "Sending reminder..."
                                    : "Send Balance Reminder"}
                            </Button>
                        </div>
                    </Panel>

                    {canManageShipment ? (
                        <Panel title="Shipment Workspace">
                            <div className="space-y-3">
                                <select
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={shipmentProvider}
                                    onChange={(e) =>
                                        setShipmentProvider(e.target.value)
                                    }
                                >
                                    <option value="manual">Manual shipment</option>
                                    <option value="delhivery">Delhivery</option>
                                </select>
                                <Input
                                    placeholder="Courier name"
                                    value={shipmentCourierName}
                                    onChange={(e) =>
                                        setShipmentCourierName(e.target.value)
                                    }
                                />
                                <Input
                                    placeholder="Tracking number"
                                    value={shipmentTrackingNumber}
                                    onChange={(e) =>
                                        setShipmentTrackingNumber(e.target.value)
                                    }
                                />
                                <Input
                                    placeholder="AWB number"
                                    value={shipmentAwbNumber}
                                    onChange={(e) =>
                                        setShipmentAwbNumber(e.target.value)
                                    }
                                />
                                <Input
                                    placeholder="Tracking URL"
                                    value={shipmentTrackingUrl}
                                    onChange={(e) =>
                                        setShipmentTrackingUrl(e.target.value)
                                    }
                                />
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Input
                                        type="date"
                                        value={shipmentDispatchDate}
                                        onChange={(e) =>
                                            setShipmentDispatchDate(e.target.value)
                                        }
                                    />
                                    <Input
                                        type="date"
                                        value={shipmentDeliveryDate}
                                        onChange={(e) =>
                                            setShipmentDeliveryDate(e.target.value)
                                        }
                                    />
                                </div>
                                <select
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={shipmentStatus}
                                    onChange={(e) =>
                                        setShipmentStatus(e.target.value)
                                    }
                                >
                                    <option value="ready">Ready</option>
                                    <option value="dispatched">Dispatched</option>
                                    <option value="in_transit">In Transit</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="failed">Failed</option>
                                </select>
                                <Button
                                    onClick={() =>
                                        saveShipment.mutate({
                                            orderId: initialData.id,
                                            courierName:
                                                shipmentCourierName || null,
                                            trackingNumber:
                                                shipmentTrackingNumber || null,
                                            awbNumber: shipmentAwbNumber || null,
                                            trackingUrl:
                                                shipmentTrackingUrl || null,
                                            dispatchDate:
                                                shipmentDispatchDate || null,
                                            deliveryDate:
                                                shipmentDeliveryDate || null,
                                            status: shipmentStatus as any,
                                            provider: shipmentProvider,
                                        })
                                    }
                                    disabled={saveShipment.isPending}
                                >
                                    {saveShipment.isPending
                                        ? "Saving shipment..."
                                        : "Save Shipment"}
                                </Button>

                                {shipmentProvider === "delhivery" ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-sm font-medium text-slate-900">
                                            Delhivery pickup request
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Once the brand marks the order ready,
                                            admin can add this shipment to the
                                            Delhivery pickup flow from here.
                                        </p>
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <Input
                                                type="date"
                                                value={pickupDate}
                                                onChange={(e) =>
                                                    setPickupDate(e.target.value)
                                                }
                                            />
                                            <select
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                value={pickupTime}
                                                onChange={(e) =>
                                                    setPickupTime(e.target.value)
                                                }
                                            >
                                                <option value="">
                                                    Select pickup time
                                                </option>
                                                <option value="09:00:00">
                                                    9 AM - 10 AM
                                                </option>
                                                <option value="11:00:00">
                                                    11 AM - 12 PM
                                                </option>
                                                <option value="14:00:00">
                                                    2 PM - 3 PM
                                                </option>
                                                <option value="16:00:00">
                                                    4 PM - 5 PM
                                                </option>
                                                <option value="18:00:00">
                                                    6 PM - 7 PM
                                                </option>
                                            </select>
                                        </div>
                                        <Input
                                            className="mt-3"
                                            value={delhiveryPickupLocation}
                                            readOnly
                                        />
                                        <Button
                                            className="mt-3"
                                            variant="outline"
                                            onClick={scheduleDelhiveryPickup}
                                            disabled={saveShipment.isPending}
                                        >
                                            Add to Pickup
                                        </Button>
                                    </div>
                                ) : null}

                                {initialData.shipment?.trackingUrl ? (
                                    <a
                                        href={initialData.shipment.trackingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex font-semibold text-sky-700 underline-offset-4 hover:underline"
                                    >
                                        Open tracking link
                                    </a>
                                ) : null}
                            </div>
                        </Panel>
                    ) : (
                        <Panel title="Shipment Workspace">
                            <p className="text-sm leading-6 text-slate-500">
                                Shipment tools unlock after the brand moves this
                                order to <span className="font-medium">Ready for Dispatch</span>.
                            </p>
                        </Panel>
                    )}

                    <Panel title="Customer and Payment References">
                        <div className="space-y-2 text-sm">
                            <SimpleRow label="Email" value={initialData.emailAddress} />
                            <SimpleRow label="Phone" value={initialData.mobileNumber} />
                            <SimpleRow
                                label="Delivery Address"
                                value={formatCorporateDeliveryAddress(initialData)}
                            />
                            <SimpleRow
                                label="Razorpay Order"
                                value={initialData.razorpayOrderId || "Not available"}
                            />
                            <SimpleRow
                                label="Razorpay Payment"
                                value={
                                    initialData.razorpayPaymentId || "Not available"
                                }
                            />
                        </div>
                    </Panel>

                </div>
            </section>
        </div>
    );
}

function Panel({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function DetailCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function FileRow({ label, file }: { label: string; file: any }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
            <div>
                <p className="font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{file?.name ?? "Missing"}</p>
            </div>
            {file?.url ? (
                <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                >
                    Download
                </a>
            ) : (
                <span className="text-sm text-slate-500">Unavailable</span>
            )}
        </div>
    );
}

function SimpleRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span className="max-w-[60%] text-right font-medium text-slate-900">
                {value}
            </span>
        </div>
    );
}

function SnapshotSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
            <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-800">
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                </p>
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}

function SnapshotBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-800">{value}</p>
        </div>
    );
}

function ChipGroup({ label, values }: { label: string; values: string[] }) {
    return (
        <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
                {values.map((value) => (
                    <span
                        key={value}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                        {value}
                    </span>
                ))}
            </div>
        </div>
    );
}

function MetricStrip({
    label,
    items,
}: {
    label: string;
    items: Array<{ label: string; value: string }>;
}) {
    return (
        <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((item) => (
                    <div
                        key={`${item.label}-${item.value}`}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                    >
                        <p className="text-xs text-slate-500">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SnapshotMoneyCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
                {formatINR(value)}
            </p>
        </div>
    );
}

function readNamedList(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => readNamedValue(item))
        .filter((item): item is string => Boolean(item));
}

function readChargeList(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                return null;
            }

            const record = item as Record<string, unknown>;
            const name = typeof record.name === "string" ? record.name : "";
            const amount =
                typeof record.amountPaise === "number"
                    ? formatINR(record.amountPaise)
                    : "";

            return name && amount ? { label: name, value: amount } : null;
        })
        .filter(
            (item): item is { label: string; value: string } => Boolean(item)
        );
}

function readNamedValue(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return "";
    }

    const record = value as Record<string, unknown>;
    return typeof record.name === "string" ? record.name : "";
}

function readLabelValue(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return "";
    }

    const record = value as Record<string, unknown>;
    return typeof record.label === "string" ? record.label : "";
}

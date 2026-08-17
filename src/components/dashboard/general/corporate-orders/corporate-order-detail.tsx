"use client";

import { CorporateDocumentChainPanel } from "@/components/dashboard/general/corporate-orders/corporate-document-chain-panel";
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
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function CorporateOrderDetail({ initialData }: { initialData: any }) {
    const router = useRouter();
    const companySnapshot = (initialData.companySnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const productSnapshot = (initialData.productConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const brandingSnapshot = (initialData.brandingConfigSnapshot ??
        {}) as Record<string, unknown>;
    const pricingSnapshot = (initialData.pricingSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const selectedColors = readNamedList(productSnapshot.colors);
    const logoLocations = readNamedList(brandingSnapshot.logoLocations);
    const extraCharges = readChargeList(brandingSnapshot.appliedExtraCharges);
    const printMethod = readNamedValue(brandingSnapshot.printMethod);
    const productType =
        readNamedValue(productSnapshot.productType) ||
        readStringValue(productSnapshot.productTypeName);
    const gsmLabel =
        readLabelValue(productSnapshot.gsmOption) ||
        readStringValue(productSnapshot.gsmLabel);
    const fabricComposition =
        readNamedValue(productSnapshot.fabricComposition) ||
        readStringValue(productSnapshot.fabricCompositionName);
    const sizeBreakdown = Object.entries(
        (initialData.sizeBreakdown ??
            pricingSnapshot.sizeBreakdown ??
            {}) as Record<string, number>
    );
    const [status, setStatus] = useState(initialData.status);
    const [activeDetailTab, setActiveDetailTab] = useState<
        "overview" | "product" | "documents" | "payments" | "activity"
    >("overview");
    const [statusNote, setStatusNote] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState(
        initialData.brand?.id ?? ""
    );
    const [brandAssignmentNote, setBrandAssignmentNote] = useState("");
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
    const [consigneeName, setConsigneeName] = useState(
        initialData.contactPersonName || ""
    );
    const [consigneePhone, setConsigneePhone] = useState(
        initialData.mobileNumber || ""
    );
    const [consigneeAddress, setConsigneeAddress] = useState(
        (initialData.deliveryAddress || "").toLowerCase() ===
            "address not provided"
            ? ""
            : initialData.deliveryAddress || ""
    );
    const [consigneeCity, setConsigneeCity] = useState(
        (initialData.deliveryCity || "").toLowerCase() === "unknown"
            ? ""
            : initialData.deliveryCity || ""
    );
    const [consigneeState, setConsigneeState] = useState(
        (companySnapshot.deliveryState as string | undefined) || ""
    );
    const [consigneePincode, setConsigneePincode] = useState(
        initialData.deliveryPincode === "000000"
            ? ""
            : initialData.deliveryPincode || ""
    );
    const [consigneeCountry, setConsigneeCountry] = useState(
        initialData.deliveryCountry || "India"
    );
    const [isEditingAddress, setIsEditingAddress] = useState(
        !isCorporateDeliveryAddressValid(initialData)
    );
    const utils = trpc.useUtils();
    const { data: brandOptions = [] } =
        trpc.general.corporatePlatform.listAdminBrandOptions.useQuery();
    const customerPaymentPageHref =
        initialData.balancePaymentLink ||
        `/corporate-orders/confirmation/${initialData.id}`;
    const canManageShipment = [
        "ready_for_dispatch",
        "dispatched",
        "delivered",
        "completed",
    ].includes(initialData.status);
    const hasActionSidebar = ["payments", "activity"].includes(activeDetailTab);
    const delhiveryPickupLocation =
        initialData.brand?.id && initialData.brand?.name
            ? generatePickupLocationCode({
                  brandId: initialData.brand.id,
                  brandName: initialData.brand.name,
              })
            : "";
    const updateConsignee =
        trpc.general.corporatePlatform.updateConsigneeAddress.useMutation({
            onSuccess: async () => {
                await Promise.all([
                    utils.general.corporateOrders.getOrderById.invalidate({
                        corporateOrderId: initialData.id,
                    }),
                    utils.general.corporateOrders.listOrders.invalidate(),
                ]);
                toast.success("Consignee delivery address updated");
                setIsEditingAddress(false);
                router.refresh();
            },
            onError: (error) => handleClientError(error),
        });
    const updateStatus = trpc.general.corporateOrders.updateStatus.useMutation({
        onSuccess: async () => {
            await utils.general.corporateOrders.getOrderById.invalidate({
                corporateOrderId: initialData.id,
            });
        },
        onError: (error) => handleClientError(error),
    });
    const assignBrand = trpc.general.corporateOrders.assignBrand.useMutation({
        onSuccess: async (result) => {
            toast.success(`${result.brand.name} assigned to this order`);
            await Promise.all([
                utils.general.corporateOrders.getOrderById.invalidate({
                    corporateOrderId: initialData.id,
                }),
                utils.general.corporateOrders.listOrders.invalidate(),
            ]);
            router.refresh();
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
    const saveShipment =
        trpc.general.corporatePlatform.saveShipment.useMutation({
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
                toast.error(
                    data.message || "Failed to schedule Delhivery pickup"
                );
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
        <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Corporate Order
                        </p>
                        <h1 className="mt-1 break-words text-lg font-bold text-slate-900">
                            {initialData.publicOrderId}
                        </h1>
                        <p className="mt-1 text-xs text-slate-500">
                            {initialData.companyName} •{" "}
                            {initialData.contactPersonName}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-xs text-slate-500">
                            Status:{" "}
                            <span className="font-semibold text-slate-900">
                                {convertValueToLabel(initialData.status)}
                            </span>
                        </p>
                        <p className="text-xs text-slate-500">
                            Payment:{" "}
                            <span className="font-semibold text-slate-900">
                                {convertValueToLabel(initialData.paymentStatus)}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
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

            <nav className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                {(
                    [
                        ["overview", "Overview"],
                        ["product", "Product"],
                        ["documents", "Documents"],
                        ["payments", "Payments"],
                        ["activity", "Activity"],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setActiveDetailTab(value)}
                        className={`h-8 whitespace-nowrap rounded-md px-4 text-xs font-semibold transition ${
                            activeDetailTab === value
                                ? "bg-slate-900 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            <section
                className={`grid gap-4 ${
                    hasActionSidebar
                        ? "lg:grid-cols-[minmax(0,1.55fr)_300px]"
                        : "grid-cols-1"
                }`}
            >
                <div className="space-y-4">
                    {activeDetailTab === "overview" ||
                    activeDetailTab === "product" ? (
                        <Panel
                            title={
                                activeDetailTab === "overview"
                                    ? "Order overview"
                                    : "Product & branding"
                            }
                        >
                            <div className="space-y-5">
                                {activeDetailTab === "overview" ? (
                                    <SnapshotSection title="Company & Delivery">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500">
                                                {isCorporateDeliveryAddressValid(initialData) ? (
                                                    <span className="font-medium text-emerald-700">✓ Address verified</span>
                                                ) : (
                                                    <span className="font-medium text-rose-700">⚠ Incomplete address for Delhivery</span>
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingAddress((prev) => !prev)}
                                                className="text-[11px] font-semibold text-sky-700 hover:underline"
                                            >
                                                {isEditingAddress ? "Cancel" : "Edit Consignee & Address"}
                                            </button>
                                        </div>

                                        {isEditingAddress ? (
                                            <div className="mb-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <label className="space-y-1">
                                                        <span className="block text-[10px] font-medium text-slate-500">
                                                            Contact Person Name *
                                                        </span>
                                                        <Input
                                                            className="h-9 py-1 text-xs"
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

                                                <div className="flex justify-end gap-2 pt-1">
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 text-[11px]"
                                                        onClick={() => setIsEditingAddress(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        className="h-8 text-[11px]"
                                                        disabled={
                                                            updateConsignee.isPending ||
                                                            !isCorporateDeliveryAddressValid({
                                                                contactPersonName: consigneeName,
                                                                mobileNumber: consigneePhone,
                                                                deliveryAddress: consigneeAddress,
                                                                deliveryCity: consigneeCity,
                                                                deliveryPincode: consigneePincode,
                                                                deliveryCountry: consigneeCountry,
                                                            })
                                                        }
                                                        onClick={() => {
                                                            updateConsignee.mutate({
                                                                corporateOrderId: initialData.id,
                                                                orderId: initialData.id,
                                                                contactPersonName: consigneeName.trim(),
                                                                mobileNumber: consigneePhone.trim(),
                                                                deliveryAddress: consigneeAddress.trim(),
                                                                deliveryCity: consigneeCity.trim(),
                                                                deliveryState:
                                                                    consigneeState.trim() || undefined,
                                                                deliveryPincode: consigneePincode.trim(),
                                                                deliveryCountry:
                                                                    consigneeCountry.trim() || "India",
                                                            } as any);
                                                        }}
                                                    >
                                                        {updateConsignee.isPending ? "Saving..." : "Save Address"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <DataTable
                                                rows={[
                                                    [
                                                        "Company",
                                                        initialData.companyName,
                                                    ],
                                                    [
                                                        "Contact person",
                                                        initialData.contactPersonName,
                                                    ],
                                                    [
                                                        "Email",
                                                        initialData.emailAddress,
                                                    ],
                                                    [
                                                        "Phone",
                                                        initialData.mobileNumber,
                                                    ],
                                                    [
                                                        "GST number",
                                                        initialData.gstNumber ||
                                                            "Not provided",
                                                    ],
                                                    [
                                                        "Supplier brand",
                                                        initialData.brand?.name ??
                                                            "Not assigned",
                                                    ],
                                                    [
                                                        "Employees",
                                                        String(
                                                            initialData.numberOfEmployees ??
                                                                companySnapshot.numberOfEmployees ??
                                                                "—"
                                                        ),
                                                    ],
                                                    [
                                                        "Delivery address",
                                                        formatCorporateDeliveryAddress(
                                                            initialData
                                                        ) ||
                                                            "No delivery address captured",
                                                    ],
                                                ]}
                                            />
                                        )}
                                        {!initialData.quoteId ? (
                                            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                                                <select
                                                    className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-xs"
                                                    value={selectedBrandId}
                                                    onChange={(event) =>
                                                        setSelectedBrandId(
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select supplier brand
                                                    </option>
                                                    {brandOptions
                                                        .filter(
                                                            (brand) =>
                                                                brand.isActive
                                                        )
                                                        .map((brand) => (
                                                            <option
                                                                key={brand.id}
                                                                value={brand.id}
                                                            >
                                                                {brand.name}
                                                            </option>
                                                        ))}
                                                </select>
                                                <Input
                                                    className="h-9 text-xs"
                                                    placeholder="Assignment note (optional)"
                                                    value={brandAssignmentNote}
                                                    onChange={(event) =>
                                                        setBrandAssignmentNote(
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                                <Button
                                                    className="h-9 text-xs"
                                                    onClick={() => {
                                                        if (!selectedBrandId) {
                                                            toast.error(
                                                                "Select a supplier brand first"
                                                            );
                                                            return;
                                                        }
                                                        assignBrand.mutate({
                                                            corporateOrderId:
                                                                initialData.id,
                                                            brandId:
                                                                selectedBrandId,
                                                            note:
                                                                brandAssignmentNote ||
                                                                undefined,
                                                        });
                                                    }}
                                                    disabled={
                                                        assignBrand.isPending ||
                                                        !selectedBrandId
                                                    }
                                                >
                                                    {assignBrand.isPending
                                                        ? "Saving..."
                                                        : "Save brand"}
                                                </Button>
                                            </div>
                                        ) : null}
                                    </SnapshotSection>
                                ) : null}

                                {activeDetailTab === "product" ? (
                                    <SnapshotSection title="Product Configuration">
                                        <DataTable
                                            rows={[
                                                [
                                                    "Product type",
                                                    productType ||
                                                        "Not selected",
                                                ],
                                                [
                                                    "GSM",
                                                    gsmLabel || "Not selected",
                                                ],
                                                [
                                                    "Fabric composition",
                                                    fabricComposition ||
                                                        "Not selected",
                                                ],
                                                [
                                                    "Quantity",
                                                    String(
                                                        initialData.quantity ??
                                                            "—"
                                                    ),
                                                ],
                                            ]}
                                        />
                                        {selectedColors.length ? (
                                            <ChipGroup
                                                label="Selected Colors"
                                                values={selectedColors}
                                            />
                                        ) : null}
                                        {sizeBreakdown.length ? (
                                            <MetricStrip
                                                label="Size Breakdown"
                                                items={sizeBreakdown.map(
                                                    ([size, count]) => ({
                                                        label: size,
                                                        value: String(count),
                                                    })
                                                )}
                                            />
                                        ) : null}
                                    </SnapshotSection>
                                ) : null}

                                {activeDetailTab === "product" ? (
                                    <SnapshotSection title="Branding & Customization">
                                        <DataTable
                                            rows={[
                                                [
                                                    "Print method",
                                                    printMethod ||
                                                        "Not selected",
                                                ],
                                                [
                                                    "Payment preference",
                                                    convertValueToLabel(
                                                        String(
                                                            brandingSnapshot.paymentPreference ??
                                                                "partial_advance"
                                                        )
                                                    ),
                                                ],
                                            ]}
                                        />
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
                                ) : null}

                                {activeDetailTab === "overview" ? (
                                    <SnapshotSection title="Commercial Summary">
                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                            <SnapshotMoneyCard
                                                label="Subtotal"
                                                value={
                                                    initialData.subtotalPaise
                                                }
                                            />
                                            <SnapshotMoneyCard
                                                label="Customization"
                                                value={
                                                    initialData.customizationPaise
                                                }
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
                                ) : null}
                            </div>
                        </Panel>
                    ) : null}

                    {activeDetailTab === "documents" ? (
                        <Panel title="Corporate Document Chain">
                            <CorporateDocumentChainPanel order={initialData} />
                        </Panel>
                    ) : null}

                    {activeDetailTab === "documents" ? (
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
                                {initialData.advancePaidPaise > 0 ? (
                                    <a
                                        href={`/api/corporate-orders/${initialData.id}/receipt-voucher.pdf`}
                                        className="ml-4 inline-flex font-semibold text-sky-700 underline-offset-4 hover:underline"
                                    >
                                        Download receipt voucher
                                    </a>
                                ) : null}
                                {initialData.taxInvoice ? (
                                    <a
                                        href={`/api/corporate-orders/${initialData.id}/invoice.pdf`}
                                        className="ml-4 inline-flex font-semibold text-sky-700 underline-offset-4 hover:underline"
                                    >
                                        Download tax invoice
                                    </a>
                                ) : null}
                            </div>
                        </Panel>
                    ) : null}

                    {activeDetailTab === "payments" ? (
                        <Panel title="Payment Ledger">
                            {initialData.payments?.length ? (
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full min-w-[620px] text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    Date
                                                </th>
                                                <th className="px-3 py-2">
                                                    Type
                                                </th>
                                                <th className="px-3 py-2">
                                                    Mode
                                                </th>
                                                <th className="px-3 py-2">
                                                    Reference
                                                </th>
                                                <th className="px-3 py-2">
                                                    Status
                                                </th>
                                                <th className="px-3 py-2 text-right">
                                                    Amount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {initialData.payments.map(
                                                (payment: any) => (
                                                    <tr
                                                        key={payment.id}
                                                        className="border-t border-slate-100"
                                                    >
                                                        <td className="px-3 py-2">
                                                            {new Date(
                                                                payment.paymentDate ??
                                                                    payment.createdAt
                                                            ).toLocaleDateString(
                                                                "en-IN"
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {convertValueToLabel(
                                                                payment.paymentType
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {convertValueToLabel(
                                                                payment.paymentMode
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 font-medium">
                                                            {
                                                                payment.paymentReference
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {convertValueToLabel(
                                                                payment.paymentStatus
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-semibold">
                                                            {formatINR(
                                                                payment.amountPaise
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    No verified payments recorded. The full
                                    order value remains due.
                                </p>
                            )}
                        </Panel>
                    ) : null}

                    {activeDetailTab === "activity" ? (
                        <Panel title="Status Timeline">
                            {initialData.statusHistory?.length ? (
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full min-w-[560px] text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2">
                                                    Status
                                                </th>
                                                <th className="px-3 py-2">
                                                    Date
                                                </th>
                                                <th className="px-3 py-2">
                                                    Note
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {initialData.statusHistory.map(
                                                (item: any) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-t border-slate-100"
                                                    >
                                                        <td className="px-3 py-2 font-semibold text-slate-900">
                                                            {convertValueToLabel(
                                                                item.toStatus
                                                            )}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                                                            {new Date(
                                                                item.createdAt
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600">
                                                            {item.note || "—"}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    No status changes recorded yet.
                                </p>
                            )}
                        </Panel>
                    ) : null}
                </div>

                {hasActionSidebar ? (
                    <div className="space-y-4">
                        {activeDetailTab === "activity" ? (
                            <Panel title="Update Status">
                                <div className="space-y-3">
                                    <select
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                    >
                                        <option value="inquiry_received">
                                            Inquiry Received
                                        </option>
                                        <option value="under_review">
                                            Under Review
                                        </option>
                                        <option value="approved">
                                            Approved
                                        </option>
                                        <option value="in_production">
                                            In Production
                                        </option>
                                        <option value="quality_check">
                                            Quality Check
                                        </option>
                                        <option value="ready_for_dispatch">
                                            Ready for Dispatch
                                        </option>
                                        <option value="dispatched">
                                            Dispatched
                                        </option>
                                        <option value="delivered">
                                            Delivered
                                        </option>
                                        <option value="completed">
                                            Completed
                                        </option>
                                    </select>
                                    <textarea
                                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                                        placeholder="Optional note for the status change"
                                        value={statusNote}
                                        onChange={(e) =>
                                            setStatusNote(e.target.value)
                                        }
                                    />
                                    <Button
                                        onClick={() =>
                                            updateStatus.mutate({
                                                corporateOrderId:
                                                    initialData.id,
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
                        ) : null}

                        {activeDetailTab === "payments" ? (
                            <Panel title="Balance Payment Actions">
                                <div className="space-y-3">
                                    <Input
                                        value={customerPaymentPageHref}
                                        readOnly
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            sendReminder.mutate({
                                                corporateOrderId:
                                                    initialData.id,
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
                        ) : null}

                        {activeDetailTab === "activity" ? (
                            canManageShipment ? (
                                <Panel title="Shipment Workspace">
                                    <div className="space-y-3">
                                        <select
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            value={shipmentProvider}
                                            onChange={(e) =>
                                                setShipmentProvider(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="manual">
                                                Manual shipment
                                            </option>
                                            <option value="delhivery">
                                                Delhivery
                                            </option>
                                        </select>
                                        <Input
                                            placeholder="Courier name"
                                            value={shipmentCourierName}
                                            onChange={(e) =>
                                                setShipmentCourierName(
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            placeholder="Tracking number"
                                            value={shipmentTrackingNumber}
                                            onChange={(e) =>
                                                setShipmentTrackingNumber(
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            placeholder="AWB number"
                                            value={shipmentAwbNumber}
                                            onChange={(e) =>
                                                setShipmentAwbNumber(
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <Input
                                            placeholder="Tracking URL"
                                            value={shipmentTrackingUrl}
                                            onChange={(e) =>
                                                setShipmentTrackingUrl(
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Input
                                                type="date"
                                                value={shipmentDispatchDate}
                                                onChange={(e) =>
                                                    setShipmentDispatchDate(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Input
                                                type="date"
                                                value={shipmentDeliveryDate}
                                                onChange={(e) =>
                                                    setShipmentDeliveryDate(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <select
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            value={shipmentStatus}
                                            onChange={(e) =>
                                                setShipmentStatus(
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="ready">Ready</option>
                                            <option value="dispatched">
                                                Dispatched
                                            </option>
                                            <option value="in_transit">
                                                In Transit
                                            </option>
                                            <option value="delivered">
                                                Delivered
                                            </option>
                                            <option value="failed">
                                                Failed
                                            </option>
                                        </select>
                                        <Button
                                            onClick={() =>
                                                saveShipment.mutate({
                                                    orderId: initialData.id,
                                                    courierName:
                                                        shipmentCourierName ||
                                                        null,
                                                    trackingNumber:
                                                        shipmentTrackingNumber ||
                                                        null,
                                                    awbNumber:
                                                        shipmentAwbNumber ||
                                                        null,
                                                    trackingUrl:
                                                        shipmentTrackingUrl ||
                                                        null,
                                                    dispatchDate:
                                                        shipmentDispatchDate ||
                                                        null,
                                                    deliveryDate:
                                                        shipmentDeliveryDate ||
                                                        null,
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
                                                    Once the brand marks the
                                                    order ready, admin can add
                                                    this shipment to the
                                                    Delhivery pickup flow from
                                                    here.
                                                </p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    <Input
                                                        type="date"
                                                        value={pickupDate}
                                                        onChange={(e) =>
                                                            setPickupDate(
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                    <select
                                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                        value={pickupTime}
                                                        onChange={(e) =>
                                                            setPickupTime(
                                                                e.target.value
                                                            )
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
                                                    value={
                                                        delhiveryPickupLocation
                                                    }
                                                    readOnly
                                                />
                                                <Button
                                                    className="mt-3"
                                                    variant="outline"
                                                    onClick={
                                                        scheduleDelhiveryPickup
                                                    }
                                                    disabled={
                                                        saveShipment.isPending
                                                    }
                                                >
                                                    Add to Pickup
                                                </Button>
                                            </div>
                                        ) : null}

                                        {initialData.shipment?.trackingUrl ? (
                                            <a
                                                href={
                                                    initialData.shipment
                                                        .trackingUrl
                                                }
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
                                        Shipment tools unlock after the brand
                                        moves this order to{" "}
                                        <span className="font-medium">
                                            Ready for Dispatch
                                        </span>
                                        .
                                    </p>
                                </Panel>
                            )
                        ) : null}
                    </div>
                ) : null}
            </section>
        </div>
    );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-900">{title}</h2>
            <div className="mt-2.5">{children}</div>
        </section>
    );
}

function DetailCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function FileRow({ label, file }: { label: string; file: any }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
            <div>
                <p className="font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">
                    {file?.name ?? "Missing"}
                </p>
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

function DataTable({ rows }: { rows: Array<[string, string]> }) {
    return (
        <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full table-fixed text-left text-xs">
                <tbody>
                    {rows.map(([label, value]) => (
                        <tr
                            key={label}
                            className="border-t border-slate-100 first:border-t-0"
                        >
                            <th className="w-32 bg-slate-50 px-3 py-2 align-top text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:w-40">
                                {label}
                            </th>
                            <td className="min-w-0 break-words px-3 py-2 font-medium leading-5 text-slate-800 [overflow-wrap:anywhere]">
                                {value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SnapshotSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="border-b border-slate-100 pb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-800">
                    {title}
                </h3>
                {description ? (
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                        {description}
                    </p>
                ) : null}
            </div>
            <div className="mt-3">{children}</div>
        </div>
    );
}

function ChipGroup({ label, values }: { label: string; values: string[] }) {
    return (
        <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
                {values.map((value) => (
                    <span
                        key={value}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700"
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
            <div className="mt-1.5 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2 text-right">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr
                                key={`${item.label}-${item.value}`}
                                className="border-t border-slate-100"
                            >
                                <td className="px-3 py-2 text-slate-600">
                                    {item.label}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-900">
                                    {item.value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SnapshotMoneyCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
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
        .filter((item): item is { label: string; value: string } =>
            Boolean(item)
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

function readStringValue(value: unknown) {
    return typeof value === "string" ? value : "";
}

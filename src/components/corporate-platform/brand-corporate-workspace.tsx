"use client";

import { BrandTaxInvoiceForm } from "@/components/corporate-platform/brand-tax-invoice-form";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, formatINR, handleClientError } from "@/lib/utils";
import { Download, ExternalLink, ImageIcon } from "lucide-react";
import { useState } from "react";

type OrderDraftState = Record<
    string,
    {
        status: string;
        note: string;
    }
>;

export function BrandCorporateWorkspace({
    brandId,
    initialData,
}: {
    brandId: string;
    initialData: any;
}) {
    const utils = trpc.useUtils();
    const [drafts, setDrafts] = useState<OrderDraftState>({});
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const { data } =
        trpc.general.corporatePlatform.listBrandAssignedOrders.useQuery(
            {
                brandId,
            },
            {
                initialData,
            }
        );

    const updateStatus =
        trpc.general.corporatePlatform.updateBrandAssignedOrderStatus.useMutation(
            {
                onSuccess: async () => {
                    setDrafts((current) => {
                        const next = { ...current };
                        delete next[updateStatus.variables?.orderId ?? ""];
                        return next;
                    });
                    await utils.general.corporatePlatform.listBrandAssignedOrders.invalidate(
                        {
                            brandId,
                        }
                    );
                },
                onError: (error) => handleClientError(error),
            }
        );

    const orders = data?.orders ?? [];
    const allowedStatuses = data?.allowedStatuses ?? [];
    const recipientGstin = data?.recipientGstin ?? null;

    const selectedOrder =
        orders.find((order: any) => order.id === selectedOrderId) ?? null;

    const setDraft = (
        orderId: string,
        orderStatus: string,
        patch: Partial<OrderDraftState[string]>
    ) => {
        setDrafts((current) => ({
            ...current,
            [orderId]: {
                status: current[orderId]?.status ?? orderStatus,
                note: current[orderId]?.note ?? "",
                ...patch,
            },
        }));
    };

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    label="Corporate Orders"
                    value={String(orders.length)}
                />
                <MetricCard
                    label="Active Production"
                    value={String(
                        orders.filter((order: any) =>
                            [
                                "approved",
                                "in_production",
                                "quality_check",
                            ].includes(order.status)
                        ).length
                    )}
                />
                <MetricCard
                    label="Delivered Orders"
                    value={String(
                        orders.filter((order: any) =>
                            ["delivered", "completed"].includes(order.status)
                        ).length
                    )}
                />
            </section>

            <section className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Corporate Orders
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Quote-based and self-service corporate orders
                            assigned to this brand.
                        </p>
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3">Quantity</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length ? (
                                orders.map((order: any) => (
                                    <tr
                                        key={order.id}
                                        className={`border-t border-slate-100 ${
                                            selectedOrderId === order.id
                                                ? "bg-sky-50/40"
                                                : "bg-white"
                                        }`}
                                    >
                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                            {order.publicOrderId}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                {order.source === "self_service"
                                                    ? "Self-service"
                                                    : "Quote-based"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {order.quantity}
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
                                            <button
                                                type="button"
                                                className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                onClick={() =>
                                                    setSelectedOrderId(order.id)
                                                }
                                            >
                                                View details
                                            </button>
                                            {[
                                                "ready_for_dispatch",
                                                "dispatched",
                                                "delivered",
                                                "completed",
                                            ].includes(order.status) ? (
                                                <div className="mt-2 text-xs font-medium text-slate-500">
                                                    {order.status ===
                                                    "ready_for_dispatch"
                                                        ? "Admin notified"
                                                        : "Dispatch workflow updated"}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="mt-2 block font-semibold text-emerald-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                    disabled={
                                                        updateStatus.isPending
                                                    }
                                                    onClick={() =>
                                                        updateStatus.mutate({
                                                            brandId,
                                                            orderId: order.id,
                                                            toStatus:
                                                                "ready_for_dispatch",
                                                            note: "Brand marked the order complete and ready for dispatch.",
                                                        })
                                                    }
                                                >
                                                    {updateStatus.isPending
                                                        ? "Updating..."
                                                        : "Notify admin: Ready for dispatch"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        className="px-4 py-8 text-center text-slate-500"
                                        colSpan={6}
                                    >
                                        No corporate orders have been assigned
                                        to this brand yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {selectedOrder ? (
                <BrandOrderDetailPanel
                    key={selectedOrder.id}
                    brandId={brandId}
                    order={selectedOrder}
                    recipientGstin={recipientGstin}
                    allowedStatuses={allowedStatuses}
                    draft={drafts[selectedOrder.id]}
                    onDraftChange={setDraft}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdateStatus={(payload) => updateStatus.mutate(payload)}
                    isUpdating={updateStatus.isPending}
                />
            ) : null}
        </div>
    );
}

function BrandOrderDetailPanel({
    brandId,
    order,
    recipientGstin,
    allowedStatuses,
    draft,
    onDraftChange,
    onClose,
    onUpdateStatus,
    isUpdating,
}: {
    brandId: string;
    order: any;
    recipientGstin?: string | null;
    allowedStatuses: string[];
    draft?: { status: string; note: string };
    onDraftChange: (
        orderId: string,
        orderStatus: string,
        patch: Partial<{ status: string; note: string }>
    ) => void;
    onClose: () => void;
    onUpdateStatus: (payload: {
        brandId: string;
        orderId: string;
        toStatus: any;
        note?: string;
    }) => void;
    isUpdating: boolean;
}) {
    const utils = trpc.useUtils();
    const selectedStatus = draft?.status ?? order.status;
    const note = draft?.note ?? "";
    const statusOptions = allowedStatuses.includes(order.status)
        ? allowedStatuses
        : [order.status, ...allowedStatuses];

    return (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Order Details
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                        {order.publicOrderId}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Status: {convertValueToLabel(order.status)}
                    </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>

            <div className="mt-5">
                <DataCard label="Quantity" value={String(order.quantity)} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_360px]">
                <div className="space-y-4">
                    {order.renivetPurchaseOrder ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                        Fulfillment Order (FO)
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                        {(order.renivetPurchaseOrder as any).foNumber ||
                                            order.renivetPurchaseOrder.poNumber}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatINR(
                                            order.renivetPurchaseOrder
                                                .totalAmountPaise,
                                            { keepDecimals: true }
                                        )}
                                        {order.renivetPurchaseOrder
                                            .expectedDeliveryDate
                                            ? ` · Delivery ${new Date(
                                                  order.renivetPurchaseOrder.expectedDeliveryDate
                                              ).toLocaleDateString("en-IN")}`
                                            : ""}
                                    </p>
                                </div>
                                <a
                                    href={
                                        `/api/corporate-orders/${order.id}/fulfillment-order.pdf`
                                    }
                                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Download className="size-4" />
                                    Download FO
                                </a>
                            </div>
                        </div>
                    ) : null}

                    {order.renivetPurchaseOrder && !order.brandTaxInvoice ? (
                        <BrandTaxInvoiceForm
                            brandId={brandId}
                            orderId={order.id}
                            vendorPurchaseOrderId={
                                order.renivetPurchaseOrder.id
                            }
                            expectedTotalPaise={
                                order.renivetPurchaseOrder.totalAmountPaise
                            }
                            recipientGstin={recipientGstin}
                            onComplete={async () => {
                                await utils.general.corporatePlatform.listBrandAssignedOrders.invalidate(
                                    { brandId }
                                );
                            }}
                        />
                    ) : null}

                    {order.brandTaxInvoice ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-900">
                                    Supplier tax invoice
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {order.brandTaxInvoice.invoiceNumber} ·{" "}
                                    {convertValueToLabel(
                                        order.brandTaxInvoice.validationStatus
                                    )}
                                </p>
                            </div>
                            <a
                                href={order.brandTaxInvoice.downloadUrl}
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Download className="size-4" />
                                Download invoice
                            </a>
                        </div>
                    ) : null}

                    {/* Customer Tax Invoice (Doc 5: Brand -> Corporate Customer) */}
                    {(order as any).customerTaxInvoice ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-slate-900">
                                        Tax invoice (Customer copy)
                                    </p>
                                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                        B2B Rule 46
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {(order as any).customerTaxInvoice.invoiceNumber} ·{" "}
                                    {formatINR((order as any).customerTaxInvoice.totalAmountPaise, { keepDecimals: true })}
                                </p>
                            </div>
                            <a
                                href={(order as any).customerTaxInvoice.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Download className="size-4" />
                                Download Tax invoice
                            </a>
                        </div>
                    ) : null}

                    {/* Settlement Statement (Doc 7: Renivet -> Brand) */}
                    {(order as any).settlementStatement ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-slate-900">
                                        Settlement statement
                                    </p>
                                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                        Settlement Waterfall
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {(order as any).settlementStatement.statementNumber} · Net Remittance:{" "}
                                    <span className="font-semibold text-slate-900">
                                        {formatINR((order as any).settlementStatement.netRemittancePaise, { keepDecimals: true })}
                                    </span>
                                </p>
                            </div>
                            <a
                                href={(order as any).settlementStatement.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                <Download className="size-4" />
                                Download Settlement
                            </a>
                        </div>
                    ) : null}

                    {/* Customer Logo & Artwork Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Customer Logo & Artwork
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Artwork files and placement specifications for manufacturing
                                </p>
                            </div>
                            {(order as any).artworkFile?.url ? (
                                <a
                                    href={(order as any).artworkFile.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={(order as any).artworkFile.name || "logo-artwork.png"}
                                    className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
                                >
                                    <Download className="size-4" />
                                    Download Logo (PNG)
                                </a>
                            ) : null}
                        </div>

                        {(order as any).artworkFile?.url ? (
                            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={(order as any).artworkFile.url}
                                        alt={(order as any).artworkFile.name || "Logo preview"}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                        {(order as any).artworkFile.name || "Customer Logo / Artwork"}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        {(order as any).brandingConfig?.printMethod ? (
                                            <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                                Print Method: {(order as any).brandingConfig.printMethod}
                                            </span>
                                        ) : null}
                                        {(order as any).brandingConfig?.logoLocations?.length ? (
                                            <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                                                Placements: {(order as any).brandingConfig.logoLocations.join(", ")}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <a
                                            href={(order as any).artworkFile.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                                        >
                                            <ExternalLink className="size-3.5" />
                                            View original file
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                                    <ImageIcon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-700">
                                        No custom artwork/logo file attached to this order
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Standard merchandise or pending custom upload from platform operations.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Garment Setup
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <DataCard
                                label="Product Type"
                                value={
                                    order.selectedGarment?.productType ??
                                    "Pending"
                                }
                            />
                            <DataCard
                                label="GSM"
                                value={order.selectedGarment?.gsm ?? "Pending"}
                            />
                            <DataCard
                                label="Composition"
                                value={
                                    order.selectedGarment?.fabricComposition ??
                                    "Pending"
                                }
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Size Breakdown
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(order.sizeBreakdown ?? {}).map(
                                ([size, count]) => (
                                    <span
                                        key={size}
                                        className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700"
                                    >
                                        {size}: {String(count)}
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Employee Sizes
                            </p>
                            <p className="text-xs text-slate-500">
                                Names are masked for the brand workspace
                            </p>
                        </div>

                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3">
                                            Employee Code
                                        </th>
                                        <th className="px-4 py-3">Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.employeeRows?.length ? (
                                        order.employeeRows.map((row: any) => (
                                            <tr
                                                key={`${order.id}-${row.employeeCode}-${row.size}`}
                                                className="border-t border-slate-100"
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {row.employeeCode}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    {row.size}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={2}
                                                className="px-4 py-6 text-slate-500"
                                            >
                                                Employee sizing has not been
                                                uploaded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Update Status
                        </p>
                        <div className="mt-3 space-y-3">
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={selectedStatus}
                                onChange={(e) =>
                                    onDraftChange(order.id, order.status, {
                                        status: e.target.value,
                                    })
                                }
                            >
                                {statusOptions.map((status: string) => (
                                    <option key={status} value={status}>
                                        {convertValueToLabel(status)}
                                    </option>
                                ))}
                            </select>
                            <textarea
                                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Optional production note"
                                value={note}
                                onChange={(e) =>
                                    onDraftChange(order.id, order.status, {
                                        note: e.target.value,
                                    })
                                }
                            />
                            <Button
                                className="w-full"
                                disabled={isUpdating}
                                onClick={() =>
                                    onUpdateStatus({
                                        brandId,
                                        orderId: order.id,
                                        toStatus: selectedStatus,
                                        note: note || undefined,
                                    })
                                }
                            >
                                {isUpdating
                                    ? "Saving..."
                                    : "Update Order Status"}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Timeline
                        </p>
                        <div className="mt-3 space-y-3">
                            {order.statusHistory?.length ? (
                                order.statusHistory.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-slate-200 bg-white p-3"
                                    >
                                        <p className="font-medium text-slate-900">
                                            {convertValueToLabel(item.toStatus)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleString("en-IN")}
                                        </p>
                                        {item.note ? (
                                            <p className="mt-2 text-sm text-slate-600">
                                                {item.note}
                                            </p>
                                        ) : null}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">
                                    No status updates recorded yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
                {value}
            </p>
        </div>
    );
}

function DataCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

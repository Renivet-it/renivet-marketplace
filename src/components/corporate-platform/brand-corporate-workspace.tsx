"use client";

import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertValueToLabel,
    formatINR,
    handleClientError,
} from "@/lib/utils";
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
    const { data } = trpc.general.corporatePlatform.listBrandAssignedOrders.useQuery(
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
                <MetricCard label="Corporate Orders" value={String(orders.length)} />
                <MetricCard
                    label="Active Production"
                    value={String(
                        orders.filter((order: any) =>
                            ["approved", "in_production", "quality_check"].includes(
                                order.status
                            )
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
                            Final brand-assigned corporate orders in a clean review table.
                        </p>
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3">Order ID</th>
                                <th className="px-4 py-3">Quantity</th>
                                <th className="px-4 py-3">Total Value</th>
                                <th className="px-4 py-3">Advance Paid</th>
                                <th className="px-4 py-3">Balance Due</th>
                                <th className="px-4 py-3">Payment</th>
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
                                            {convertValueToLabel(order.paymentStatus)}
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
                                            <button
                                                type="button"
                                                className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                                onClick={() => setSelectedOrderId(order.id)}
                                            >
                                                View details
                                            </button>
                                            {["ready_for_dispatch", "dispatched", "delivered", "completed"].includes(
                                                order.status
                                            ) ? (
                                                <div className="mt-2 text-xs font-medium text-slate-500">
                                                    {order.status === "ready_for_dispatch"
                                                        ? "Admin notified"
                                                        : "Dispatch workflow updated"}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="mt-2 block font-semibold text-emerald-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                    disabled={updateStatus.isPending}
                                                    onClick={() =>
                                                        updateStatus.mutate({
                                                            brandId,
                                                            orderId: order.id,
                                                            toStatus: "ready_for_dispatch",
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
                                        colSpan={9}
                                    >
                                        No final corporate orders have reached this brand yet.
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
    allowedStatuses,
    draft,
    onDraftChange,
    onClose,
    onUpdateStatus,
    isUpdating,
}: {
    brandId: string;
    order: any;
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
                        {" | "}Payment: {convertValueToLabel(order.paymentStatus)}
                    </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DataCard label="Quantity" value={String(order.quantity)} />
                <DataCard label="Total Value" value={formatINR(order.totalPaise)} />
                <DataCard
                    label="Advance Paid"
                    value={formatINR(order.advancePaidPaise)}
                />
                <DataCard
                    label="Balance Due"
                    value={formatINR(order.balanceDuePaise)}
                />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_360px]">
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Garment Setup
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <DataCard
                                label="Product Type"
                                value={order.selectedGarment?.productType ?? "Pending"}
                            />
                            <DataCard
                                label="GSM"
                                value={order.selectedGarment?.gsm ?? "Pending"}
                            />
                            <DataCard
                                label="Composition"
                                value={
                                    order.selectedGarment?.fabricComposition ?? "Pending"
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
                                        <th className="px-4 py-3">Employee Code</th>
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
                                                Employee sizing has not been uploaded yet.
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
                                {isUpdating ? "Saving..." : "Update Order Status"}
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
                                            {new Date(item.createdAt).toLocaleString(
                                                "en-IN"
                                            )}
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
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
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

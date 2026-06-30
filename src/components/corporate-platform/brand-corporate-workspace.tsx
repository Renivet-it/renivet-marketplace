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
                            Brand members can review assigned production orders,
                            update workflow status, and see masked employee sizing only.
                        </p>
                    </div>
                </div>

                <div className="mt-4 space-y-4">
                    {orders.length ? (
                        orders.map((order: any) => {
                            const selectedStatus =
                                drafts[order.id]?.status ?? order.status;
                            const note = drafts[order.id]?.note ?? "";
                            const statusOptions = allowedStatuses.includes(order.status)
                                ? allowedStatuses
                                : [order.status, ...allowedStatuses];

                            return (
                                <div
                                    key={order.id}
                                    className="rounded-2xl border border-slate-200 p-5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Final corporate order
                                            </p>
                                            <h3 className="mt-2 text-xl font-semibold text-slate-900">
                                                {order.publicOrderId}
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Order status:{" "}
                                                <span className="font-medium text-slate-800">
                                                    {convertValueToLabel(order.status)}
                                                </span>
                                                {" | "}
                                                Payment:{" "}
                                                <span className="font-medium text-slate-800">
                                                    {convertValueToLabel(order.paymentStatus)}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="grid min-w-[280px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <DataCard
                                                label="Quantity"
                                                value={String(order.quantity)}
                                            />
                                            <DataCard
                                                label="Total Value"
                                                value={formatINR(order.totalPaise)}
                                            />
                                            <DataCard
                                                label="Advance Paid"
                                                value={formatINR(order.advancePaidPaise)}
                                            />
                                            <DataCard
                                                label="Balance Due"
                                                value={formatINR(order.balanceDuePaise)}
                                            />
                                        </div>
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
                                                        value={
                                                            order.selectedGarment
                                                                ?.productType ??
                                                            "Pending"
                                                        }
                                                    />
                                                    <DataCard
                                                        label="GSM"
                                                        value={
                                                            order.selectedGarment?.gsm ??
                                                            "Pending"
                                                        }
                                                    />
                                                    <DataCard
                                                        label="Composition"
                                                        value={
                                                            order.selectedGarment
                                                                ?.fabricComposition ??
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
                                                    {Object.entries(
                                                        order.sizeBreakdown ?? {}
                                                    ).map(([size, count]) => (
                                                        <span
                                                            key={size}
                                                            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700"
                                                        >
                                                            {size}: {String(count)}
                                                        </span>
                                                    ))}
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
                                                                <th className="px-4 py-3">
                                                                    Size
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.employeeRows?.length ? (
                                                                order.employeeRows.map(
                                                                    (row: any) => (
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
                                                                    )
                                                                )
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

                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Update Status
                                            </p>
                                            <div className="mt-3 space-y-3">
                                                <select
                                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    value={selectedStatus}
                                                    onChange={(e) =>
                                                        setDraft(order.id, order.status, {
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
                                                        setDraft(order.id, order.status, {
                                                            note: e.target.value,
                                                        })
                                                    }
                                                />
                                                <Button
                                                    className="w-full"
                                                    disabled={updateStatus.isPending}
                                                    onClick={() =>
                                                        updateStatus.mutate({
                                                            brandId,
                                                            orderId: order.id,
                                                            toStatus: selectedStatus as any,
                                                            note: note || undefined,
                                                        })
                                                    }
                                                >
                                                    {updateStatus.isPending
                                                        ? "Saving..."
                                                        : "Update Order Status"}
                                                </Button>
                                            </div>

                                            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                                                                    {convertValueToLabel(
                                                                        item.toStatus
                                                                    )}
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
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                            No final corporate orders have reached this brand yet.
                        </div>
                    )}
                </div>
            </section>
        </div>
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

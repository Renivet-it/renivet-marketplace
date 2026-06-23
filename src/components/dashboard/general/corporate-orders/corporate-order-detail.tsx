"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, formatINR, handleClientError } from "@/lib/utils";
import type { ReactNode } from "react";
import { useState } from "react";

export function CorporateOrderDetail({ initialData }: { initialData: any }) {
    const [status, setStatus] = useState(initialData.status);
    const [statusNote, setStatusNote] = useState("");
    const [balancePaymentLink, setBalancePaymentLink] = useState(
        initialData.balancePaymentLink ?? ""
    );
    const [balancePaymentNotes, setBalancePaymentNotes] = useState(
        initialData.balancePaymentNotes ?? ""
    );
    const utils = trpc.useUtils();
    const updateStatus =
        trpc.general.corporateOrders.updateStatus.useMutation({
            onSuccess: async () => {
                await utils.general.corporateOrders.getOrderById.invalidate({
                    corporateOrderId: initialData.id,
                });
            },
            onError: (error) => handleClientError(error),
        });
    const saveBalanceLink =
        trpc.general.corporateOrders.saveBalancePaymentLink.useMutation({
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
                        <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
                            {JSON.stringify(
                                {
                                    companySnapshot: initialData.companySnapshot,
                                    productConfigSnapshot:
                                        initialData.productConfigSnapshot,
                                    brandingConfigSnapshot:
                                        initialData.brandingConfigSnapshot,
                                    pricingSnapshot: initialData.pricingSnapshot,
                                },
                                null,
                                2
                            )}
                        </pre>
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

                    <Panel title="Balance Payment Tracking">
                        <div className="space-y-3">
                            <Input
                                placeholder="https://rzp.io/..."
                                value={balancePaymentLink}
                                onChange={(e) =>
                                    setBalancePaymentLink(e.target.value)
                                }
                            />
                            <textarea
                                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Notes for the balance payment"
                                value={balancePaymentNotes}
                                onChange={(e) =>
                                    setBalancePaymentNotes(e.target.value)
                                }
                            />
                            <Button
                                onClick={() =>
                                    saveBalanceLink.mutate({
                                        corporateOrderId: initialData.id,
                                        balancePaymentLink,
                                        balancePaymentNotes:
                                            balancePaymentNotes || undefined,
                                    })
                                }
                                disabled={saveBalanceLink.isPending}
                            >
                                {saveBalanceLink.isPending
                                    ? "Saving..."
                                    : "Save Balance Link"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    sendReminder.mutate({
                                        corporateOrderId: initialData.id,
                                    })
                                }
                                disabled={
                                    sendReminder.isPending ||
                                    !initialData.balanceDuePaise ||
                                    !balancePaymentLink
                                }
                            >
                                {sendReminder.isPending
                                    ? "Sending reminder..."
                                    : "Send Balance Reminder"}
                            </Button>
                        </div>
                    </Panel>

                    <Panel title="Customer and Payment References">
                        <div className="space-y-2 text-sm">
                            <SimpleRow label="Email" value={initialData.emailAddress} />
                            <SimpleRow label="Phone" value={initialData.mobileNumber} />
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
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

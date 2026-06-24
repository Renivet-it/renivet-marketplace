"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function AdminFinanceQueue({ initialData }: { initialData: any }) {
    const utils = trpc.useUtils();
    const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});

    const reviewPo = trpc.general.corporatePlatform.reviewPurchaseOrder.useMutation({
        onSuccess: async () => {
            toast.success("PO reviewed");
            await utils.general.corporatePlatform.listAdminFinance.invalidate();
        },
        onError: (error) => handleClientError(error),
    });

    const recordPayment = trpc.general.corporatePlatform.recordPayment.useMutation({
        onSuccess: async () => {
            toast.success("Payment recorded");
            await utils.general.corporatePlatform.listAdminFinance.invalidate();
        },
        onError: (error) => handleClientError(error),
    });

    const issueProforma = trpc.general.corporatePlatform.issueProformaInvoice.useMutation({
        onSuccess: () => toast.success("Proforma invoice issued"),
        onError: (error) => handleClientError(error),
    });

    const issueTax = trpc.general.corporatePlatform.issueTaxInvoice.useMutation({
        onSuccess: () => toast.success("Tax invoice issued"),
        onError: (error) => handleClientError(error),
    });

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
                <Panel title="Payments">
                    {initialData.payments.slice(0, 8).map((payment: any) => (
                        <Row
                            key={payment.id}
                            title={`${payment.paymentType} • ${payment.paymentStatus}`}
                            meta={formatINR(payment.amountPaise)}
                        />
                    ))}
                </Panel>
                <Panel title="Refunds">
                    {initialData.refunds.slice(0, 8).map((refund: any) => (
                        <Row
                            key={refund.id}
                            title={refund.refundStatus}
                            meta={formatINR(refund.refundAmountPaise)}
                        />
                    ))}
                </Panel>
                <Panel title="Purchase Orders">
                    {initialData.purchaseOrders.slice(0, 8).map((po: any) => (
                        <div key={po.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="font-semibold text-slate-900">{po.poNumber}</div>
                            <div className="mt-1 text-sm text-slate-500">
                                {po.status} • {formatINR(po.poValuePaise)}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    onClick={() =>
                                        reviewPo.mutate({
                                            purchaseOrderId: po.id,
                                            status: "po_accepted",
                                            reviewNotes: "Approved from finance queue",
                                        })
                                    }
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        reviewPo.mutate({
                                            purchaseOrderId: po.id,
                                            status: "po_requires_changes",
                                            reviewNotes: "Needs changes",
                                        })
                                    }
                                >
                                    Needs Changes
                                </Button>
                            </div>
                        </div>
                    ))}
                </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Panel title="Issue Proforma Invoices">
                    {initialData.quotes.slice(0, 8).map((quote: any) => (
                        <div key={quote.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="font-semibold text-slate-900">{quote.quoteNumber}</div>
                            <div className="mt-1 text-sm text-slate-500">
                                {quote.profile?.companyName ?? "Unknown"} • {formatINR(quote.totalAmountPaise)}
                            </div>
                            <Button
                                className="mt-3"
                                variant="outline"
                                onClick={() => issueProforma.mutate({ quoteId: quote.id })}
                            >
                                Issue Proforma
                            </Button>
                        </div>
                    ))}
                </Panel>

                <Panel title="Record Payments and Tax Invoices">
                    {initialData.orders.slice(0, 8).map((order: any) => (
                        <div key={order.id} className="rounded-xl border border-slate-200 p-4">
                            <div className="font-semibold text-slate-900">{order.publicOrderId}</div>
                            <div className="mt-1 text-sm text-slate-500">
                                {order.companyName} • Balance {formatINR(order.balanceDuePaise)}
                            </div>
                            <div className="mt-3 flex gap-2">
                                <Input
                                    placeholder="Amount INR"
                                    type="number"
                                    value={paymentAmounts[order.id] ?? ""}
                                    onChange={(e) =>
                                        setPaymentAmounts((current) => ({
                                            ...current,
                                            [order.id]: e.target.value,
                                        }))
                                    }
                                />
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        recordPayment.mutate({
                                            orderId: order.id,
                                            paymentType: "manual",
                                            paymentMode: "bank_transfer",
                                            amountPaise: Math.round(
                                                Number(paymentAmounts[order.id] ?? 0) * 100
                                            ),
                                            paymentReference: `manual-${order.publicOrderId}`,
                                            paymentStatus: "payment_success",
                                            paymentDate: new Date().toISOString().slice(0, 10),
                                        })
                                    }
                                >
                                    Record
                                </Button>
                                <Button onClick={() => issueTax.mutate({ orderId: order.id })}>
                                    Tax Invoice
                                </Button>
                            </div>
                        </div>
                    ))}
                </Panel>
            </div>
        </div>
    );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <div className="mt-4 space-y-3">{children}</div>
        </div>
    );
}

function Row({ title, meta }: { title: string; meta: string }) {
    return (
        <div className="rounded-xl border border-slate-200 px-4 py-3">
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-500">{meta}</div>
        </div>
    );
}


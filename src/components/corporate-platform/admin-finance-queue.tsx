"use client";

import {
    AdminMetricGrid,
    AdminPanel,
    EmptyQueue,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function AdminFinanceQueue({ initialData }: { initialData: any }) {
    const utils = trpc.useUtils();
    const [paymentAmounts, setPaymentAmounts] = useState<
        Record<string, string>
    >({});
    const [poReviewNotes, setPoReviewNotes] = useState<Record<string, string>>(
        {}
    );
    const quoteIdsWithPurchaseOrders = new Set(
        initialData.purchaseOrders.map((po: any) => po.quoteId).filter(Boolean)
    );
    const quoteIdsWithCreatedOrders = new Set(
        initialData.orders
            .map((order: any) => {
                const match = String(order.internalNotes ?? "").match(
                    /quote:([a-f0-9-]+)/i
                );
                return match?.[1] ?? null;
            })
            .filter(Boolean)
    );
    const approvedQuotesReadyForOrderRelease = initialData.quotes.filter(
        (quote: any) =>
            quote.status === "approved" &&
            !quoteIdsWithPurchaseOrders.has(quote.id) &&
            !quoteIdsWithCreatedOrders.has(quote.id)
    );
    const purchaseOrdersAwaitingDecision = initialData.purchaseOrders.filter(
        (purchaseOrder: any) =>
            ["po_uploaded", "po_review"].includes(purchaseOrder.status)
    );
    const outstandingBalancePaise = initialData.orders.reduce(
        (total: number, order: any) =>
            total + Math.max(0, order.balanceDuePaise ?? 0),
        0
    );
    const recordedCollectionsPaise = initialData.payments.reduce(
        (total: number, payment: any) => total + (payment.amountPaise ?? 0),
        0
    );

    const reviewPo =
        trpc.general.corporatePlatform.reviewPurchaseOrder.useMutation({
            onSuccess: async () => {
                toast.success("Purchase order reviewed");
                await utils.general.corporatePlatform.listAdminFinance.invalidate();
            },
            onError: (error) => handleClientError(error),
        });

    const createOrderFromApprovedQuote =
        trpc.general.corporatePlatform.createOrderFromApprovedQuote.useMutation(
            {
                onSuccess: async (createdOrder) => {
                    toast.success(
                        `Corporate order ${createdOrder.publicOrderId} created from approved quote`
                    );
                    await utils.general.corporatePlatform.listAdminFinance.invalidate();
                },
                onError: (error) => handleClientError(error),
            }
        );

    const recordPayment =
        trpc.general.corporatePlatform.recordPayment.useMutation({
            onSuccess: async () => {
                toast.success("Payment recorded");
                await utils.general.corporatePlatform.listAdminFinance.invalidate();
            },
            onError: (error) => handleClientError(error),
        });

    const issueProforma =
        trpc.general.corporatePlatform.issueProformaInvoice.useMutation({
            onSuccess: () => toast.success("Proforma invoice issued"),
            onError: (error) => handleClientError(error),
        });

    const issueTax = trpc.general.corporatePlatform.issueTaxInvoice.useMutation(
        {
            onSuccess: (invoice) => {
                toast.success("Tax invoice issued. Download starting...");
                window.location.assign(
                    `/api/corporate-orders/${invoice.orderId}/invoice.pdf`
                );
            },
            onError: (error) => handleClientError(error),
        }
    );

    return (
        <div className="space-y-5">
            <AdminMetricGrid
                items={[
                    {
                        label: "Direct releases",
                        value: String(
                            approvedQuotesReadyForOrderRelease.length
                        ),
                        tone: "blue",
                    },
                    {
                        label: "POs to review",
                        value: String(purchaseOrdersAwaitingDecision.length),
                        tone: "gold",
                    },
                    {
                        label: "Outstanding balance",
                        value: formatINR(outstandingBalancePaise),
                    },
                    {
                        label: "Recorded collections",
                        value: formatINR(recordedCollectionsPaise),
                        tone: "blue",
                    },
                ]}
            />

            <div className="flex flex-col gap-1 pt-2">
                <h2 className="text-lg font-semibold text-slate-900">
                    Action queue
                </h2>
                <p className="text-sm text-slate-500">
                    Resolve approvals and purchase-order checks before moving on
                    to collections and invoicing.
                </p>
            </div>

            <div className="grid gap-5 2xl:grid-cols-2">
                <AdminPanel
                    title="Direct order releases"
                    description="Approved quotes that can move directly into corporate order processing."
                    actions={
                        <StatusBadge tone="blue">
                            {approvedQuotesReadyForOrderRelease.length} waiting
                        </StatusBadge>
                    }
                >
                    {approvedQuotesReadyForOrderRelease.length ? (
                        <div className="space-y-4">
                            {approvedQuotesReadyForOrderRelease
                                .slice(0, 10)
                                .map((quote: any) => (
                                    <div
                                        key={quote.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge tone="blue">
                                                {quote.quoteNumber}
                                            </StatusBadge>
                                            <StatusBadge tone="green">
                                                Approved
                                            </StatusBadge>
                                            <StatusBadge tone="slate">
                                                {formatINR(
                                                    quote.totalAmountPaise
                                                )}
                                            </StatusBadge>
                                        </div>
                                        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
                                            <div>
                                                <div className="text-lg font-semibold text-slate-900">
                                                    {quote.profile
                                                        ?.companyName ??
                                                        "Buyer company pending"}
                                                </div>
                                                <div className="mt-1 text-sm text-slate-600">
                                                    The buyer approved this
                                                    quote without a purchase
                                                    order. Release it to start
                                                    the production workflow.
                                                </div>
                                                {quote.customerDecisionNotes ? (
                                                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                                        <span className="font-semibold text-slate-900">
                                                            Customer note:
                                                        </span>{" "}
                                                        {
                                                            quote.customerDecisionNotes
                                                        }
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="grid gap-3">
                                                <MetaLine
                                                    label="Buyer contact"
                                                    value={
                                                        quote.profile
                                                            ?.contactPerson ||
                                                        quote.profile?.email ||
                                                        "Not available"
                                                    }
                                                />
                                                <MetaLine
                                                    label="Quantity"
                                                    value={`${quote.quantity} unit(s)`}
                                                />
                                                <MetaLine
                                                    label="Next admin action"
                                                    value="Create corporate order"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button
                                                onClick={() =>
                                                    createOrderFromApprovedQuote.mutate(
                                                        {
                                                            quoteId: quote.id,
                                                        }
                                                    )
                                                }
                                                disabled={
                                                    createOrderFromApprovedQuote.isPending
                                                }
                                            >
                                                Create Corporate Order
                                            </Button>
                                            <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700">
                                                No buyer PO required
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <EmptyQueue
                            title="No approved quotes waiting for direct order release"
                            description="This section fills when a customer approves a quote and chooses not to use a company purchase order."
                        />
                    )}
                </AdminPanel>

                <AdminPanel
                    title="Purchase order review"
                    description="Confirm the commercial checks before accepting a buyer’s purchase order."
                    actions={
                        <StatusBadge tone="amber">
                            {purchaseOrdersAwaitingDecision.length} to review
                        </StatusBadge>
                    }
                >
                    {purchaseOrdersAwaitingDecision.length ? (
                        <div className="space-y-4">
                            {purchaseOrdersAwaitingDecision
                                .slice(0, 10)
                                .map((po: any) => (
                                    <div
                                        key={po.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge tone="blue">
                                                {po.poNumber}
                                            </StatusBadge>
                                            <StatusBadge tone="amber">
                                                {toLabel(po.status)}
                                            </StatusBadge>
                                            <StatusBadge tone="slate">
                                                {formatINR(po.poValuePaise)}
                                            </StatusBadge>
                                        </div>
                                        <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)]">
                                            <div>
                                                <div className="text-sm leading-6 text-slate-600">
                                                    Check the purchase order
                                                    against the approved
                                                    commercial terms before
                                                    releasing the enterprise
                                                    order.
                                                </div>
                                                <div className="mt-4 grid gap-2">
                                                    <ValidationLine
                                                        label="Company name matches approved quote"
                                                        passed={
                                                            po.validationSummary
                                                                .companyNameMatches
                                                        }
                                                    />
                                                    <ValidationLine
                                                        label="Order value matches quote total"
                                                        passed={
                                                            po.validationSummary
                                                                .orderValueMatches
                                                        }
                                                    />
                                                    <ValidationLine
                                                        label="Delivery date is feasible"
                                                        passed={
                                                            po.validationSummary
                                                                .deliveryDateFeasible
                                                        }
                                                    />
                                                    <ValidationLine
                                                        label="Product scope is confirmed"
                                                        passed={
                                                            po.validationSummary
                                                                .productScopeMatches
                                                        }
                                                    />
                                                    <ValidationLine
                                                        label="Authorized signatory is present"
                                                        passed={
                                                            po.validationSummary
                                                                .authorizedSignatoryPresent
                                                        }
                                                    />
                                                </div>
                                                {po.validationSummary.issues
                                                    ?.length ? (
                                                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                                        {po.validationSummary.issues.join(
                                                            ". "
                                                        )}
                                                    </div>
                                                ) : null}
                                                <div className="mt-4">
                                                    <Input
                                                        placeholder="Add purchase order review notes"
                                                        value={
                                                            poReviewNotes[
                                                                po.id
                                                            ] ??
                                                            po.reviewNotes ??
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setPoReviewNotes(
                                                                (current) => ({
                                                                    ...current,
                                                                    [po.id]:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <Button
                                                        disabled={
                                                            po.validationSummary
                                                                .issues
                                                                ?.length > 0
                                                        }
                                                        onClick={() =>
                                                            reviewPo.mutate({
                                                                purchaseOrderId:
                                                                    po.id,
                                                                status: "po_accepted",
                                                                reviewNotes:
                                                                    poReviewNotes[
                                                                        po.id
                                                                    ] ??
                                                                    "Approved from finance workspace",
                                                                validationSummary:
                                                                    po.validationSummary,
                                                            })
                                                        }
                                                    >
                                                        Accept Purchase Order
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            reviewPo.mutate({
                                                                purchaseOrderId:
                                                                    po.id,
                                                                status: "po_requires_changes",
                                                                reviewNotes:
                                                                    poReviewNotes[
                                                                        po.id
                                                                    ] ??
                                                                    "Purchase order requires clarification",
                                                                validationSummary:
                                                                    po.validationSummary,
                                                            })
                                                        }
                                                    >
                                                        Request Changes
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid gap-3 text-sm text-slate-600">
                                                <MetaLine
                                                    label="Linked quote"
                                                    value={
                                                        po.quote?.quoteNumber ||
                                                        po.quoteId ||
                                                        "Not linked yet"
                                                    }
                                                />
                                                <MetaLine
                                                    label="Buyer company"
                                                    value={
                                                        po.profile
                                                            ?.companyName ||
                                                        po.companyName ||
                                                        "Not linked yet"
                                                    }
                                                />
                                                <MetaLine
                                                    label="Authorized signatory"
                                                    value={
                                                        po.authorizedSignatoryName ||
                                                        "Missing"
                                                    }
                                                />
                                                <MetaLine
                                                    label="Uploaded purchase order file"
                                                    value={
                                                        po.uploadedFileUrl
                                                            ? "Available"
                                                            : "Missing"
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <EmptyQueue
                            title="No purchase orders awaiting review"
                            description="Accepted and pending enterprise purchase orders will appear here for finance approval."
                        />
                    )}
                </AdminPanel>

                <div className="grid gap-5 sm:grid-cols-2 2xl:col-span-2">
                    <AdminPanel
                        title="Refunds & credits"
                        description="Exceptions that need finance visibility."
                    >
                        {initialData.refunds.length ? (
                            <div className="space-y-3">
                                {initialData.refunds
                                    .slice(0, 8)
                                    .map((refund: any) => (
                                        <div
                                            key={refund.id}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="font-semibold text-slate-900">
                                                    {toLabel(
                                                        refund.refundStatus
                                                    )}
                                                </div>
                                                <StatusBadge tone="rose">
                                                    {formatINR(
                                                        refund.refundAmountPaise
                                                    )}
                                                </StatusBadge>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <EmptyQueue
                                title="No refunds logged"
                                description="Refund and credit-note related records will appear here when finance actions are triggered."
                            />
                        )}
                    </AdminPanel>

                    <AdminPanel
                        title="Finance workflow"
                        description="The core stages that keep order documents and collections moving."
                    >
                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                            <WorkflowTile label="Purchase Order Validation" />
                            <WorkflowTile label="Invoice Issuance" />
                            <WorkflowTile label="Manual Collections" />
                            <WorkflowTile label="Settlement Oversight" />
                        </div>
                    </AdminPanel>
                </div>
            </div>

            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <AdminPanel
                    title="Payments Ledger"
                    description="Latest recorded collections and their reconciliation details."
                >
                    {initialData.payments.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="border-b border-slate-200 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">
                                            Payment Type
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Mode
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Reference
                                        </th>
                                        <th className="px-4 py-3 font-semibold">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialData.payments
                                        .slice(0, 12)
                                        .map((payment: any) => (
                                            <tr
                                                key={payment.id}
                                                className="border-b border-slate-100"
                                            >
                                                <td className="px-4 py-4 font-medium text-slate-900">
                                                    {toLabel(
                                                        payment.paymentType
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge tone="blue">
                                                        {toLabel(
                                                            payment.paymentStatus
                                                        )}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {toLabel(
                                                        payment.paymentMode
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 font-semibold text-slate-900">
                                                    {formatINR(
                                                        payment.amountPaise
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {payment.paymentReference ||
                                                        "Pending reference"}
                                                </td>
                                                <td className="px-4 py-4 text-slate-600">
                                                    {payment.paymentDate ||
                                                        "Pending"}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyQueue
                            title="No payments recorded"
                            description="Recorded collections will appear in this ledger once payment entries are created."
                        />
                    )}
                </AdminPanel>

                <AdminPanel
                    title="Collections & invoicing"
                    description="Record a bank collection or issue a tax invoice for an active order."
                >
                    {initialData.orders.length ? (
                        <div className="space-y-4">
                            {initialData.orders
                                .slice(0, 8)
                                .map((order: any) => (
                                    <div
                                        key={order.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                    >
                                        <div className="font-semibold text-slate-900">
                                            {order.publicOrderId}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-500">
                                            {order.companyName} • Remaining
                                            balance{" "}
                                            {formatINR(order.balanceDuePaise)}
                                        </div>
                                        <div className="mt-4 flex flex-col gap-3 2xl:flex-row">
                                            <div className="min-w-0 flex-1">
                                                <Input
                                                    placeholder="Manual payment amount in INR"
                                                    type="number"
                                                    value={
                                                        paymentAmounts[
                                                            order.id
                                                        ] ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        setPaymentAmounts(
                                                            (current) => ({
                                                                ...current,
                                                                [order.id]:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    recordPayment.mutate({
                                                        orderId: order.id,
                                                        paymentType: "manual",
                                                        paymentMode:
                                                            "bank_transfer",
                                                        amountPaise: Math.round(
                                                            Number(
                                                                paymentAmounts[
                                                                    order.id
                                                                ] ?? 0
                                                            ) * 100
                                                        ),
                                                        paymentReference: `manual-${order.publicOrderId}`,
                                                        paymentStatus:
                                                            "payment_success",
                                                        paymentDate: new Date()
                                                            .toISOString()
                                                            .slice(0, 10),
                                                    })
                                                }
                                            >
                                                Record Payment
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    issueTax.mutate({
                                                        orderId: order.id,
                                                    })
                                                }
                                            >
                                                Issue Tax Invoice
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <EmptyQueue
                            title="No order-side finance actions"
                            description="Active orders requiring manual collection or invoice issuance will appear here."
                        />
                    )}
                </AdminPanel>
            </div>

            <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <AdminPanel
                    title="Proforma invoices"
                    description="Create a customer-ready proforma from an active commercial quote."
                >
                    {initialData.quotes.length ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {initialData.quotes
                                .slice(0, 8)
                                .map((quote: any) => (
                                    <div
                                        key={quote.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="font-semibold text-slate-900">
                                                {quote.quoteNumber}
                                            </div>
                                            <StatusBadge tone="blue">
                                                {toLabel(quote.status)}
                                            </StatusBadge>
                                        </div>
                                        <div className="mt-2 text-sm text-slate-500">
                                            {quote.profile?.companyName ??
                                                "Unknown company"}{" "}
                                            •{" "}
                                            {formatINR(quote.totalAmountPaise)}
                                        </div>
                                        <Button
                                            className="mt-4"
                                            variant="outline"
                                            onClick={() =>
                                                issueProforma.mutate({
                                                    quoteId: quote.id,
                                                })
                                            }
                                        >
                                            Issue Proforma Invoice
                                        </Button>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <EmptyQueue
                            title="No quote-side invoice actions"
                            description="Issued quotes will appear here once the commercial team starts sending quotations."
                        />
                    )}
                </AdminPanel>

                <AdminPanel
                    title="What happens next"
                    description="Keep downstream teams aligned before finance closes the loop."
                >
                    <div className="space-y-3">
                        <MetaBox
                            title="Quality control review"
                            text="Finance remains aware of downstream readiness before final invoice and collection stages close out."
                        />
                        <MetaBox
                            title="Dispatch readiness"
                            text="Dispatch confirmation and delivery milestones should remain visible before final settlement is considered complete."
                        />
                        <MetaBox
                            title="Brand settlement / payout oversight"
                            text="Settlement and payout visibility is surfaced as an explicit stage so finance users are not left guessing what comes after collection."
                        />
                    </div>
                </AdminPanel>
            </div>
        </div>
    );
}

function MetaLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </div>
            <div className="mt-1 font-semibold text-slate-900">{value}</div>
        </div>
    );
}

function ValidationLine({ label, passed }: { label: string; passed: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span className="text-slate-700">{label}</span>
            <span
                className={
                    passed
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-rose-600"
                }
            >
                {passed ? "Pass" : "Fail"}
            </span>
        </div>
    );
}

function WorkflowTile({ label }: { label: string }) {
    return (
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center font-medium text-slate-700">
            {label}
        </div>
    );
}

function MetaBox({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold text-slate-900">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">{text}</div>
        </div>
    );
}

function toLabel(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}

"use client";

import { BrandTaxInvoiceForm } from "@/components/corporate-platform/brand-tax-invoice-form";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, handleClientError } from "@/lib/utils";
import { CheckCircle2, Circle, Download } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function CorporateDocumentChainPanel({ order }: { order: any }) {
    const utils = trpc.useUtils();
    const { data: chain = order.documentChain } =
        trpc.general.corporatePlatform.getOrderDocumentChain.useQuery(
            { orderId: order.id },
            { initialData: order.documentChain }
        );
    const { data: settings } =
        trpc.general.corporatePlatform.getCorporateDocumentSettings.useQuery();
    const orderGstRateBps = Number(
        order.gstRateBps ??
            (order.productConfigSnapshot as Record<string, unknown> | undefined)
                ?.gstRateBps ??
            0
    );
    const orderGstPercent = (orderGstRateBps / 100).toFixed(2);
    const [unitBuyPrice, setUnitBuyPrice] = useState("");
    const [gstRatePercent, setGstRatePercent] = useState(orderGstPercent);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
    const [deliveryMode, setDeliveryMode] = useState<
        "renivet_warehouse" | "direct_to_customer"
    >("renivet_warehouse");
    const [paymentTerms, setPaymentTerms] = useState(
        "As agreed with the supplier brand"
    );
    const [deliveryInstructions, setDeliveryInstructions] = useState("");
    const [eWayBillNumber, setEWayBillNumber] = useState("");

    const refresh = async () => {
        await Promise.all([
            utils.general.corporatePlatform.getOrderDocumentChain.invalidate({
                orderId: order.id,
            }),
            utils.general.corporateOrders.getOrderById.invalidate({
                corporateOrderId: order.id,
            }),
        ]);
    };
    const issueVendorPo =
        trpc.general.corporatePlatform.issueVendorPurchaseOrder.useMutation({
            onSuccess: async () => {
                toast.success("Renivet purchase order issued");
                await refresh();
            },
            onError: (error) => handleClientError(error),
        });
    const issueOrderProforma =
        trpc.general.corporatePlatform.issueOrderProformaInvoice.useMutation({
            onSuccess: async () => {
                toast.success("Proforma invoice is ready to download");
                await refresh();
            },
            onError: (error) => handleClientError(error),
        });
    const reviewBrandInvoice =
        trpc.general.corporatePlatform.reviewBrandTaxInvoice.useMutation({
            onSuccess: async () => {
                toast.success("Brand invoice review saved");
                await refresh();
            },
            onError: (error) => handleClientError(error),
        });
    const issueChallan =
        trpc.general.corporatePlatform.issueDeliveryChallan.useMutation({
            onSuccess: async () => {
                toast.success("Delivery challan issued");
                await refresh();
            },
            onError: (error) => handleClientError(error),
        });

    const createVendorPo = () => {
        const pricePaise = toPaise(unitBuyPrice);
        const gstPercent = Number(gstRatePercent);
        if (pricePaise <= 0) {
            toast.error("Enter a valid buy price");
            return;
        }
        if (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 28) {
            toast.error("Enter a GST rate between 0% and 28%");
            return;
        }
        issueVendorPo.mutate({
            orderId: order.id,
            unitBuyPricePaise: pricePaise,
            gstRateBps: Math.round(gstPercent * 100),
            expectedDeliveryDate: expectedDeliveryDate || null,
            deliveryMode,
            paymentTerms,
            deliveryInstructions: deliveryInstructions || null,
        });
    };

    const documents = [
        {
            number: 1,
            title: "Proforma Invoice",
            subtitle: "Renivet to corporate customer",
            record: chain?.proformaInvoice,
            href: chain?.proformaInvoice
                ? `/api/corporate-proforma-invoices/${chain.proformaInvoice.id}/download`
                : null,
        },
        {
            number: 2,
            title: "Corporate Purchase Order",
            subtitle: "Customer to Renivet",
            record: chain?.incomingPurchaseOrder,
            href: chain?.incomingPurchaseOrder
                ? `/api/corporate-orders/${order.id}/customer-po`
                : null,
            optionalNote: "Optional customer document",
        },
        {
            number: 3,
            title: "Receipt Voucher",
            subtitle: "Advance received by Renivet",
            record: chain?.receiptVoucher,
            href: chain?.receiptVoucher
                ? `/api/corporate-orders/${order.id}/receipt-voucher.pdf`
                : null,
        },
        {
            number: 4,
            title: "Renivet Purchase Order",
            subtitle: "Renivet to supplier brand",
            record: chain?.vendorPurchaseOrder,
            href: chain?.vendorPurchaseOrder
                ? `/api/corporate-orders/${order.id}/vendor-po.pdf`
                : null,
        },
        {
            number: 5,
            title: "Brand Tax Invoice",
            subtitle: "Supplier brand to Renivet",
            record: chain?.brandTaxInvoice,
            href: chain?.brandTaxInvoice
                ? `/api/corporate-orders/${order.id}/brand-tax-invoice`
                : null,
            optionalNote: "Optional supplier document",
        },
        {
            number: 6,
            title: "Customer Tax Invoice",
            subtitle: "Renivet to corporate customer",
            record: chain?.customerTaxInvoice,
            href: chain?.customerTaxInvoice
                ? `/api/corporate-orders/${order.id}/invoice.pdf`
                : null,
        },
        {
            number: 7,
            title: "Delivery Challan",
            subtitle: "Required for direct brand dispatch",
            record: chain?.deliveryChallan,
            href: chain?.deliveryChallan
                ? `/api/corporate-orders/${order.id}/delivery-challan.pdf`
                : null,
            optionalNote:
                chain?.vendorPurchaseOrder?.deliveryMode !==
                "direct_to_customer"
                    ? "Not required for warehouse fulfilment"
                    : undefined,
        },
    ];

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {documents.map((document) => (
                    <div
                        key={document.number}
                        className="rounded-xl border border-slate-200 p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                                {document.record ? (
                                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                                ) : (
                                    <Circle className="mt-0.5 size-5 text-slate-300" />
                                )}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Step {document.number}
                                    </p>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {document.title}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {document.optionalNote ??
                                            document.subtitle}
                                    </p>
                                </div>
                            </div>
                            {document.href ? (
                                <a
                                    href={document.href}
                                    aria-label={`Download ${document.title}`}
                                >
                                    <Download className="size-4 text-sky-700" />
                                </a>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>

            {!chain?.proformaInvoice && order.advancePaidPaise > 0 ? (
                <div className="flex items-center justify-between gap-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <div>
                        <p className="font-semibold text-slate-900">
                            Proforma invoice not generated yet
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            Generate it for this existing paid self-service
                            order.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={() =>
                            issueOrderProforma.mutate({ orderId: order.id })
                        }
                        disabled={issueOrderProforma.isPending}
                    >
                        {issueOrderProforma.isPending
                            ? "Generating..."
                            : "Generate Proforma Invoice"}
                    </Button>
                </div>
            ) : null}

            {!chain?.vendorPurchaseOrder ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-xs font-semibold text-slate-900">
                                Brand purchase order
                            </h3>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                                Create the supplier PO for this order.
                            </p>
                        </div>
                        <div className="text-[10px] font-medium text-slate-500">
                            Quantity: {order.quantity} units
                        </div>
                    </div>

                    <div className="grid gap-x-4 gap-y-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        <CompactField label="Unit buy price" suffix="INR">
                            <Input
                                inputMode="decimal"
                                placeholder="0.00"
                                value={unitBuyPrice}
                                onChange={(event) =>
                                    setUnitBuyPrice(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="GST rate" suffix="%">
                            <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max="28"
                                step="0.01"
                                placeholder="0.00"
                                value={gstRatePercent}
                                onChange={(event) =>
                                    setGstRatePercent(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Expected delivery">
                            <Input
                                type="date"
                                value={expectedDeliveryDate}
                                onChange={(event) =>
                                    setExpectedDeliveryDate(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Delivery mode">
                            <select
                                className="h-9 w-full rounded-md border border-input bg-white px-3 text-xs"
                                value={deliveryMode}
                                onChange={(event) =>
                                    setDeliveryMode(
                                        event.target
                                            .value as typeof deliveryMode
                                    )
                                }
                            >
                                <option value="renivet_warehouse">
                                    Renivet warehouse
                                </option>
                                <option value="direct_to_customer">
                                    Direct to customer
                                </option>
                            </select>
                        </CompactField>
                        <CompactField label="Payment terms">
                            <Input
                                placeholder="Supplier payment terms"
                                value={paymentTerms}
                                onChange={(event) =>
                                    setPaymentTerms(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Delivery / QC instructions">
                            <Input
                                placeholder="Optional instructions"
                                value={deliveryInstructions}
                                onChange={(event) =>
                                    setDeliveryInstructions(event.target.value)
                                }
                            />
                        </CompactField>
                    </div>

                    <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50/60 px-4 py-3">
                        <Button
                            className="h-9 px-4 text-xs"
                            onClick={createVendorPo}
                            disabled={issueVendorPo.isPending}
                        >
                            {issueVendorPo.isPending
                                ? "Issuing PO..."
                                : "Issue purchase order"}
                        </Button>
                    </div>
                </div>
            ) : null}

            {chain?.vendorPurchaseOrder && !chain?.brandTaxInvoice ? (
                <BrandTaxInvoiceForm
                    orderId={order.id}
                    vendorPurchaseOrderId={chain.vendorPurchaseOrder.id}
                    expectedTotalPaise={
                        chain.vendorPurchaseOrder.totalAmountPaise
                    }
                    recipientGstin={settings?.gstin}
                    onComplete={refresh}
                />
            ) : null}

            {chain?.brandTaxInvoice ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xs font-semibold text-slate-900">
                                Supplier invoice review
                            </h3>
                            <p className="mt-1 text-[11px] text-slate-500">
                                {convertValueToLabel(
                                    chain.brandTaxInvoice.validationStatus
                                )}
                                {" · GSTR-2B "}
                                {convertValueToLabel(
                                    chain.brandTaxInvoice.gstr2bStatus
                                )}
                            </p>
                            {chain.brandTaxInvoice.validationIssues?.length ? (
                                <p className="mt-2 text-xs text-amber-700">
                                    {chain.brandTaxInvoice.validationIssues.join(
                                        "; "
                                    )}
                                </p>
                            ) : null}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                disabled={reviewBrandInvoice.isPending}
                                onClick={() =>
                                    reviewBrandInvoice.mutate({
                                        invoiceId: chain.brandTaxInvoice.id,
                                        validationStatus: "validated",
                                        gstr2bStatus: "matched",
                                        reviewNotes:
                                            "Validated against Renivet PO and matched in GSTR-2B.",
                                    })
                                }
                            >
                                Validate and match
                            </Button>
                            <Button
                                variant="outline"
                                disabled={reviewBrandInvoice.isPending}
                                onClick={() =>
                                    reviewBrandInvoice.mutate({
                                        invoiceId: chain.brandTaxInvoice.id,
                                        validationStatus: "rejected",
                                        gstr2bStatus: "mismatch",
                                        reviewNotes:
                                            "Invoice requires correction.",
                                    })
                                }
                            >
                                Mark mismatch
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            {chain?.vendorPurchaseOrder?.deliveryMode ===
                "direct_to_customer" && !chain?.deliveryChallan ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">
                        Issue direct-shipment delivery challan
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                        <Input
                            className="max-w-sm"
                            placeholder="E-way bill number (optional)"
                            value={eWayBillNumber}
                            onChange={(event) =>
                                setEWayBillNumber(event.target.value)
                            }
                        />
                        <Button
                            onClick={() =>
                                issueChallan.mutate({
                                    orderId: order.id,
                                    vendorPurchaseOrderId:
                                        chain.vendorPurchaseOrder.id,
                                    eWayBillNumber: eWayBillNumber || null,
                                })
                            }
                            disabled={issueChallan.isPending}
                        >
                            {issueChallan.isPending
                                ? "Issuing..."
                                : "Issue Delivery Challan"}
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function CompactField({
    label,
    suffix,
    children,
}: {
    label: string;
    suffix?: string;
    children: ReactNode;
}) {
    return (
        <label className="min-w-0 space-y-1.5">
            <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                <span>{label}</span>
                {suffix ? (
                    <span className="font-medium normal-case tracking-normal text-slate-400">
                        {suffix}
                    </span>
                ) : null}
            </span>
            <span className="block [&_input]:h-9 [&_input]:text-xs">
                {children}
            </span>
        </label>
    );
}

function toPaise(value: string) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

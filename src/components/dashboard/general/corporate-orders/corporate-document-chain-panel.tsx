"use client";

import { BrandTaxInvoiceForm } from "@/components/corporate-platform/brand-tax-invoice-form";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, handleClientError } from "@/lib/utils";
import { CheckCircle2, Circle, Download } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

    const quantity = Math.max(1, Number(order.quantity || 1));
    const pricingSnapshot = (order.pricingSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const productSnapshot = (order.productConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const quoteSnapshot = (order.quote ?? {}) as Record<string, unknown>;

    const calculatedUnitPricePaise =
        Number(pricingSnapshot.unitPricePaise ?? 0) ||
        Number(pricingSnapshot.basePricePaise ?? 0) ||
        Number(quoteSnapshot.unitPricePaise ?? 0) ||
        Number(productSnapshot.unitPricePaise ?? 0) ||
        Number(order.unitPricePaise ?? 0) ||
        (order.subtotalPaise
            ? Math.round(Number(order.subtotalPaise) / quantity)
            : 0) ||
        (chain?.proformaInvoice?.taxableValuePaise
            ? Math.round(
                  Number(chain.proformaInvoice.taxableValuePaise) / quantity
              )
            : 0) ||
        (order.totalPaise
            ? Math.round(Number(order.totalPaise) / quantity)
            : 0) ||
        (order.totalAmountPaise
            ? Math.round(Number(order.totalAmountPaise) / quantity)
            : 0);

    const brandingSnapshot = (order.brandingConfigSnapshot ?? {}) as Record<
        string,
        unknown
    >;
    const extraChargesList = Array.isArray(brandingSnapshot.appliedExtraCharges)
        ? (brandingSnapshot.appliedExtraCharges as Array<{
              name?: string;
              amountPaise?: number;
          }>)
        : [];
    const quoteCustomizationPaise =
        Number(order.quote?.customizationCostPaise ?? 0) ||
        Number(order.quote?.customizationPaise ?? 0) ||
        Number(pricingSnapshot.customizationCostPaise ?? 0) ||
        Number(pricingSnapshot.customizationPaise ?? 0) ||
        extraChargesList.reduce(
            (sum, item) => sum + Number(item.amountPaise || 0),
            0
        );

    // Calculate base subtotal and base GST directly from Proforma Invoice:
    const proformaTotalGstPaise = Number(
        chain?.proformaInvoice?.gstAmountPaise ?? 0
    );
    const proformaTaxablePaise = Number(
        chain?.proformaInvoice?.subtotalPaise ??
            chain?.proformaInvoice?.taxableValuePaise ??
            0
    );
    const proformaBaseSubtotalPaise =
        proformaTaxablePaise > quoteCustomizationPaise
            ? proformaTaxablePaise - quoteCustomizationPaise
            : proformaTaxablePaise > 0
              ? proformaTaxablePaise
              : calculatedUnitPricePaise * quantity;

    const customizationGstPaise = Number(
        (pricingSnapshot.customizationGstAmountPaise as number | undefined) ?? 0
    );

    const proformaBaseGstAmountPaise =
        proformaTotalGstPaise > customizationGstPaise
            ? proformaTotalGstPaise - customizationGstPaise
            : proformaTotalGstPaise;

    const proformaBaseGstRate =
        proformaBaseSubtotalPaise > 0 && proformaBaseGstAmountPaise > 0
            ? Math.round(
                  (proformaBaseGstAmountPaise / proformaBaseSubtotalPaise) *
                      10000
              ) / 100
            : null;

    // Exact value from Quote creation, Proforma Invoice, or Order
    const exactSavedGstRate =
        order.quote?.gstPercent != null
            ? Number(order.quote.gstPercent)
            : order.quote?.gstRateBps != null
              ? Number(order.quote.gstRateBps) / 100
              : proformaBaseGstRate != null
                ? proformaBaseGstRate
                : order.gstRateBps != null
                  ? Number(order.gstRateBps) / 100
                  : pricingSnapshot.gstRateBps != null
                    ? Number(pricingSnapshot.gstRateBps) / 100
                    : null;

    const defaultUnitPrice =
        calculatedUnitPricePaise > 0
            ? (calculatedUnitPricePaise / 100).toFixed(2)
            : "";
    const defaultGstPercent = (
        exactSavedGstRate != null
            ? exactSavedGstRate
            : calculatedUnitPricePaise > 0 && calculatedUnitPricePaise <= 250000
              ? 5
              : 18
    ).toFixed(2);

    const [unitBuyPrice, setUnitBuyPrice] = useState(defaultUnitPrice);
    const [gstRatePercent, setGstRatePercent] = useState(defaultGstPercent);
    const [customizationCharges, setCustomizationCharges] = useState(
        quoteCustomizationPaise > 0
            ? (quoteCustomizationPaise / 100).toFixed(2)
            : "0.00"
    );
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
    const [deliveryMode, setDeliveryMode] = useState<
        "renivet_warehouse" | "direct_to_customer"
    >("direct_to_customer");
    const [paymentTerms, setPaymentTerms] = useState(
        "Renivet will generate the Tax Invoice on your behalf per our marketplace agreement."
    );
    const [deliveryInstructions, setDeliveryInstructions] = useState("");
    const [eWayBillNumber, setEWayBillNumber] = useState("");

    useEffect(() => {
        if (calculatedUnitPricePaise > 0) {
            setUnitBuyPrice((calculatedUnitPricePaise / 100).toFixed(2));
        }
        setGstRatePercent(defaultGstPercent);
        if (quoteCustomizationPaise > 0) {
            setCustomizationCharges((quoteCustomizationPaise / 100).toFixed(2));
        }
    }, [
        chain?.proformaInvoice?.id,
        order.quote?.id,
        calculatedUnitPricePaise,
        defaultGstPercent,
        quoteCustomizationPaise,
    ]);

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
    const issueSettlement =
        trpc.general.corporatePlatform.issueSettlementStatement.useMutation({
            onSuccess: async () => {
                toast.success("Settlement Statement generated successfully");
                await refresh();
            },
            onError: (error) => handleClientError(error),
        });

    const [commissionPercent, setCommissionPercent] = useState(
        chain?.settlementStatement
            ? String(chain.settlementStatement.commissionPercentBps / 100)
            : order.quote?.commissionAmountPaise && proformaTaxablePaise > 0
              ? String(
                    Math.round(
                        (order.quote.commissionAmountPaise * 100) /
                            proformaTaxablePaise
                    )
                )
              : "20"
    );

    const settlementGrossPaidPaise =
        chain?.customerTaxInvoice?.totalAmountPaise ??
        order.totalAmountPaise ??
        802000;
    const settlementGstEmbeddedPaise = chain?.customerTaxInvoice
        ? chain.customerTaxInvoice.cgstPaise +
          chain.customerTaxInvoice.sgstPaise +
          chain.customerTaxInvoice.igstPaise
        : (order.gstPaise ?? 102000);
    const settlementTaxablePaise = Math.max(
        0,
        settlementGrossPaidPaise - settlementGstEmbeddedPaise
    );
    const parsedCommissionPercent = Math.max(
        0,
        Math.min(100, Number(commissionPercent) || 0)
    );
    const calculatedCommissionPaise = Math.round(
        (settlementTaxablePaise * parsedCommissionPercent) / 100
    );
    const calculatedGstOnCommissionPaise = Math.round(
        (calculatedCommissionPaise * 18) / 100
    );
    const calculatedTcsPaise = Math.round(settlementTaxablePaise * 0.005);
    const calculatedTdsPaise = Math.round(settlementGrossPaidPaise * 0.001);
    const calculatedNetRemittancePaise = Math.max(
        0,
        settlementTaxablePaise -
            calculatedCommissionPaise -
            calculatedGstOnCommissionPaise -
            calculatedTcsPaise -
            calculatedTdsPaise
    );

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
            title: "Fulfillment Order",
            subtitle: "Renivet to supplier brand",
            record: chain?.vendorPurchaseOrder,
            href: chain?.vendorPurchaseOrder
                ? `/api/corporate-orders/${order.id}/fulfillment-order.pdf`
                : null,
            optionalNote: "Operational instruction (FO)",
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
        {
            number: 8,
            title: "Settlement Statement",
            subtitle: "Renivet to supplier brand",
            record: chain?.settlementStatement,
            href: chain?.settlementStatement
                ? `/api/corporate-orders/${order.id}/settlement-statement.pdf`
                : null,
            optionalNote: chain?.settlementStatement
                ? `Net: ₹${((chain.settlementStatement.netRemittancePaise ?? calculatedNetRemittancePaise) / 100).toFixed(2)} (${chain.settlementStatement.commissionPercentBps / 100}% comm.)`
                : "Doc 7 waterfall settlement",
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
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-xs font-semibold text-slate-900">
                                Fulfillment Order (FO)
                            </h3>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                                Operational instruction — Generate the
                                fulfillment order to instruct the brand to
                                prepare and ship items.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {chain?.proformaInvoice ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                    <CheckCircle2 className="size-3" />
                                    Linked to Proforma (
                                    {chain.proformaInvoice.invoiceNumber})
                                </span>
                            ) : order.quote ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                    <CheckCircle2 className="size-3" />
                                    Linked to Quote ({order.quote.quoteNumber})
                                </span>
                            ) : null}
                            <span className="text-[10px] font-medium text-slate-500">
                                Quantity: {order.quantity} units
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-x-4 gap-y-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        <CompactField label="Base unit sell price" suffix="INR">
                            <Input
                                inputMode="decimal"
                                placeholder="0.00"
                                value={unitBuyPrice}
                                onChange={(event) =>
                                    setUnitBuyPrice(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Base item GST rate" suffix="%">
                            <Input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max="28"
                                step="0.01"
                                placeholder="5.00"
                                value={gstRatePercent}
                                onChange={(event) =>
                                    setGstRatePercent(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField
                            label="Packaging / Extras charges"
                            suffix="INR"
                        >
                            <Input
                                inputMode="decimal"
                                placeholder="0.00"
                                value={customizationCharges}
                                onChange={(event) =>
                                    setCustomizationCharges(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField
                            label="GST on packaging / extras"
                            suffix="%"
                        >
                            <Input
                                type="number"
                                disabled
                                value="18.00"
                                className="bg-slate-50 text-slate-500"
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
                                <option value="direct_to_customer">
                                    Direct to customer
                                </option>
                                <option value="renivet_warehouse">
                                    Renivet warehouse
                                </option>
                            </select>
                        </CompactField>
                        <CompactField label="Invoice note / terms">
                            <Input
                                placeholder="Invoice terms note"
                                value={paymentTerms}
                                onChange={(event) =>
                                    setPaymentTerms(event.target.value)
                                }
                            />
                        </CompactField>
                        <CompactField label="Packaging & QC instructions">
                            <Input
                                placeholder="e.g. Ship to corporate address | Standard box packaging"
                                value={deliveryInstructions}
                                onChange={(event) =>
                                    setDeliveryInstructions(event.target.value)
                                }
                            />
                        </CompactField>
                    </div>

                    {(() => {
                        const parsedUnitPrice = Number(unitBuyPrice) || 0;
                        const parsedBaseGst = Number(gstRatePercent) || 0;
                        const parsedExtras = Number(customizationCharges) || 0;
                        const baseSubtotal = parsedUnitPrice * order.quantity;
                        const baseGstAmt = Math.round(
                            (baseSubtotal * parsedBaseGst) / 100
                        );
                        const extrasGstAmt = Math.round(
                            (parsedExtras * 18) / 100
                        );
                        const grandTotal =
                            baseSubtotal +
                            parsedExtras +
                            baseGstAmt +
                            extrasGstAmt;

                        return (
                            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/50 p-3 text-xs sm:grid-cols-5">
                                <div>
                                    <p className="text-[10px] text-slate-500">
                                        Base Subtotal
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        INR {baseSubtotal.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500">
                                        Extras / Packing
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        INR {parsedExtras.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500">
                                        GST on Base ({parsedBaseGst}%)
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        INR {baseGstAmt.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500">
                                        GST on Extras (18%)
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        INR {extrasGstAmt.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-emerald-700">
                                        Grand Total
                                    </p>
                                    <p className="font-bold text-emerald-700">
                                        INR {grandTotal.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50/60 px-4 py-3">
                        <Button
                            className="h-9 px-4 text-xs font-semibold"
                            onClick={createVendorPo}
                            disabled={issueVendorPo.isPending}
                        >
                            {issueVendorPo.isPending
                                ? "Generating FO..."
                                : "Generate Fulfillment Order to Brand"}
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

            {/* Step 8: Doc 7 — Settlement Waterfall (Renivet -> Brand) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                Settlement Waterfall
                            </span>
                            {chain?.settlementStatement ? (
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                    {chain.settlementStatement.statementNumber}
                                </span>
                            ) : null}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                            Remit-to-Brand Settlement Statement (Commission +
                            TCS + TDS)
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Select the platform commission percentage to
                            generate the settlement waterfall statement for this
                            order.
                        </p>
                    </div>

                    {chain?.settlementStatement ? (
                        <a
                            href={`/api/corporate-orders/${order.id}/settlement-statement.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
                        >
                            <Download className="size-4" />
                            Download Settlement Statement (PDF)
                        </a>
                    ) : null}
                </div>

                <div className="mt-4 grid gap-6 lg:grid-cols-12">
                    {/* Left Controls: Commission Selector */}
                    <div className="space-y-4 lg:col-span-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Platform Commission (%)
                            </label>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {[5, 10, 15, 20, 25].map((pct) => (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() =>
                                            setCommissionPercent(String(pct))
                                        }
                                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                            Number(commissionPercent) === pct
                                                ? "bg-emerald-700 text-white shadow-sm"
                                                : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                        }`}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2.5">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    placeholder="Enter commission percentage"
                                    value={commissionPercent}
                                    onChange={(e) =>
                                        setCommissionPercent(e.target.value)
                                    }
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                                Standard corporate commission is usually between
                                10% and 20%.
                            </p>
                        </div>

                        <Button
                            type="button"
                            className="w-full bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                            onClick={() =>
                                issueSettlement.mutate({
                                    orderId: order.id,
                                    commissionPercent: parsedCommissionPercent,
                                })
                            }
                            disabled={issueSettlement.isPending}
                        >
                            {issueSettlement.isPending
                                ? "Generating..."
                                : chain?.settlementStatement
                                  ? "Update Settlement Statement"
                                  : "Generate Settlement Statement"}
                        </Button>
                    </div>

                    {/* Right: Live Settlement Waterfall Table */}
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50 lg:col-span-8">
                        <div className="border-b border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700">
                            Live Waterfall Calculation Preview
                        </div>
                        <div className="divide-y divide-slate-100 text-xs">
                            <div className="flex items-center justify-between bg-white px-4 py-2">
                                <span className="text-slate-600">
                                    Corporate buyer paid (incl. GST)
                                </span>
                                <span className="font-semibold text-slate-900">
                                    ₹
                                    {(settlementGrossPaidPaise / 100).toFixed(
                                        2
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-slate-600">
                                    - GST embedded in sale (brand&apos;s
                                    liability)
                                </span>
                                <span className="font-medium text-rose-600">
                                    -₹
                                    {(settlementGstEmbeddedPaise / 100).toFixed(
                                        2
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between bg-emerald-50/50 px-4 py-2 font-semibold text-emerald-950">
                                <span>= Taxable Value</span>
                                <span>
                                    ₹{(settlementTaxablePaise / 100).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between bg-white px-4 py-2">
                                <span className="text-slate-600">
                                    - Platform Commission (
                                    {parsedCommissionPercent}% of ₹
                                    {(settlementTaxablePaise / 100).toFixed(2)})
                                </span>
                                <span className="font-medium text-rose-600">
                                    -₹
                                    {(calculatedCommissionPaise / 100).toFixed(
                                        2
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-slate-600">
                                    - GST on commission (18% under SAC 9985)
                                </span>
                                <span className="font-medium text-rose-600">
                                    -₹
                                    {(
                                        calculatedGstOnCommissionPaise / 100
                                    ).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between bg-white px-4 py-2">
                                <span className="text-slate-600">
                                    - TCS (0.5% of Taxable Value u/s 52)
                                </span>
                                <span className="font-medium text-rose-600">
                                    -₹{(calculatedTcsPaise / 100).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-slate-600">
                                    - TDS (0.1% of Gross Paid u/s 194-O)
                                </span>
                                <span className="font-medium text-rose-600">
                                    -₹{(calculatedTdsPaise / 100).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t-2 border-emerald-600 bg-emerald-50/90 px-4 py-2.5 text-emerald-950">
                                <span className="font-bold uppercase tracking-wider text-emerald-900">
                                    = Net Remittance to Brand
                                </span>
                                <span className="text-base font-bold text-emerald-700">
                                    ₹
                                    {(
                                        calculatedNetRemittancePaise / 100
                                    ).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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

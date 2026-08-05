"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { formatINR, handleClientError } from "@/lib/utils";
import { CheckCircle2, Circle, Download, Upload } from "lucide-react";
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
    const { startUpload } = useUploadThing("corporateDocumentUploader");
    const [unitBuyPrice, setUnitBuyPrice] = useState("");
    const [gstPercent, setGstPercent] = useState("18");
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
    const [deliveryMode, setDeliveryMode] = useState<
        "renivet_warehouse" | "direct_to_customer"
    >("renivet_warehouse");
    const [paymentTerms, setPaymentTerms] = useState(
        "As agreed with the supplier brand"
    );
    const [deliveryInstructions, setDeliveryInstructions] = useState("");
    const [brandInvoiceNumber, setBrandInvoiceNumber] = useState("");
    const [brandInvoiceDate, setBrandInvoiceDate] = useState("");
    const [supplierGstin, setSupplierGstin] = useState("");
    const [recipientGstin, setRecipientGstin] = useState("");
    const [hsnCode, setHsnCode] = useState("");
    const [taxableValue, setTaxableValue] = useState("");
    const [cgst, setCgst] = useState("0");
    const [sgst, setSgst] = useState("0");
    const [igst, setIgst] = useState("0");
    const [invoiceTotal, setInvoiceTotal] = useState("");
    const [brandInvoiceFile, setBrandInvoiceFile] = useState<File | null>(null);
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
    const recordBrandInvoice =
        trpc.general.corporatePlatform.recordBrandTaxInvoice.useMutation({
            onSuccess: async (invoice) => {
                toast.success(
                    invoice.validationStatus === "validated"
                        ? "Brand invoice uploaded and validated"
                        : "Brand invoice uploaded for review"
                );
                setBrandInvoiceFile(null);
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
        const gstRateBps = Math.round(Number(gstPercent) * 100);
        if (pricePaise <= 0 || !Number.isFinite(gstRateBps)) {
            toast.error("Enter a valid buy price and GST rate");
            return;
        }
        issueVendorPo.mutate({
            orderId: order.id,
            unitBuyPricePaise: pricePaise,
            gstRateBps,
            expectedDeliveryDate: expectedDeliveryDate || null,
            deliveryMode,
            paymentTerms,
            deliveryInstructions: deliveryInstructions || null,
        });
    };

    const uploadBrandInvoice = async () => {
        if (!brandInvoiceFile) {
            toast.error("Select the brand tax invoice file");
            return;
        }
        try {
            const uploaded = await startUpload([brandInvoiceFile]);
            const file = uploaded?.[0];
            if (!file) throw new Error("Brand invoice upload failed");
            recordBrandInvoice.mutate({
                orderId: order.id,
                vendorPurchaseOrderId: chain?.vendorPurchaseOrder?.id ?? null,
                invoiceNumber: brandInvoiceNumber,
                invoiceDate: brandInvoiceDate,
                supplierGstin: supplierGstin.trim().toUpperCase(),
                recipientGstin: (recipientGstin || settings?.gstin || "")
                    .trim()
                    .toUpperCase(),
                hsnCode: hsnCode.trim(),
                taxableValuePaise: toPaise(taxableValue),
                cgstPaise: toPaise(cgst),
                sgstPaise: toPaise(sgst),
                igstPaise: toPaise(igst),
                totalAmountPaise: toPaise(invoiceTotal),
                file: {
                    name: file.name,
                    size: file.size,
                    url: file.url,
                    key: file.key,
                    type: file.type || "application/pdf",
                },
            });
        } catch (error) {
            handleClientError(error);
        }
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
            optional:
                chain?.vendorPurchaseOrder?.deliveryMode !==
                "direct_to_customer",
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
                                        {document.optional
                                            ? "Not required for warehouse fulfilment"
                                            : document.subtitle}
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

            {!chain?.vendorPurchaseOrder ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">
                        Issue Renivet purchase order to brand
                    </h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <Input
                            placeholder="Unit buy price (INR)"
                            value={unitBuyPrice}
                            onChange={(event) =>
                                setUnitBuyPrice(event.target.value)
                            }
                        />
                        <Input
                            placeholder="GST rate (%)"
                            value={gstPercent}
                            onChange={(event) =>
                                setGstPercent(event.target.value)
                            }
                        />
                        <Input
                            type="date"
                            value={expectedDeliveryDate}
                            onChange={(event) =>
                                setExpectedDeliveryDate(event.target.value)
                            }
                        />
                        <select
                            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                            value={deliveryMode}
                            onChange={(event) =>
                                setDeliveryMode(
                                    event.target.value as typeof deliveryMode
                                )
                            }
                        >
                            <option value="renivet_warehouse">
                                Deliver to Renivet warehouse
                            </option>
                            <option value="direct_to_customer">
                                Ship directly to customer
                            </option>
                        </select>
                        <Input
                            placeholder="Payment terms"
                            value={paymentTerms}
                            onChange={(event) =>
                                setPaymentTerms(event.target.value)
                            }
                        />
                        <Input
                            placeholder="Delivery / QC instructions"
                            value={deliveryInstructions}
                            onChange={(event) =>
                                setDeliveryInstructions(event.target.value)
                            }
                        />
                    </div>
                    <Button
                        className="mt-3"
                        onClick={createVendorPo}
                        disabled={issueVendorPo.isPending}
                    >
                        {issueVendorPo.isPending
                            ? "Issuing..."
                            : "Issue Renivet PO"}
                    </Button>
                </div>
            ) : null}

            {chain?.vendorPurchaseOrder && !chain?.brandTaxInvoice ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-semibold text-slate-900">
                        Upload and validate brand tax invoice
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Expected PO total:{" "}
                        {formatINR(chain.vendorPurchaseOrder.totalAmountPaise)}
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <Input
                            placeholder="Brand invoice number"
                            value={brandInvoiceNumber}
                            onChange={(event) =>
                                setBrandInvoiceNumber(event.target.value)
                            }
                        />
                        <Input
                            type="date"
                            value={brandInvoiceDate}
                            onChange={(event) =>
                                setBrandInvoiceDate(event.target.value)
                            }
                        />
                        <Input
                            placeholder="Supplier GSTIN"
                            value={supplierGstin}
                            onChange={(event) =>
                                setSupplierGstin(event.target.value)
                            }
                        />
                        <Input
                            placeholder={`Renivet GSTIN${settings?.gstin ? ` (${settings.gstin})` : ""}`}
                            value={recipientGstin}
                            onChange={(event) =>
                                setRecipientGstin(event.target.value)
                            }
                        />
                        <Input
                            placeholder="HSN code"
                            value={hsnCode}
                            onChange={(event) => setHsnCode(event.target.value)}
                        />
                        <Input
                            placeholder="Taxable value (INR)"
                            value={taxableValue}
                            onChange={(event) =>
                                setTaxableValue(event.target.value)
                            }
                        />
                        <Input
                            placeholder="CGST (INR)"
                            value={cgst}
                            onChange={(event) => setCgst(event.target.value)}
                        />
                        <Input
                            placeholder="SGST (INR)"
                            value={sgst}
                            onChange={(event) => setSgst(event.target.value)}
                        />
                        <Input
                            placeholder="IGST (INR)"
                            value={igst}
                            onChange={(event) => setIgst(event.target.value)}
                        />
                        <Input
                            placeholder="Invoice total (INR)"
                            value={invoiceTotal}
                            onChange={(event) =>
                                setInvoiceTotal(event.target.value)
                            }
                        />
                        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-white px-3 text-sm">
                            <Upload className="size-4" />
                            <span className="truncate">
                                {brandInvoiceFile?.name ||
                                    "Select invoice PDF/image"}
                            </span>
                            <input
                                className="hidden"
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={(event) =>
                                    setBrandInvoiceFile(
                                        event.target.files?.[0] ?? null
                                    )
                                }
                            />
                        </label>
                    </div>
                    <Button
                        className="mt-3"
                        onClick={uploadBrandInvoice}
                        disabled={recordBrandInvoice.isPending}
                    >
                        {recordBrandInvoice.isPending
                            ? "Uploading..."
                            : "Upload and validate invoice"}
                    </Button>
                </div>
            ) : null}

            {chain?.brandTaxInvoice ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Brand invoice review
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Validation:{" "}
                                {chain.brandTaxInvoice.validationStatus} |
                                GSTR-2B: {chain.brandTaxInvoice.gstr2bStatus}
                            </p>
                            {chain.brandTaxInvoice.validationIssues?.length ? (
                                <p className="mt-2 text-sm text-amber-700">
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

function toPaise(value: string) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

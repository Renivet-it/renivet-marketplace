"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { formatINR, handleClientError } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

type Props = {
    orderId: string;
    vendorPurchaseOrderId: string;
    expectedTotalPaise: number;
    recipientGstin?: string | null;
    brandId?: string;
    expectedQuantity?: number;
    expectedUnitRatePaise?: number;
    foReference?: string;
    pendingUpload?: {
        id: string;
        declaredInvoiceDate?: string | null;
        fileName: string;
        fileUrl: string;
        fileKey: string;
        fileType: string;
        fileSize: number;
    } | null;
    onComplete: () => void | Promise<void>;
};

export function BrandTaxInvoiceForm({
    orderId,
    vendorPurchaseOrderId,
    expectedTotalPaise,
    recipientGstin: defaultRecipientGstin,
    brandId,
    expectedQuantity,
    expectedUnitRatePaise,
    foReference,
    pendingUpload,
    onComplete,
}: Props) {
    const { startUpload } = useUploadThing("corporateDocumentUploader");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(
        pendingUpload?.declaredInvoiceDate ?? ""
    );
    const [invoiceFoReference, setInvoiceFoReference] = useState(
        foReference ?? ""
    );
    const [invoiceQuantity, setInvoiceQuantity] = useState(
        expectedQuantity ? String(expectedQuantity) : ""
    );
    const [unitRate, setUnitRate] = useState(
        expectedUnitRatePaise ? String(expectedUnitRatePaise / 100) : ""
    );
    const [supplierGstin, setSupplierGstin] = useState("");
    const [recipientGstin, setRecipientGstin] = useState(
        defaultRecipientGstin ?? ""
    );
    const [hsnCode, setHsnCode] = useState("");
    const [taxableValue, setTaxableValue] = useState("");
    const [cgst, setCgst] = useState("0");
    const [sgst, setSgst] = useState("0");
    const [igst, setIgst] = useState("0");
    const [invoiceTotal, setInvoiceTotal] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (defaultRecipientGstin && !recipientGstin) {
            setRecipientGstin(defaultRecipientGstin);
        }
    }, [defaultRecipientGstin, recipientGstin]);

    const afterSuccess = async (invoice: {
        validationStatus?: string;
        status?: string;
    }) => {
        toast.success(
            invoice.validationStatus === "accepted"
                ? "Invoice accepted"
                : "Invoice sent for admin review"
        );
        setFile(null);
        await onComplete();
    };
    const adminMutation =
        trpc.general.corporatePlatform.recordBrandTaxInvoice.useMutation({
            onSuccess: afterSuccess,
            onError: (error) => handleClientError(error),
        });
    const brandMutation =
        trpc.general.corporatePlatform.recordBrandAssignedTaxInvoice.useMutation(
            {
                onSuccess: afterSuccess,
                onError: (error) => handleClientError(error),
            }
        );

    const submit = async () => {
        if (!invoiceDate) {
            toast.error("Select the invoice date");
            return;
        }
        if (!file && !pendingUpload) {
            toast.error("Select the invoice file");
            return;
        }
        setIsUploading(true);
        try {
            const uploadedFile = file
                ? (await startUpload([file]))?.[0]
                : pendingUpload
                  ? {
                      name: pendingUpload.fileName,
                      size: pendingUpload.fileSize,
                      url: pendingUpload.fileUrl,
                      key: pendingUpload.fileKey,
                      type: pendingUpload.fileType,
                    }
                  : null;
            if (!uploadedFile) throw new Error("Invoice upload failed");
            const uploadedDocument = {
                orderId,
                vendorPurchaseOrderId,
                invoiceDate,
                file: {
                    name: uploadedFile.name,
                    size: uploadedFile.size,
                    url: uploadedFile.url,
                    key: uploadedFile.key,
                    type: uploadedFile.type || "application/pdf",
                },
            };
            if (brandId) {
                brandMutation.mutate({
                    brandId,
                    invoice: uploadedDocument,
                });
                return;
            }
            const invoice = {
                ...uploadedDocument,
                uploadId: file ? null : pendingUpload?.id,
                invoiceNumber,
                invoiceDate,
                foReference: invoiceFoReference,
                quantity: Number(invoiceQuantity),
                unitRatePaise: toPaise(unitRate),
                supplierGstin: supplierGstin.trim().toUpperCase(),
                recipientGstin: recipientGstin.trim().toUpperCase(),
                hsnCode: hsnCode.trim(),
                taxableValuePaise: toPaise(taxableValue),
                cgstPaise: toPaise(cgst),
                sgstPaise: toPaise(sgst),
                igstPaise: toPaise(igst),
                totalAmountPaise: toPaise(invoiceTotal),
            };
            adminMutation.mutate(invoice);
        } catch (error) {
            handleClientError(error);
        } finally {
            setIsUploading(false);
        }
    };

    const pending =
        isUploading || adminMutation.isPending || brandMutation.isPending;

    if (brandId) {
        return (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                    <h3 className="text-xs font-semibold text-slate-900">
                        Supplier invoice
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        Upload your invoice for this order.
                    </p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end">
                    <Field label="Invoice date">
                        <Input
                            type="date"
                            value={invoiceDate}
                            onChange={(event) =>
                                setInvoiceDate(event.target.value)
                            }
                        />
                    </Field>
                    <Field label="Invoice image or PDF">
                        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50">
                            <Upload className="size-3.5 shrink-0" />
                            <span className="truncate">
                                {file?.name ?? "Select file"}
                            </span>
                            <input
                                type="file"
                                accept="application/pdf,image/*"
                                className="sr-only"
                                onChange={(event) =>
                                    setFile(event.target.files?.[0] ?? null)
                                }
                            />
                        </label>
                    </Field>
                    <Button
                        className="h-9 text-xs"
                        disabled={pending}
                        onClick={submit}
                    >
                        {pending ? "Uploading..." : "Upload"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div>
                    <h3 className="text-xs font-semibold text-slate-900">
                        Supplier tax invoice
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        PO total {formatINR(expectedTotalPaise)}
                    </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
                    Optional
                </span>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Invoice number">
                    <Input
                        value={invoiceNumber}
                        onChange={(event) =>
                            setInvoiceNumber(event.target.value)
                        }
                    />
                </Field>
                <Field label="Invoice date">
                    <Input
                        type="date"
                        value={invoiceDate}
                        onChange={(event) => setInvoiceDate(event.target.value)}
                    />
                </Field>
                <Field label="FO reference">
                    <Input
                        value={invoiceFoReference}
                        onChange={(event) =>
                            setInvoiceFoReference(event.target.value)
                        }
                    />
                </Field>
                <Field label="Quantity">
                    <Input
                        type="number"
                        min="1"
                        value={invoiceQuantity}
                        onChange={(event) =>
                            setInvoiceQuantity(event.target.value)
                        }
                    />
                </Field>
                <Field label="Unit rate">
                    <MoneyInput value={unitRate} onChange={setUnitRate} />
                </Field>
                <Field label="Supplier GSTIN">
                    <Input
                        value={supplierGstin}
                        onChange={(event) =>
                            setSupplierGstin(event.target.value)
                        }
                    />
                </Field>
                <Field label="Renivet GSTIN">
                    <Input
                        value={recipientGstin}
                        onChange={(event) =>
                            setRecipientGstin(event.target.value)
                        }
                    />
                </Field>
                <Field label="HSN code">
                    <Input
                        value={hsnCode}
                        onChange={(event) => setHsnCode(event.target.value)}
                    />
                </Field>
                <Field label="Taxable value">
                    <MoneyInput
                        value={taxableValue}
                        onChange={setTaxableValue}
                    />
                </Field>
                <Field label="CGST">
                    <MoneyInput value={cgst} onChange={setCgst} />
                </Field>
                <Field label="SGST">
                    <MoneyInput value={sgst} onChange={setSgst} />
                </Field>
                <Field label="IGST">
                    <MoneyInput value={igst} onChange={setIgst} />
                </Field>
                <Field label="Invoice total">
                    <MoneyInput
                        value={invoiceTotal}
                        onChange={setInvoiceTotal}
                    />
                </Field>
                <Field label="Invoice file" className="md:col-span-2">
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50">
                        <Upload className="size-3.5 shrink-0" />
                        <span className="truncate">
                            {file?.name ??
                                pendingUpload?.fileName ??
                                "Select PDF or image"}
                        </span>
                        <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="sr-only"
                            onChange={(event) =>
                                setFile(event.target.files?.[0] ?? null)
                            }
                        />
                    </label>
                </Field>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-4 py-3">
                <Button
                    className="h-9 text-xs"
                    disabled={pending}
                    onClick={submit}
                >
                    {pending ? "Uploading..." : "Upload invoice"}
                </Button>
            </div>
        </div>
    );
}

function Field({
    label,
    className = "",
    children,
}: {
    label: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <label className={`space-y-1 ${className}`}>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {label}
            </span>
            {children}
        </label>
    );
}

function MoneyInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                ₹
            </span>
            <Input
                type="number"
                min="0"
                step="0.01"
                className="pl-7"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function toPaise(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

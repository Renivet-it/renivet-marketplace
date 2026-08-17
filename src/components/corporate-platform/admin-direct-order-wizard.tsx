"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, formatINR, handleClientError } from "@/lib/utils";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Copy,
    Loader2,
    Mail,
    ReceiptText,
    Upload,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

const STEPS = ["Company", "Product", "Branding", "Employee sizes", "Summary"];
const SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

function toggleValue(values: string[], value: string) {
    return values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
}

type PaymentMode = "request" | "offline";
type PaymentPlan = "full" | "partial";

function addressValue(source: any, ...keys: string[]) {
    for (const key of keys) {
        const value = source?.[key];
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
}

function uploadedFile(file: any, local: File) {
    return {
        name: file.name,
        url: file.url,
        key: file.key,
        size: file.size,
        type: file.type || local.type || "application/octet-stream",
    };
}

export function AdminDirectOrderWizard({
    po,
    onClose,
    onComplete,
}: {
    po: any | null;
    onClose: () => void;
    onComplete: () => Promise<void>;
}) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<any>({});
    const [brandingNotes, setBrandingNotes] = useState("");
    const [sizes, setSizes] = useState<Record<string, number>>({});
    const [artwork, setArtwork] = useState<File | null>(null);
    const [employeeSheet, setEmployeeSheet] = useState<File | null>(null);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>("request");
    const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("partial");
    const [partialPercent, setPartialPercent] = useState("30");
    const [offlineMethod, setOfflineMethod] = useState("bank_transfer");
    const [paymentReference, setPaymentReference] = useState("");
    const [paymentDate, setPaymentDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [paymentNotes, setPaymentNotes] = useState("");
    const [generatedUrl, setGeneratedUrl] = useState("");
    const { startUpload, isUploading } = useUploadThing(
        "corporateDocumentUploader"
    );
    const createOrder =
        trpc.general.corporatePlatform.reviewPurchaseOrder.useMutation();
    const { data: productConfig } =
        trpc.general.corporateOrders.getFormConfig.useQuery(undefined, {
            enabled: Boolean(po),
        });
    const createPaymentRequest =
        trpc.general.corporatePlatform.createAdminPaymentRequest.useMutation();
    const recordOffline =
        trpc.general.corporatePlatform.recordAdminOfflinePayment.useMutation();

    const quote = po?.quote;
    const profile = po?.profile ?? quote?.profile;
    const shipping = profile?.shippingAddress ?? {};
    useEffect(() => {
        if (!po) return;
        setStep(0);
        setForm({
            companyName: profile?.companyName ?? po.companyName ?? "",
            contactPersonName: profile?.contactPerson ?? "",
            emailAddress: profile?.email ?? "",
            mobileNumber: profile?.phone ?? "",
            gstNumber: profile?.gstNumber ?? "",
            deliveryCountry:
                addressValue(shipping, "deliveryCountry", "country") || "India",
            deliveryCity: addressValue(shipping, "deliveryCity", "city"),
            deliveryPincode: addressValue(
                shipping,
                "deliveryPincode",
                "pincode",
                "postalCode"
            ),
            deliveryAddress: addressValue(
                shipping,
                "deliveryAddress",
                "address",
                "addressLine1"
            ),
            productTypeId: quote?.productTypeId ?? "",
            gsmOptionId: quote?.gsmOptionId ?? "",
            fabricCompositionId: quote?.fabricCompositionId ?? "",
            colorOptionIds: [],
            customColorRequest: "",
            logoLocationIds: [],
            printMethodId: "",
            extraChargeRuleIds: [],
        });
        setBrandingNotes("");
        setSizes({});
        setArtwork(null);
        setEmployeeSheet(null);
        setPaymentMode("request");
        setPaymentPlan("partial");
        setPartialPercent("30");
        setPaymentReference("");
        setPaymentProof(null);
        setPaymentNotes("");
        setGeneratedUrl("");
    }, [po]);

    const quantity = quote?.quantity ?? 0;
    const totalPaise = quote?.totalAmountPaise ?? po?.poValuePaise ?? 0;
    const assignedSizes = Object.values(sizes).reduce(
        (sum, value) => sum + (Number(value) || 0),
        0
    );
    const paymentPercent = Math.min(
        100,
        Math.max(1, Number(partialPercent) || 0)
    );
    const amountPaise =
        paymentPlan === "full"
            ? totalPaise
            : Math.round((totalPaise * paymentPercent) / 100);

    const companyValid = useMemo(
        () =>
            form.companyName?.trim()?.length >= 2 &&
            form.contactPersonName?.trim()?.length >= 2 &&
            /^\S+@\S+\.\S+$/.test(form.emailAddress ?? "") &&
            form.mobileNumber?.trim()?.length >= 8 &&
            form.deliveryCountry?.trim()?.length >= 2 &&
            form.deliveryCity?.trim()?.length >= 2 &&
            form.deliveryPincode?.trim()?.length >= 3 &&
            form.deliveryAddress?.trim()?.length >= 5,
        [form]
    );
    const canContinue =
        step === 0
            ? companyValid
            : step === 3
              ? assignedSizes === quantity
              : true;
    const pending =
        createOrder.isPending ||
        createPaymentRequest.isPending ||
        recordOffline.isPending ||
        isUploading;

    const uploadOptional = async (file: File | null) => {
        if (!file) return null;
        const result = await startUpload([file]);
        if (!result?.[0]) throw new Error(`Could not upload ${file.name}`);
        return uploadedFile(result[0], file);
    };

    const submit = async () => {
        if (!po || !quote) return;
        if (paymentMode === "offline" && !paymentReference.trim())
            return toast.error("Enter the payment reference number");
        if (paymentMode === "offline" && !paymentProof)
            return toast.error("Upload the payment receipt or proof");
        try {
            const [artworkFile, employeeSheetFile] = await Promise.all([
                uploadOptional(artwork),
                uploadOptional(employeeSheet),
            ]);
            const acceptedPo = await createOrder.mutateAsync({
                purchaseOrderId: po.id,
                status: "po_accepted",
                reviewNotes:
                    "PO accepted and order configured in the finance workspace",
                validationSummary: po.validationSummary,
                orderSetup: {
                    ...form,
                    gstNumber: form.gstNumber?.trim() || null,
                    productTypeId: form.productTypeId || null,
                    gsmOptionId: form.gsmOptionId || null,
                    fabricCompositionId: form.fabricCompositionId || null,
                    colorOptionIds: form.colorOptionIds,
                    customColorRequest: form.customColorRequest?.trim() || null,
                    logoLocationIds: form.logoLocationIds,
                    printMethodId: form.printMethodId || null,
                    extraChargeRuleIds: form.extraChargeRuleIds,
                    brandingNotes: brandingNotes.trim() || null,
                    sizeBreakdown: sizes,
                    artworkFile,
                    employeeSheetFile,
                },
            });
            const orderId = acceptedPo.corporateOrderId;
            if (!orderId)
                throw new Error("The corporate order was not created");

            if (paymentMode === "request") {
                const request = await createPaymentRequest.mutateAsync({
                    orderId,
                    amountPaise,
                    paymentType: paymentPlan,
                    expiresInDays: 7,
                    notes: paymentNotes.trim() || null,
                    sendEmail: true,
                });
                setGeneratedUrl(request.paymentUrl);
                toast.success(
                    `Order created and payment link sent to ${form.emailAddress}`
                );
            } else {
                const proofFile = await uploadOptional(paymentProof);
                const result = await recordOffline.mutateAsync({
                    orderId,
                    paymentRequestId: null,
                    amountPaise,
                    paymentType: paymentPlan,
                    paymentMode: offlineMethod as any,
                    paymentReference: paymentReference.trim(),
                    paymentDate,
                    proofFile,
                    notes: paymentNotes.trim() || null,
                });
                toast.success(
                    `Order created and payment recorded. Receipt ${result.receiptVoucher?.voucherNumber ?? "issued"}`
                );
            }
            await onComplete();
            if (paymentMode === "offline") onClose();
        } catch (error) {
            handleClientError(error);
        }
    };

    return (
        <Dialog open={Boolean(po)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden rounded-xl p-0">
                <DialogHeader className="border-b border-slate-200 px-6 py-4">
                    <DialogTitle className="text-sm">
                        Set up direct corporate order
                    </DialogTitle>
                    <DialogDescription className="text-[11px]">
                        {po?.poNumber} · {quote?.quoteNumber} · approved
                        commercial terms
                    </DialogDescription>
                </DialogHeader>

                <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
                    <div className="grid grid-cols-5 gap-1">
                        {STEPS.map((label, index) => (
                            <div key={label} className="min-w-0 text-center">
                                <div className="flex items-center">
                                    <span
                                        className={cn(
                                            "h-px flex-1",
                                            index
                                                ? "bg-slate-300"
                                                : "bg-transparent"
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "grid size-7 shrink-0 place-items-center rounded-full border text-11 font-semibold",
                                            index < step &&
                                                "border-emerald-600 bg-emerald-600 text-white",
                                            index === step &&
                                                "border-slate-950 bg-slate-950 text-white",
                                            index > step &&
                                                "border-slate-300 bg-white text-slate-500"
                                        )}
                                    >
                                        {index < step ? (
                                            <Check className="size-3.5" />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <span
                                        className={cn(
                                            "h-px flex-1",
                                            index < STEPS.length - 1
                                                ? "bg-slate-300"
                                                : "bg-transparent"
                                        )}
                                    />
                                </div>
                                <p className="mt-1 truncate text-[10px] font-medium text-slate-600">
                                    {label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    {step === 0 && (
                        <Section
                            title="Business & delivery information"
                            note="Confirm where production and delivery updates should be sent."
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                    label="Business name"
                                    value={form.companyName}
                                    onChange={(value) =>
                                        setForm({ ...form, companyName: value })
                                    }
                                />
                                <TextField
                                    label="Contact person"
                                    value={form.contactPersonName}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            contactPersonName: value,
                                        })
                                    }
                                />
                                <TextField
                                    label="Email address"
                                    type="email"
                                    value={form.emailAddress}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            emailAddress: value,
                                        })
                                    }
                                />
                                <TextField
                                    label="Mobile number"
                                    value={form.mobileNumber}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            mobileNumber: value,
                                        })
                                    }
                                />
                                <TextField
                                    label="GSTIN (optional)"
                                    value={form.gstNumber}
                                    onChange={(value) =>
                                        setForm({ ...form, gstNumber: value })
                                    }
                                />
                                <TextField
                                    label="Country"
                                    value={form.deliveryCountry}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            deliveryCountry: value,
                                        })
                                    }
                                />
                                <TextField
                                    label="City"
                                    value={form.deliveryCity}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            deliveryCity: value,
                                        })
                                    }
                                />
                                <TextField
                                    label="Pincode"
                                    value={form.deliveryPincode}
                                    onChange={(value) =>
                                        setForm({
                                            ...form,
                                            deliveryPincode: value,
                                        })
                                    }
                                />
                                <div className="sm:col-span-2">
                                    <TextField
                                        label="Shipping address"
                                        value={form.deliveryAddress}
                                        onChange={(value) =>
                                            setForm({
                                                ...form,
                                                deliveryAddress: value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {step === 1 && (
                        <Section
                            title="Approved product configuration"
                            note="Approved selections are prefilled. Change them only when the customer has confirmed an amendment."
                        >
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                                <SummaryCell
                                    label="Quote"
                                    value={quote?.quoteNumber}
                                />
                                <SummaryCell
                                    label="Fulfilling brand"
                                    value={
                                        quote?.brand?.name ?? "Assigned brand"
                                    }
                                />
                                <SummaryCell
                                    label="Quantity"
                                    value={`${quantity} units`}
                                />
                                <SummaryCell
                                    label="Order value"
                                    value={formatINR(totalPaise)}
                                />
                                <SummaryCell
                                    label="Delivery due"
                                    value={po?.deliveryDate ?? "Not specified"}
                                />
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <SelectField
                                    label="Product type"
                                    value={form.productTypeId ?? ""}
                                    onChange={(productTypeId) =>
                                        setForm({ ...form, productTypeId })
                                    }
                                    options={[
                                        ["", "Select product type"],
                                        ...(
                                            productConfig?.productTypes ?? []
                                        ).map(
                                            (item: any) =>
                                                [item.id, item.name] as [
                                                    string,
                                                    string,
                                                ]
                                        ),
                                    ]}
                                />
                                <SelectField
                                    label="GSM"
                                    value={form.gsmOptionId ?? ""}
                                    onChange={(gsmOptionId) =>
                                        setForm({ ...form, gsmOptionId })
                                    }
                                    options={[
                                        ["", "Select GSM"],
                                        ...(
                                            productConfig?.gsmOptions ?? []
                                        ).map(
                                            (item: any) =>
                                                [item.id, item.label] as [
                                                    string,
                                                    string,
                                                ]
                                        ),
                                    ]}
                                />
                                <SelectField
                                    label="Fabric composition"
                                    value={form.fabricCompositionId ?? ""}
                                    onChange={(fabricCompositionId) =>
                                        setForm({
                                            ...form,
                                            fabricCompositionId,
                                        })
                                    }
                                    options={[
                                        ["", "Select fabric"],
                                        ...(
                                            productConfig?.fabricCompositions ??
                                            []
                                        ).map(
                                            (item: any) =>
                                                [item.id, item.name] as [
                                                    string,
                                                    string,
                                                ]
                                        ),
                                    ]}
                                />
                            </div>
                        </Section>
                    )}

                    {step === 2 && (
                        <Section
                            title="Branding, placement & artwork"
                            note="Choose garment colours, logo placement, print method and production extras."
                        >
                            <OptionBlock title="Garment colours">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {(productConfig?.colorOptions ?? []).map(
                                        (item: any) => (
                                            <ToggleOption
                                                key={item.id}
                                                active={form.colorOptionIds.includes(
                                                    item.id
                                                )}
                                                onClick={() =>
                                                    setForm({
                                                        ...form,
                                                        colorOptionIds:
                                                            toggleValue(
                                                                form.colorOptionIds,
                                                                item.id
                                                            ),
                                                    })
                                                }
                                            >
                                                <span
                                                    className="size-4 shrink-0 rounded-sm border border-slate-200"
                                                    style={{
                                                        backgroundColor:
                                                            item.hexCode ??
                                                            "#e2e8f0",
                                                    }}
                                                />
                                                {item.name}
                                            </ToggleOption>
                                        )
                                    )}
                                </div>
                                {(productConfig?.colorOptions ?? []).some(
                                    (item: any) =>
                                        item.isCustom &&
                                        form.colorOptionIds.includes(item.id)
                                ) && (
                                    <div className="mt-2 max-w-md">
                                        <TextField
                                            label="Custom colour request"
                                            value={form.customColorRequest}
                                            onChange={(customColorRequest) =>
                                                setForm({
                                                    ...form,
                                                    customColorRequest,
                                                })
                                            }
                                        />
                                    </div>
                                )}
                            </OptionBlock>

                            <OptionBlock title="Logo placement">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {(productConfig?.logoLocations ?? []).map(
                                        (item: any) => (
                                            <ToggleOption
                                                key={item.id}
                                                active={form.logoLocationIds.includes(
                                                    item.id
                                                )}
                                                onClick={() =>
                                                    setForm({
                                                        ...form,
                                                        logoLocationIds:
                                                            toggleValue(
                                                                form.logoLocationIds,
                                                                item.id
                                                            ),
                                                    })
                                                }
                                            >
                                                <span>
                                                    <b className="block text-[11px]">
                                                        {item.name}
                                                    </b>
                                                    <span className="text-[9px] opacity-65">
                                                        {item.placementGroup
                                                            ? `${item.placementGroup} placement`
                                                            : "Garment placement"}
                                                    </span>
                                                </span>
                                            </ToggleOption>
                                        )
                                    )}
                                </div>
                            </OptionBlock>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <SelectField
                                    label="Printing method"
                                    value={form.printMethodId}
                                    onChange={(printMethodId) =>
                                        setForm({ ...form, printMethodId })
                                    }
                                    options={[
                                        ["", "Select printing method"],
                                        ...(
                                            productConfig?.printMethods ?? []
                                        ).map(
                                            (item: any) =>
                                                [item.id, item.name] as [
                                                    string,
                                                    string,
                                                ]
                                        ),
                                    ]}
                                />
                                <div>
                                    <p className="mb-1.5 text-xs font-medium text-slate-700">
                                        Optional extras
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {(productConfig?.extraChargeRules ?? [])
                                            .filter(
                                                (item: any) =>
                                                    item.code !==
                                                    "additional_logo_location"
                                            )
                                            .map((item: any) => (
                                                <ToggleOption
                                                    key={item.id}
                                                    active={form.extraChargeRuleIds.includes(
                                                        item.id
                                                    )}
                                                    onClick={() =>
                                                        setForm({
                                                            ...form,
                                                            extraChargeRuleIds:
                                                                toggleValue(
                                                                    form.extraChargeRuleIds,
                                                                    item.id
                                                                ),
                                                        })
                                                    }
                                                >
                                                    {item.name}
                                                </ToggleOption>
                                            ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <UploadField
                                    label="Artwork / logo (optional)"
                                    file={artwork}
                                    setFile={setArtwork}
                                    accept=".pdf,.png,.jpg,.jpeg"
                                />
                                <div>
                                    <label className="text-xs font-medium text-slate-700">
                                        Branding instructions
                                    </label>
                                    <textarea
                                        value={brandingNotes}
                                        onChange={(event) =>
                                            setBrandingNotes(event.target.value)
                                        }
                                        placeholder="Placement, print method, colour notes or production instructions"
                                        className="mt-1.5 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-slate-400"
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {step === 3 && (
                        <Section
                            title="Employee sizes"
                            note={`Allocate all ${quantity} units by size, or attach the employee sheet for production reference.`}
                        >
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                                {SIZES.map((size) => (
                                    <label
                                        key={size}
                                        className="rounded-lg border border-slate-200 p-2"
                                    >
                                        <span className="text-10 font-semibold text-slate-500">
                                            {size}
                                        </span>
                                        <Input
                                            type="number"
                                            min="0"
                                            max={Math.max(
                                                0,
                                                quantity -
                                                    (assignedSizes -
                                                        (sizes[size] ?? 0))
                                            )}
                                            value={sizes[size] ?? ""}
                                            onChange={(event) => {
                                                const otherSizesTotal =
                                                    assignedSizes -
                                                    (sizes[size] ?? 0);
                                                const remainingForSize =
                                                    Math.max(
                                                        0,
                                                        quantity -
                                                            otherSizesTotal
                                                    );
                                                const requested = Math.max(
                                                    0,
                                                    Math.floor(
                                                        Number(
                                                            event.target.value
                                                        ) || 0
                                                    )
                                                );
                                                setSizes({
                                                    ...sizes,
                                                    [size]: Math.min(
                                                        requested,
                                                        remainingForSize
                                                    ),
                                                });
                                            }}
                                            className="mt-1 h-8 px-2 text-xs"
                                        />
                                    </label>
                                ))}
                            </div>
                            <div
                                className={cn(
                                    "mt-3 rounded-lg border px-3 py-2 text-xs",
                                    assignedSizes === quantity
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        : "border-amber-200 bg-amber-50 text-amber-800"
                                )}
                            >
                                Assigned {assignedSizes} of {quantity} units
                                {assignedSizes === quantity
                                    ? " — complete"
                                    : assignedSizes < quantity
                                      ? ` — ${quantity - assignedSizes} remaining`
                                      : ` — ${assignedSizes - quantity} over the order quantity`}
                                .
                            </div>
                            <div className="mt-4 max-w-md">
                                <UploadField
                                    label="Employee size sheet (optional)"
                                    file={employeeSheet}
                                    setFile={setEmployeeSheet}
                                    accept=".xlsx,.xls,.pdf"
                                />
                            </div>
                        </Section>
                    )}

                    {step === 4 && (
                        <Section
                            title="Order summary & payment"
                            note="Create the order, then send a payment link or record a payment already received."
                        >
                            <div className="grid gap-2 sm:grid-cols-4">
                                <SummaryCell
                                    label="Customer"
                                    value={form.companyName}
                                />
                                <SummaryCell
                                    label="Quote / PO"
                                    value={`${quote?.quoteNumber} / ${po?.poNumber}`}
                                />
                                <SummaryCell
                                    label="Units"
                                    value={String(quantity)}
                                />
                                <SummaryCell
                                    label="Total"
                                    value={formatINR(totalPaise)}
                                />
                            </div>
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                <ChoiceGroup title="Collection method">
                                    <Choice
                                        active={paymentMode === "request"}
                                        onClick={() =>
                                            setPaymentMode("request")
                                        }
                                        icon={<Mail />}
                                        title="Send payment link"
                                        text="Email a secure link and show Pay Now in the registered customer's account."
                                    />
                                    <Choice
                                        active={paymentMode === "offline"}
                                        onClick={() =>
                                            setPaymentMode("offline")
                                        }
                                        icon={<ReceiptText />}
                                        title="Already paid"
                                        text="Record a verified payment and issue a receipt voucher."
                                    />
                                </ChoiceGroup>
                                <ChoiceGroup title="Amount to collect">
                                    <Choice
                                        active={paymentPlan === "full"}
                                        onClick={() => setPaymentPlan("full")}
                                        title="Full payment"
                                        text={formatINR(totalPaise)}
                                    />
                                    <Choice
                                        active={paymentPlan === "partial"}
                                        onClick={() =>
                                            setPaymentPlan("partial")
                                        }
                                        title="Partial / advance"
                                        text={formatINR(amountPaise)}
                                    />
                                    {paymentPlan === "partial" && (
                                        <TextField
                                            label="Advance percentage"
                                            type="number"
                                            value={partialPercent}
                                            onChange={setPartialPercent}
                                        />
                                    )}
                                </ChoiceGroup>
                            </div>
                            {paymentMode === "offline" && (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <SelectField
                                        label="Payment mode"
                                        value={offlineMethod}
                                        onChange={setOfflineMethod}
                                        options={[
                                            ["bank_transfer", "Bank transfer"],
                                            ["neft", "NEFT"],
                                            ["rtgs", "RTGS"],
                                            ["upi", "UPI"],
                                            [
                                                "manual",
                                                "Other verified payment",
                                            ],
                                        ]}
                                    />
                                    <TextField
                                        label="Payment date"
                                        type="date"
                                        value={paymentDate}
                                        onChange={setPaymentDate}
                                    />
                                    <TextField
                                        label="Transaction / bank reference"
                                        value={paymentReference}
                                        onChange={setPaymentReference}
                                    />
                                    <UploadField
                                        label="Payment receipt / proof"
                                        file={paymentProof}
                                        setFile={setPaymentProof}
                                        accept=".pdf,.png,.jpg,.jpeg"
                                    />
                                </div>
                            )}
                            <div className="mt-4">
                                <TextField
                                    label="Payment note (optional)"
                                    value={paymentNotes}
                                    onChange={setPaymentNotes}
                                />
                            </div>
                            {generatedUrl && (
                                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                                    <Input
                                        value={generatedUrl}
                                        readOnly
                                        className="h-8 bg-white text-11"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(
                                                generatedUrl
                                            );
                                            toast.success(
                                                "Payment link copied"
                                            );
                                        }}
                                    >
                                        <Copy /> Copy
                                    </Button>
                                </div>
                            )}
                        </Section>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pending || step === 0}
                        onClick={() => setStep((value) => value - 1)}
                    >
                        <ArrowLeft /> Back
                    </Button>
                    <div className="text-11 text-slate-500">
                        Step {step + 1} of {STEPS.length}
                    </div>
                    {step < STEPS.length - 1 ? (
                        <Button
                            size="sm"
                            disabled={!canContinue}
                            onClick={() => setStep((value) => value + 1)}
                        >
                            Continue <ArrowRight />
                        </Button>
                    ) : generatedUrl ? (
                        <Button size="sm" onClick={onClose}>
                            Done
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            disabled={pending || amountPaise <= 0}
                            onClick={submit}
                        >
                            {pending && <Loader2 className="animate-spin" />}
                            {paymentMode === "request"
                                ? "Create order & send link"
                                : "Create order & record payment"}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Section({
    title,
    note,
    children,
}: {
    title: string;
    note: string;
    children: ReactNode;
}) {
    return (
        <section>
            <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-[11px] text-slate-500">{note}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function OptionBlock({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
            {children}
        </div>
    );
}

function ToggleOption({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] font-medium transition-colors",
                active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
        >
            {children}
        </button>
    );
}

function TextField({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-slate-700">{label}</span>
            <Input
                type={type}
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1.5 h-9 text-xs"
            />
        </label>
    );
}

function UploadField({
    label,
    file,
    setFile,
    accept,
}: {
    label: string;
    file: File | null;
    setFile: (file: File | null) => void;
    accept: string;
}) {
    return (
        <label className="block rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Upload className="size-3.5" />
                {label}
            </span>
            <input
                type="file"
                accept={accept}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-3 block w-full text-11 text-slate-600"
            />
            {file && (
                <span className="mt-2 block truncate text-11 text-slate-500">
                    {file.name}
                </span>
            )}
        </label>
    );
}

function SummaryCell({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                {label}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-900">
                {value || "—"}
            </p>
        </div>
    );
}

function ChoiceGroup({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div>
            <p className="mb-2 text-xs font-semibold text-slate-800">{title}</p>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function Choice({
    active,
    onClick,
    icon,
    title,
    text,
}: {
    active: boolean;
    onClick: () => void;
    icon?: ReactNode;
    title: string;
    text: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left",
                active
                    ? "border-slate-950 bg-slate-50 ring-1 ring-slate-950"
                    : "border-slate-200 bg-white"
            )}
        >
            <span
                className={cn(
                    "mt-0.5 grid size-5 place-items-center rounded-full border",
                    active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-300 text-slate-500"
                )}
            >
                {icon ? (
                    <span className="[&>svg]:size-3">{icon}</span>
                ) : active ? (
                    <Check className="size-3" />
                ) : null}
            </span>
            <span>
                <b className="block text-xs text-slate-900">{title}</b>
                <span className="mt-0.5 block text-11 text-slate-500">
                    {text}
                </span>
            </span>
        </button>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<[string, string]>;
}) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-slate-700">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
            >
                {options.map(([key, text]) => (
                    <option key={key} value={key}>
                        {text}
                    </option>
                ))}
            </select>
        </label>
    );
}

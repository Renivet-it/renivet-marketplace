"use client";

import { env } from "@/../env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import { Input } from "@/components/ui/input-general";
import { Spinner } from "@/components/ui/spinner";
import { initializeRazorpayPayment } from "@/lib/razorpay/payment";
import { trpc } from "@/lib/trpc/client";
import type { CorporateOrderFormInput } from "@/lib/validations/corporate-order";
import { cn, formatINR, handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import * as XLSX from "xlsx";
import { Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const STEPS = [
    "Company",
    "Product",
    "Branding",
    "Employee Sizes",
    "Summary",
] as const;

type UploadedFile = {
    name: string;
    size: number;
    url: string;
    key?: string;
    type: string;
};

type CorporateOrderPagePrefill = {
    companyName?: string;
    contactPersonName?: string;
    emailAddress?: string;
    mobileNumber?: string;
    gstNumber?: string;
    deliveryAddress?: string;
    numberOfEmployees?: number;
    quantity?: number;
    customerNotes?: string;
    paymentPreference?: "partial_advance" | "full_upfront";
};

export function CorporateOrderPage({
    initialPrefill,
}: {
    initialPrefill?: CorporateOrderPagePrefill;
}) {
    const router = useRouter();
    const { data: user } = trpc.general.users.currentUser.useQuery();
    const { data: config, isLoading } =
        trpc.general.corporateOrders.getFormConfig.useQuery();
    const { startUpload: uploadArtwork } = useUploadThing(
        "corporateArtworkUploader"
    );
    const { startUpload: uploadEmployeeSheet } = useUploadThing(
        "corporateEmployeeSheetUploader"
    );
    const [step, setStep] = useState(0);
    const [isQuoting, setIsQuoting] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [artworkLocalFile, setArtworkLocalFile] = useState<File | null>(null);
    const [employeeLocalFile, setEmployeeLocalFile] = useState<File | null>(null);
    const [artworkUploaded, setArtworkUploaded] = useState<UploadedFile | null>(
        null
    );
    const [employeeSheetUploaded, setEmployeeSheetUploaded] =
        useState<UploadedFile | null>(null);
    const [employeeRows, setEmployeeRows] = useState<
        Array<{ employeeName: string; size: string }>
    >([]);
    const [quote, setQuote] = useState<any>(null);
    const [form, setForm] = useState({
        companyName: initialPrefill?.companyName ?? "",
        contactPersonName:
            initialPrefill?.contactPersonName ??
            (user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : ""),
        emailAddress: initialPrefill?.emailAddress ?? user?.email ?? "",
        mobileNumber: initialPrefill?.mobileNumber ?? user?.phone ?? "",
        gstNumber: initialPrefill?.gstNumber ?? "",
        deliveryAddress: initialPrefill?.deliveryAddress ?? "",
        numberOfEmployees: initialPrefill?.numberOfEmployees ?? 0,
        productTypeId: "",
        gsmOptionId: "",
        fabricCompositionId: "",
        colorOptionIds: [] as string[],
        customColorRequest: "",
        quantity: initialPrefill?.quantity ?? 0,
        logoLocationIds: [] as string[],
        printMethodId: "",
        extraChargeRuleIds: [] as string[],
        paymentPreference: (initialPrefill?.paymentPreference ??
            "partial_advance") as
            | "partial_advance"
            | "full_upfront",
        customerNotes: initialPrefill?.customerNotes ?? "",
    });

    useEffect(() => {
        if (!user) return;

        setForm((current) => ({
            ...current,
            contactPersonName:
                current.contactPersonName ||
                `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            emailAddress: current.emailAddress || user.email || "",
            mobileNumber: current.mobileNumber || user.phone || "",
        }));
    }, [user]);

    const createAdvanceMutation =
        trpc.general.corporateOrders.createAdvancePaymentOrder.useMutation({
            onError: (error) => handleClientError(error),
        });
    const confirmPaymentMutation =
        trpc.general.corporateOrders.confirmAdvancePayment.useMutation({
            onError: (error) => handleClientError(error),
        });
    const quoteMutation = trpc.general.corporateOrders.getQuote.useMutation({
        onError: (error) => handleClientError(error),
    });

    const selectedColorIds = new Set(form.colorOptionIds);
    const selectedLogoLocationIds = new Set(form.logoLocationIds);
    const selectedExtraChargeRuleIds = new Set(form.extraChargeRuleIds);
    const configuredAdvancePercent =
        config ? Math.round(config.settings.advancePercentBps / 100) : 30;
    const initialPaymentLabel = quote
        ? quote.balanceDuePaise === 0
            ? "100% upfront payment"
            : `${Math.round(quote.advancePercentBps / 100)}% advance payment`
        : form.paymentPreference === "full_upfront"
          ? "100% upfront payment"
          : `${configuredAdvancePercent}% advance payment`;

    const canAdvance = useMemo(() => {
        return (
            !!form.companyName &&
            !!form.contactPersonName &&
            !!form.emailAddress &&
            !!form.mobileNumber &&
            !!form.deliveryAddress &&
            form.numberOfEmployees > 0 &&
            !!form.productTypeId &&
            !!form.gsmOptionId &&
            !!form.fabricCompositionId &&
            form.colorOptionIds.length > 0 &&
            form.logoLocationIds.length > 0 &&
            !!form.printMethodId &&
            !!artworkLocalFile &&
            !!employeeLocalFile &&
            employeeRows.length > 0
        );
    }, [artworkLocalFile, employeeLocalFile, employeeRows.length, form]);

    const getPayload = (
        artworkFile: UploadedFile | null,
        employeeSheetFile: UploadedFile | null
    ): CorporateOrderFormInput => {
        if (!artworkFile || !employeeSheetFile) {
            throw new Error("Both files must be uploaded before continuing");
        }

        return {
            ...form,
            gstNumber: form.gstNumber || null,
            customColorRequest: form.customColorRequest || null,
            customerNotes: form.customerNotes || null,
            quantity:
                form.quantity > 0 ? form.quantity : Math.max(employeeRows.length, 1),
            artworkFile,
            employeeSheetFile,
            employeeRows: employeeRows.map((row) => ({
                employeeName: row.employeeName,
                size: row.size.toUpperCase() as
                    | "XS"
                    | "S"
                    | "M"
                    | "L"
                    | "XL"
                    | "XXL"
                    | "XXXL",
            })),
        };
    };

    const refreshQuote = async () => {
        try {
            if (!artworkLocalFile || !employeeLocalFile) {
                return toast.error("Please attach both artwork and employee sheet");
            }

            setIsQuoting(true);
            const quoteResult = await quoteMutation.mutateAsync(
                getPayload(
                    artworkUploaded ?? {
                        name: artworkLocalFile.name,
                        size: artworkLocalFile.size,
                        type: artworkLocalFile.type || "application/octet-stream",
                        url: "https://example.com/pending-artwork",
                    },
                    employeeSheetUploaded ?? {
                        name: employeeLocalFile.name,
                        size: employeeLocalFile.size,
                        type:
                            employeeLocalFile.type || "application/octet-stream",
                        url: "https://example.com/pending-sheet",
                    }
                )
            );
            setQuote(quoteResult);
            setStep(4);
        } finally {
            setIsQuoting(false);
        }
    };

    const parseEmployeeSheet = async (file: File) => {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
            defval: "",
        });

        if (!rows.length) {
            throw new Error("The uploaded size sheet is empty");
        }

        const parsedRows = rows
            .map((row) => {
                const normalized = Object.fromEntries(
                    Object.entries(row).map(([key, value]) => [
                        key.trim().toLowerCase(),
                        String(value ?? "").trim(),
                    ])
                );

                return {
                    employeeName:
                        normalized["employee name"] ||
                        normalized["employee"] ||
                        normalized["name"] ||
                        "",
                    size: (normalized["size"] || "").toUpperCase(),
                };
            })
            .filter((row) => row.employeeName || row.size);

        const hasInvalid = parsedRows.some(
            (row) =>
                !row.employeeName ||
                !["XS", "S", "M", "L", "XL", "XXL", "XXXL"].includes(row.size)
        );
        if (hasInvalid) {
            throw new Error(
                "Employee sheet must contain 'Employee Name' and valid size values"
            );
        }

        setEmployeeRows(parsedRows);
        setForm((current) => ({
            ...current,
            numberOfEmployees: parsedRows.length,
            quantity: parsedRows.length,
        }));
    };

    const uploadRequiredFiles = async () => {
        if (!artworkLocalFile || !employeeLocalFile) {
            throw new Error("Please upload the artwork file and employee sheet");
        }

        const [artworkResponse, sheetResponse] = await Promise.all([
            artworkUploaded
                ? [artworkUploaded]
                : uploadArtwork([artworkLocalFile]),
            employeeSheetUploaded
                ? [employeeSheetUploaded]
                : uploadEmployeeSheet([employeeLocalFile]),
        ]);

        const artworkFile = {
            name: artworkResponse?.[0]?.name ?? artworkLocalFile.name,
            size: artworkResponse?.[0]?.size ?? artworkLocalFile.size,
            url: artworkResponse?.[0]?.url ?? "",
            key: artworkResponse?.[0]?.key,
            type:
                (artworkResponse?.[0] as any)?.type ??
                artworkLocalFile.type ??
                "application/octet-stream",
        };
        const sheetFile = {
            name: sheetResponse?.[0]?.name ?? employeeLocalFile.name,
            size: sheetResponse?.[0]?.size ?? employeeLocalFile.size,
            url: sheetResponse?.[0]?.url ?? "",
            key: sheetResponse?.[0]?.key,
            type:
                (sheetResponse?.[0] as any)?.type ??
                employeeLocalFile.type ??
                "application/octet-stream",
        };

        setArtworkUploaded(artworkFile);
        setEmployeeSheetUploaded(sheetFile);

        return { artworkFile, sheetFile };
    };

    const handleProceedToPayment = async () => {
        try {
            if (!canAdvance) {
                return toast.error("Please complete all required fields first");
            }

            setIsPaying(true);
            const { artworkFile, sheetFile } = await uploadRequiredFiles();
            const payload = getPayload(artworkFile, sheetFile);
            const created =
                await createAdvanceMutation.mutateAsync(payload);

            const options = {
                key: env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID,
                amount: created.razorpay.amount,
                currency: created.razorpay.currency,
                name: created.razorpay.name,
                description: created.razorpay.description,
                order_id: created.razorpay.orderId,
                prefill: {
                    name: form.contactPersonName,
                    email: form.emailAddress,
                    contact: form.mobileNumber,
                },
                theme: {
                    color: "#5B9BD5",
                },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    const confirmation =
                        await confirmPaymentMutation.mutateAsync({
                            corporateOrderId: created.order.id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                    router.push(confirmation.confirmationHref);
                },
                modal: {
                    ondismiss: () => {
                        setIsPaying(false);
                    },
                },
            };

            initializeRazorpayPayment(options as any);
        } catch (error) {
            handleClientError(error);
            setIsPaying(false);
        }
    };

    if (isLoading || !config) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Spinner className="size-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[28px] border border-[#dbe5f0] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9fd_55%,#edf4fb_100%)] p-5 shadow-[0_24px_70px_-48px_rgba(57,91,124,0.28)] md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5B9BD5]">
                        Corporate Apparel Orders
                    </p>
                    <h1 className="mt-3 font-serif text-3xl font-semibold text-[#1f2937] md:text-4xl">
                        Configure, quote, and place bulk apparel orders
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#64748b]">
                        Upload your branding artwork and employee size sheet,
                        review live pricing, choose how much to collect now, and
                        place a polished corporate order in the Renivet flow.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                            Professional bulk ordering
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-blue-200 bg-white text-blue-700"
                        >
                            {initialPaymentLabel}
                        </Badge>
                    </div>
                    <div className="mt-6 grid gap-2 md:grid-cols-5">
                        {STEPS.map((label, index) => (
                            <div
                                key={label}
                                className={cn(
                                    "rounded-full border px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em]",
                                    index <= step
                                        ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                        : "border-[#d9e4ef] bg-white/80 text-[#64748b]"
                                )}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
                <div className="space-y-6">
                    {step === 0 && (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Company Information
                            </h2>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <Input
                                    placeholder="Company Name"
                                    value={form.companyName}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            companyName: e.target.value,
                                        }))
                                    }
                                />
                                <Input
                                    placeholder="Contact Person Name"
                                    value={form.contactPersonName}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            contactPersonName: e.target.value,
                                        }))
                                    }
                                />
                                <Input
                                    placeholder="Email Address"
                                    type="email"
                                    value={form.emailAddress}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            emailAddress: e.target.value,
                                        }))
                                    }
                                />
                                <Input
                                    placeholder="Mobile Number"
                                    value={form.mobileNumber}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            mobileNumber: e.target.value,
                                        }))
                                    }
                                />
                                <Input
                                    placeholder="GST Number (Optional)"
                                    value={form.gstNumber}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            gstNumber: e.target.value,
                                        }))
                                    }
                                />
                                <Input
                                    placeholder="Number of Employees"
                                    type="number"
                                    value={form.numberOfEmployees || ""}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            numberOfEmployees: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <textarea
                                className="mt-4 min-h-32 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Delivery Address"
                                value={form.deliveryAddress}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        deliveryAddress: e.target.value,
                                    }))
                                }
                            />
                        </section>
                    )}

                    {step === 1 && (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Product Configuration
                            </h2>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <select
                                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                                    value={form.productTypeId}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            productTypeId: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Select Product Type</option>
                                    {config.productTypes.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                                    value={form.gsmOptionId}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            gsmOptionId: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Select GSM</option>
                                    {config.gsmOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                                    value={form.fabricCompositionId}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            fabricCompositionId: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Select Fabric Composition</option>
                                    {config.fabricCompositions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    placeholder="Quantity"
                                    type="number"
                                    value={form.quantity || ""}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            quantity: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>

                            <div className="mt-5">
                                <p className="text-sm font-semibold text-slate-900">
                                    Select Colors
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {config.colorOptions.map((color) => {
                                        const checked = selectedColorIds.has(color.id);
                                        return (
                                            <button
                                                type="button"
                                                key={color.id}
                                                className={cn(
                                                    "rounded-full border px-3 py-2 text-sm",
                                                    checked
                                                        ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                                        : "border-slate-200 bg-white text-slate-700"
                                                )}
                                                onClick={() =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        colorOptionIds: checked
                                                            ? current.colorOptionIds.filter(
                                                                  (item) =>
                                                                      item !== color.id
                                                              )
                                                            : [
                                                                  ...current.colorOptionIds,
                                                                  color.id,
                                                              ],
                                                    }))
                                                }
                                            >
                                                {color.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <textarea
                                    className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                                    placeholder="Custom color request (optional)"
                                    value={form.customColorRequest}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            customColorRequest: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </section>
                    )}

                    {step === 2 && (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Branding Requirements
                            </h2>
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Logo Placement
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {config.logoLocations.map((location) => {
                                        const checked = selectedLogoLocationIds.has(
                                            location.id
                                        );
                                        return (
                                            <button
                                                type="button"
                                                key={location.id}
                                                className={cn(
                                                    "rounded-full border px-3 py-2 text-sm",
                                                    checked
                                                        ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                                        : "border-slate-200 bg-white text-slate-700"
                                                )}
                                                onClick={() =>
                                                    setForm((current) => ({
                                                        ...current,
                                                        logoLocationIds: checked
                                                            ? current.logoLocationIds.filter(
                                                                  (item) =>
                                                                      item !== location.id
                                                              )
                                                            : [
                                                                  ...current.logoLocationIds,
                                                                  location.id,
                                                              ],
                                                    }))
                                                }
                                            >
                                                {location.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <select
                                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
                                    value={form.printMethodId}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            printMethodId: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Select Printing Method</option>
                                    {config.printMethods.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-5">
                                <p className="text-sm font-semibold text-slate-900">
                                    Optional Extras
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {config.extraChargeRules
                                        .filter(
                                            (item) =>
                                                item.code !==
                                                "additional_logo_location"
                                        )
                                        .map((item) => {
                                            const checked =
                                                selectedExtraChargeRuleIds.has(
                                                    item.id
                                                );
                                            return (
                                                <button
                                                    type="button"
                                                    key={item.id}
                                                    className={cn(
                                                        "rounded-full border px-3 py-2 text-sm",
                                                        checked
                                                            ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                                            : "border-slate-200 bg-white text-slate-700"
                                                    )}
                                                    onClick={() =>
                                                        setForm((current) => ({
                                                            ...current,
                                                            extraChargeRuleIds:
                                                                checked
                                                                    ? current.extraChargeRuleIds.filter(
                                                                          (
                                                                              value
                                                                          ) =>
                                                                              value !==
                                                                              item.id
                                                                      )
                                                                    : [
                                                                          ...current.extraChargeRuleIds,
                                                                          item.id,
                                                                      ],
                                                        }))
                                                    }
                                                >
                                                    {item.name}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Payment Choice
                                </p>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <button
                                        type="button"
                                        className={cn(
                                            "rounded-2xl border px-4 py-4 text-left transition-colors",
                                            form.paymentPreference ===
                                                "partial_advance"
                                                ? "border-[#5B9BD5] bg-blue-50"
                                                : "border-slate-200 bg-white"
                                        )}
                                        onClick={() =>
                                            setForm((current) => ({
                                                ...current,
                                                paymentPreference:
                                                    "partial_advance",
                                            }))
                                        }
                                    >
                                        <p className="font-semibold text-slate-900">
                                            Partial payment
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Pay{" "}
                                            {Math.round(
                                                config.settings
                                                    .advancePercentBps / 100
                                            )}
                                            % now and collect the remaining
                                            balance later.
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        className={cn(
                                            "rounded-2xl border px-4 py-4 text-left transition-colors",
                                            form.paymentPreference ===
                                                "full_upfront"
                                                ? "border-[#5B9BD5] bg-blue-50"
                                                : "border-slate-200 bg-white"
                                        )}
                                        onClick={() =>
                                            setForm((current) => ({
                                                ...current,
                                                paymentPreference:
                                                    "full_upfront",
                                            }))
                                        }
                                    >
                                        <p className="font-semibold text-slate-900">
                                            100% upfront payment
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Collect the full order value at the
                                            time of checkout.
                                        </p>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                <label className="block text-sm font-semibold text-slate-900">
                                    Upload Company Logo / Artwork
                                </label>
                                <input
                                    className="mt-2 block w-full text-sm"
                                    type="file"
                                    accept=".ai,.eps,.pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setArtworkLocalFile(file);
                                        setArtworkUploaded(null);
                                    }}
                                />
                                {artworkLocalFile && (
                                    <p className="mt-2 text-xs text-slate-600">
                                        {artworkLocalFile.name}
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {step === 3 && (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Employee Size Upload
                            </h2>
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Upload Employee Details Sheet
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Accepted formats: XLS, XLSX, CSV
                                        </p>
                                    </div>
                                    <a
                                        href="/templates/corporate-employee-size-template.xlsx"
                                        className="text-sm font-semibold text-[#8d5b2f] underline underline-offset-4"
                                    >
                                        Download template
                                    </a>
                                </div>
                                <input
                                    className="mt-3 block w-full text-sm"
                                    type="file"
                                    accept=".xls,.xlsx,.csv"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        if (!file) return;
                                        try {
                                            setEmployeeLocalFile(file);
                                            setEmployeeSheetUploaded(null);
                                            await parseEmployeeSheet(file);
                                            toast.success(
                                                "Employee size sheet parsed successfully"
                                            );
                                        } catch (error) {
                                            setEmployeeLocalFile(null);
                                            handleClientError(error);
                                        }
                                    }}
                                />
                                {employeeLocalFile && (
                                    <p className="mt-2 text-xs text-slate-600">
                                        {employeeLocalFile.name}
                                    </p>
                                )}
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Parsed employees
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {employeeRows.length} employees loaded
                                    </p>
                                </div>
                                <div className="max-h-72 overflow-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="px-4 py-2">Employee Name</th>
                                                <th className="px-4 py-2">Size</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeeRows.length > 0 ? (
                                                employeeRows.map((row, index) => (
                                                    <tr
                                                        key={`${row.employeeName}-${index}`}
                                                        className="border-t border-slate-100"
                                                    >
                                                        <td className="px-4 py-2">
                                                            {row.employeeName}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {row.size}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        className="px-4 py-6 text-slate-500"
                                                        colSpan={2}
                                                    >
                                                        Upload a valid employee
                                                        size sheet to preview
                                                        rows here.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {step === 4 && (
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">
                                        Order Summary
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Review the quote and complete your{" "}
                                        {initialPaymentLabel.toLowerCase()}.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={refreshQuote}
                                    disabled={isQuoting}
                                >
                                    {isQuoting ? "Refreshing..." : "Refresh quote"}
                                </Button>
                            </div>
                            {quote ? (
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <SummaryStat
                                        label="Quantity"
                                        value={String(quote.quantity)}
                                    />
                                    <SummaryStat
                                        label="Employee Count"
                                        value={String(quote.employeeCount)}
                                    />
                                    <SummaryStat
                                        label="Unit Cost"
                                        value={formatINR(quote.unitPricePaise)}
                                    />
                                    <SummaryStat
                                        label="Subtotal"
                                        value={formatINR(quote.subtotalPaise)}
                                    />
                                    <SummaryStat
                                        label="Customization"
                                        value={formatINR(quote.customizationPaise)}
                                    />
                                    <SummaryStat
                                        label="GST"
                                        value={formatINR(quote.gstPaise)}
                                    />
                                    <SummaryStat
                                        label="Total Order Value"
                                        value={formatINR(quote.totalPaise)}
                                    />
                                    <SummaryStat
                                        label={
                                            quote.balanceDuePaise === 0
                                                ? "Amount Due Now"
                                                : `Initial Payment (${Math.round(quote.advancePercentBps / 100)}%)`
                                        }
                                        value={formatINR(quote.advancePaidPaise)}
                                    />
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                                    Refresh the quote to generate the final pricing
                                    summary.
                                </div>
                            )}
                            <textarea
                                className="mt-5 min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                                placeholder="Customer notes (optional)"
                                value={form.customerNotes}
                                onChange={(e) =>
                                    setForm((current) => ({
                                        ...current,
                                        customerNotes: e.target.value,
                                    }))
                                }
                            />
                        </section>
                    )}

                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setStep((current) => Math.max(0, current - 1))
                                }
                                disabled={step === 0 || isPaying}
                            >
                                <ChevronLeft className="size-4" />
                                Back
                            </Button>
                            {step < 4 ? (
                                <Button
                                    onClick={() =>
                                        setStep((current) =>
                                            Math.min(STEPS.length - 1, current + 1)
                                        )
                                    }
                                    disabled={isPaying}
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            ) : (
                                <Button
                                    className="bg-[#5B9BD5] text-white hover:bg-[#4A8BC5]"
                                    onClick={handleProceedToPayment}
                                    disabled={isPaying || !quote}
                                >
                                    {isPaying
                                        ? "Opening payment..."
                                        : quote?.balanceDuePaise === 0
                                          ? "Pay 100% Now"
                                          : `Pay ${Math.round((quote?.advancePercentBps ?? config.settings.advancePercentBps) / 100)}% Now`}
                                </Button>
                            )}
                        </div>
                    </div>

                    <aside className="h-fit rounded-3xl border border-[#dbe5f0] bg-white p-5 shadow-sm xl:sticky xl:top-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-[#5B9BD5]">
                                <Upload className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                                    Live Quote
                                </p>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Corporate order summary
                                </h3>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3 text-sm text-slate-700">
                            <InfoRow
                                label="Expected timeline"
                                value={config.settings.expectedTimelineText}
                            />
                            <InfoRow
                                label="GST"
                                value={`${(config.settings.gstRateBps / 100).toFixed(2)}%`}
                            />
                            <InfoRow
                                label="Payment plan"
                                value={initialPaymentLabel}
                            />
                            <InfoRow
                                label="Parsed employees"
                                value={String(employeeRows.length)}
                            />
                        </div>

                        {quote && (
                            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                                    Payment snapshot
                                </p>
                                <div className="mt-3 space-y-2 text-sm text-slate-700">
                                    <InfoRow
                                        label="Total Order Value"
                                        value={formatINR(quote.totalPaise)}
                                    />
                                    <InfoRow
                                        label={
                                            quote.balanceDuePaise === 0
                                                ? "Paying now"
                                                : "Initial payment"
                                        }
                                        value={formatINR(quote.advancePaidPaise)}
                                    />
                                    <InfoRow
                                        label="Balance Due"
                                        value={formatINR(quote.balanceDuePaise)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-5 space-y-2">
                            <Checkline label="Signed-in order placement" />
                            <Checkline label="Artwork + employee sheet upload" />
                            <Checkline label="Live pricing with slabs and extras" />
                            <Checkline label="Razorpay checkout support" />
                        </div>
                    </aside>
                </div>
        </div>
    );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-slate-500">{label}</span>
            <span className="text-right font-medium text-slate-900">{value}</span>
        </div>
    );
}

function Checkline({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#5B9BD5] text-white">
                <Check className="size-3" />
            </span>
            <span>{label}</span>
        </div>
    );
}

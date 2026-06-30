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
import { motion } from "motion/react";
import * as XLSX from "xlsx";
import {
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    Palette,
    Shirt,
    Sparkles,
    Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
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
    productTypeId?: string;
    gsmOptionId?: string;
    fabricCompositionId?: string;
    lockApprovedQuoteSelections?: boolean;
    approvedQuoteId?: string;
    approvedQuoteNumber?: string;
    approvedQuoteUnitPricePaise?: number;
    customerNotes?: string;
    paymentPreference?: "partial_advance" | "full_upfront";
};

type FieldErrors = Partial<Record<string, string>>;

function ensureRazorpaySdk() {
    return new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined") {
            reject(new Error("Razorpay checkout is only available in the browser"));
            return;
        }

        if ((window as any).Razorpay) {
            resolve();
            return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>(
            "script[src=\"https://checkout.razorpay.com/v1/checkout.js\"]"
        );

        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), {
                once: true,
            });
            existingScript.addEventListener(
                "error",
                () => reject(new Error("Failed to load Razorpay checkout")),
                { once: true }
            );
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error("Failed to load Razorpay checkout"));
        document.body.appendChild(script);
    });
}

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
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
    const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(
        null
    );
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
        productTypeId: initialPrefill?.productTypeId ?? "",
        gsmOptionId: initialPrefill?.gsmOptionId ?? "",
        fabricCompositionId: initialPrefill?.fabricCompositionId ?? "",
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
        approvedQuoteId: initialPrefill?.approvedQuoteId ?? null,
        customerNotes: initialPrefill?.customerNotes ?? "",
    });
    const isApprovedQuoteFlow =
        initialPrefill?.lockApprovedQuoteSelections === true;
    const approvedQuoteQuantity = initialPrefill?.quantity ?? 0;
    const approvedQuoteUnitPricePaise =
        initialPrefill?.approvedQuoteUnitPricePaise ?? 0;

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

    useEffect(() => {
        void ensureRazorpaySdk().catch((error) => {
            console.error("Razorpay SDK preload failed", error);
        });
    }, []);

    useEffect(() => {
        if (!artworkLocalFile) {
            setArtworkPreviewUrl(null);
            return;
        }

        if (!artworkLocalFile.type.startsWith("image/")) {
            setArtworkPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(artworkLocalFile);
        setArtworkPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [artworkLocalFile]);

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
    const selectedProductType = config?.productTypes.find(
        (item) => item.id === form.productTypeId
    );
    const selectedGsm = config?.gsmOptions.find(
        (item) => item.id === form.gsmOptionId
    );
    const selectedFabricComposition = config?.fabricCompositions.find(
        (item) => item.id === form.fabricCompositionId
    );
    const selectedPrintMethod = config?.printMethods.find(
        (item) => item.id === form.printMethodId
    );
    const selectedColors = config?.colorOptions.filter((item) =>
        selectedColorIds.has(item.id)
    );
    const selectedLogoLocations = config?.logoLocations.filter((item) =>
        selectedLogoLocationIds.has(item.id)
    );
    const selectedExtraCharges = config?.extraChargeRules.filter((item) =>
        selectedExtraChargeRuleIds.has(item.id)
    );
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

    const setFieldValue = <K extends keyof typeof form>(
        key: K,
        value: (typeof form)[K]
    ) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
        setFieldErrors((current) => {
            if (!current[key as string]) return current;
            const next = { ...current };
            delete next[key as string];
            return next;
        });
    };

    const validateStepBeforeNext = (currentStep: number) => {
        const errors: FieldErrors = {};

        if (currentStep === 0) {
            if (!form.companyName || form.companyName.trim().length < 2) {
                errors.companyName = "Enter a valid company name.";
            }
            if (!form.contactPersonName || form.contactPersonName.trim().length < 2) {
                errors.contactPersonName = "Enter the contact person name.";
            }
            if (!form.emailAddress) {
                errors.emailAddress = "Enter the email address.";
            }
            if (!form.mobileNumber) {
                errors.mobileNumber = "Enter the mobile number.";
            }
            if (!form.deliveryAddress || form.deliveryAddress.trim().length < 10) {
                errors.deliveryAddress =
                    "Add a complete delivery address before continuing.";
            }
            if (form.numberOfEmployees <= 0) {
                errors.numberOfEmployees = "Enter the number of employees.";
            }
        }

        if (currentStep === 1) {
            if (!form.productTypeId) {
                errors.productTypeId = "Select the product type.";
            }
            if (!form.gsmOptionId) {
                errors.gsmOptionId = "Select the GSM.";
            }
            if (!form.fabricCompositionId) {
                errors.fabricCompositionId = "Select the fabric composition.";
            }
            if (form.colorOptionIds.length === 0) {
                errors.colorOptionIds =
                    "Select at least one color before continuing.";
            }
            if ((form.quantity || 0) <= 0) {
                errors.quantity = "Enter the order quantity.";
            }
            if (
                isApprovedQuoteFlow &&
                approvedQuoteQuantity > 0 &&
                form.quantity !== approvedQuoteQuantity
            ) {
                errors.quantity = `Quantity is locked to ${approvedQuoteQuantity} from the approved quotation.`;
            }
        }

        if (currentStep === 2) {
            if (form.logoLocationIds.length === 0) {
                errors.logoLocationIds =
                    "Select at least one logo placement option.";
            }
            if (!form.printMethodId) {
                errors.printMethodId =
                    "Select the printing method before continuing.";
            }
            if (!artworkLocalFile) {
                errors.artworkFile = "Upload the company logo or artwork file.";
            }
        }

        if (currentStep === 3) {
            if (!employeeLocalFile || employeeRows.length === 0) {
                errors.employeeSheetFile =
                    "Upload a valid employee size sheet before continuing.";
            }
            if (
                isApprovedQuoteFlow &&
                approvedQuoteQuantity > 0 &&
                employeeRows.length > 0 &&
                employeeRows.length !== approvedQuoteQuantity
            ) {
                errors.employeeSheetFile = `Employee size sheet should contain ${approvedQuoteQuantity} rows to match the approved quotation quantity.`;
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors,
        };
    };

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
            const companyValidation = validateStepBeforeNext(0);
            if (!companyValidation.valid) {
                setFieldErrors(companyValidation.errors);
                setStep(0);
                return;
            }
            const productValidation = validateStepBeforeNext(1);
            if (!productValidation.valid) {
                setFieldErrors(productValidation.errors);
                setStep(1);
                return;
            }
            const brandingValidation = validateStepBeforeNext(2);
            if (!brandingValidation.valid) {
                setFieldErrors(brandingValidation.errors);
                setStep(2);
                return;
            }
            const employeeValidation = validateStepBeforeNext(3);
            if (!employeeValidation.valid) {
                setFieldErrors(employeeValidation.errors);
                setStep(3);
                return;
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
            numberOfEmployees: isApprovedQuoteFlow
                ? current.numberOfEmployees
                : parsedRows.length,
            quantity: isApprovedQuoteFlow ? current.quantity : parsedRows.length,
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
            const companyValidation = validateStepBeforeNext(0);
            if (!companyValidation.valid) {
                setFieldErrors(companyValidation.errors);
                setStep(0);
                return;
            }
            const productValidation = validateStepBeforeNext(1);
            if (!productValidation.valid) {
                setFieldErrors(productValidation.errors);
                setStep(1);
                return;
            }
            const brandingValidation = validateStepBeforeNext(2);
            if (!brandingValidation.valid) {
                setFieldErrors(brandingValidation.errors);
                setStep(2);
                return;
            }
            const employeeValidation = validateStepBeforeNext(3);
            if (!employeeValidation.valid) {
                setFieldErrors(employeeValidation.errors);
                setStep(3);
                return;
            }
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
                            draftToken: created.draftToken,
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

            await ensureRazorpaySdk();
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
            <section className="overflow-hidden rounded-[32px] border border-[#dbe5f0] bg-[linear-gradient(135deg,#ffffff_0%,#f5f9fd_48%,#edf5ff_100%)] shadow-[0_28px_90px_-58px_rgba(44,72,108,0.45)]">
                <div className="grid gap-6 p-5 md:p-8 xl:grid-cols-[minmax(0,1.5fr)_380px]">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#5B9BD5]">
                            Corporate Order Studio
                        </p>
                        <h1 className="mt-3 max-w-4xl font-serif text-3xl font-semibold leading-[1.02] text-slate-950 md:text-5xl">
                            Build branded teamwear with live visual approval and
                            payment-ready bulk checkout
                        </h1>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 md:text-[15px]">
                            Configure the garment, place your logo on the front
                            or back, upload employee sizing, and finish the
                            order in one guided premium workspace.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Badge className="bg-[#1f3b17] text-white hover:bg-[#1f3b17]">
                                Premium bulk ordering
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-[#b7d6f5] bg-white text-[#356ea5]"
                            >
                                {initialPaymentLabel}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-[#d6dde6] bg-white/80 text-slate-600"
                            >
                                MOQ-aware pricing
                            </Badge>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_80px_-60px_rgba(23,42,72,0.55)] backdrop-blur"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#ecf5ff] text-[#5B9BD5]">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5B9BD5]">
                                    Live Status
                                </p>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Order readiness snapshot
                                </h2>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <StudioMetric
                                label="Selected garment"
                                value={
                                    selectedProductType?.name ??
                                    (isApprovedQuoteFlow
                                        ? "Admin-selected garment"
                                        : "Choose a product")
                                }
                            />
                            <StudioMetric
                                label="Branding placements"
                                value={
                                    selectedLogoLocations?.length
                                        ? `${selectedLogoLocations.length} selected`
                                        : "No logo placement selected"
                                }
                            />
                            <StudioMetric
                                label="Employee size rows"
                                value={
                                    isApprovedQuoteFlow && approvedQuoteQuantity > 0
                                        ? `${employeeRows.length}/${approvedQuoteQuantity} loaded`
                                        : `${employeeRows.length} loaded`
                                }
                            />
                            <StudioMetric
                                label="Payment structure"
                                value={initialPaymentLabel}
                            />
                        </div>
                    </motion.div>
                </div>

                <div className="border-t border-white/70 px-5 pb-5 pt-4 md:px-8 md:pb-8">
                    <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto py-4">
                        {/* Background line */}
                        <div className="absolute top-[28px] left-[5%] w-[90%] h-0.5 bg-slate-200/70 rounded-full" />

                        {/* Animated Active Line */}
                        <motion.div
                            className="absolute top-[28px] left-[5%] h-0.5 bg-[#5B9BD5] rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(step / (STEPS.length - 1)) * 90}%` }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        />

                        {STEPS.map((label, index) => {
                            const isActive = index === step;
                            const isCompleted = index < step;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setStep(index)}
                                    className="relative z-10 flex flex-col items-center group focus:outline-none w-20"
                                >
                                    {/* Circle */}
                                    <motion.div
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.96 }}
                                        className={cn(
                                            "flex size-9 items-center justify-center rounded-full border-2 transition-all duration-300 font-semibold text-xs",
                                            isActive
                                                ? "border-[#5B9BD5] bg-white text-[#5B9BD5] shadow-[0_0_12px_rgba(91,155,213,0.35)] ring-4 ring-[#5B9BD5]/10"
                                                : isCompleted
                                                    ? "border-[#5B9BD5] bg-[#5B9BD5] text-white"
                                                    : "border-slate-200 bg-white text-slate-400"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="size-4 stroke-[3px]" />
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </motion.div>

                                    {/* Label */}
                                    <span
                                        className={cn(
                                            "mt-2 text-[10px] font-semibold uppercase tracking-wider text-center transition-colors duration-300",
                                            isActive
                                                ? "text-[#5B9BD5]"
                                                : isCompleted
                                                    ? "text-slate-700"
                                                    : "text-slate-400 group-hover:text-slate-600"
                                        )}
                                    >
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.22fr)_460px]">
                <div className="space-y-6">
                    {step === 0 && (
                        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] md:p-7">
                            <StepHeader
                                icon={Building2}
                                eyebrow="Step 1"
                                title="Company and delivery details"
                                description="Tell us where the bulk order is going and who should receive all production, pricing, and payment updates."
                            />
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div>
                                    <Input
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 px-4"
                                        placeholder="Company Name"
                                        value={form.companyName}
                                        onChange={(e) =>
                                            setFieldValue("companyName", e.target.value)
                                        }
                                    />
                                    <FieldError message={fieldErrors.companyName} />
                                </div>
                                <div>
                                    <Input
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 px-4"
                                        placeholder="Contact Person Name"
                                        value={form.contactPersonName}
                                        onChange={(e) =>
                                            setFieldValue(
                                                "contactPersonName",
                                                e.target.value
                                            )
                                        }
                                    />
                                    <FieldError message={fieldErrors.contactPersonName} />
                                </div>
                                <div>
                                    <Input
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 px-4"
                                        placeholder="Email Address"
                                        type="email"
                                        value={form.emailAddress}
                                        onChange={(e) =>
                                            setFieldValue("emailAddress", e.target.value)
                                        }
                                    />
                                    <FieldError message={fieldErrors.emailAddress} />
                                </div>
                                <div>
                                    <Input
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 px-4"
                                        placeholder="Mobile Number"
                                        value={form.mobileNumber}
                                        onChange={(e) =>
                                            setFieldValue("mobileNumber", e.target.value)
                                        }
                                    />
                                    <FieldError message={fieldErrors.mobileNumber} />
                                </div>
                                <div>
                                    <Input
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 px-4"
                                        placeholder="GST Number (Optional)"
                                        value={form.gstNumber}
                                        onChange={(e) =>
                                            setFieldValue("gstNumber", e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Input
                                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/60 px-4"
                                        placeholder="Number of Employees"
                                        type="number"
                                        value={form.numberOfEmployees || ""}
                                        disabled={isApprovedQuoteFlow}
                                        onChange={(e) =>
                                            setFieldValue(
                                                "numberOfEmployees",
                                                Number(e.target.value)
                                            )
                                        }
                                    />
                                    <FieldError message={fieldErrors.numberOfEmployees} />
                                </div>
                            </div>
                            <textarea
                                className="mt-4 min-h-32 w-full rounded-[24px] border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition focus:border-[#5B9BD5]"
                                placeholder="Delivery Address"
                                value={form.deliveryAddress}
                                onChange={(e) =>
                                    setFieldValue("deliveryAddress", e.target.value)
                                }
                            />
                            <FieldError message={fieldErrors.deliveryAddress} />
                        </section>
                    )}

                    {step === 1 && (
                        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] md:p-7">
                            <StepHeader
                                icon={Shirt}
                                eyebrow="Step 2"
                                title="Choose the garment foundation"
                                description={
                                    isApprovedQuoteFlow
                                        ? "Garment base, fabric composition, GSM, and quantity are locked from the approved quote. Choose the final color palette for the live preview."
                                        : "Select the apparel base, fabric build, and brand color palette for the live preview and pricing engine."
                                }
                            />
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div>
                                    {isApprovedQuoteFlow ? (
                                        <Input
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-100 px-4"
                                            value={selectedProductType?.name ?? "Admin selected"}
                                            disabled
                                        />
                                    ) : (
                                        <select
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 text-sm"
                                            value={form.productTypeId}
                                            onChange={(e) =>
                                                setFieldValue("productTypeId", e.target.value)
                                            }
                                        >
                                            <option value="">Select Product Type</option>
                                            {config.productTypes.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <FieldError message={fieldErrors.productTypeId} />
                                </div>
                                <div>
                                    {isApprovedQuoteFlow ? (
                                        <Input
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-100 px-4"
                                            value={selectedGsm?.label ?? "Admin selected"}
                                            disabled
                                        />
                                    ) : (
                                        <select
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 text-sm"
                                            value={form.gsmOptionId}
                                            onChange={(e) =>
                                                setFieldValue("gsmOptionId", e.target.value)
                                            }
                                        >
                                            <option value="">Select GSM</option>
                                            {config.gsmOptions.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <FieldError message={fieldErrors.gsmOptionId} />
                                </div>
                                <div>
                                    {isApprovedQuoteFlow ? (
                                        <Input
                                            className="h-12 rounded-2xl border-slate-200 bg-slate-100 px-4"
                                            value={
                                                selectedFabricComposition?.name ??
                                                "Admin selected"
                                            }
                                            disabled
                                        />
                                    ) : (
                                        <select
                                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 text-sm"
                                            value={form.fabricCompositionId}
                                            onChange={(e) =>
                                                setFieldValue(
                                                    "fabricCompositionId",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">Select Fabric Composition</option>
                                            {config.fabricCompositions.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <FieldError message={fieldErrors.fabricCompositionId} />
                                </div>
                                <div>
                                    <Input
                                        className={cn(
                                            "h-12 rounded-2xl border-slate-200 px-4",
                                            isApprovedQuoteFlow
                                                ? "bg-slate-100"
                                                : "bg-slate-50/60"
                                        )}
                                        placeholder="Quantity"
                                        type="number"
                                        value={form.quantity || ""}
                                        disabled={isApprovedQuoteFlow}
                                        onChange={(e) =>
                                            setFieldValue("quantity", Number(e.target.value))
                                        }
                                    />
                                    <FieldError message={fieldErrors.quantity} />
                                </div>
                            </div>

                            {isApprovedQuoteFlow ? (
                                <div className="mt-5 grid gap-3 md:grid-cols-3">
                                    <SummaryStat
                                        label="Approved Quote"
                                        value={
                                            initialPrefill?.approvedQuoteNumber ??
                                            "Approved quote"
                                        }
                                    />
                                    <SummaryStat
                                        label="Quantity Locked"
                                        value={String(approvedQuoteQuantity)}
                                    />
                                    <SummaryStat
                                        label="Price Per Unit"
                                        value={formatINR(approvedQuoteUnitPricePaise)}
                                    />
                                </div>
                            ) : null}

                            <div className="mt-5">
                                <p className="text-sm font-semibold text-slate-900">
                                    Select garment colors
                                </p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {config.colorOptions.map((color) => {
                                        const checked = selectedColorIds.has(color.id);
                                        return (
                                            <motion.button
                                                type="button"
                                                key={color.id}
                                                whileHover={{ y: -2, scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm transition-all duration-200",
                                                    checked
                                                        ? "border-[#5B9BD5] bg-[#eff7ff] text-[#20476c] shadow-[0_12px_24px_-16px_rgba(91,155,213,0.6)] ring-2 ring-[#5B9BD5]/30"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-350"
                                                )}
                                                onClick={() =>
                                                    {
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
                                                        }));
                                                        setFieldErrors((current) => {
                                                            if (!current.colorOptionIds) return current;
                                                            const next = { ...current };
                                                            delete next.colorOptionIds;
                                                            return next;
                                                        });
                                                    }
                                                }
                                            >
                                                <span
                                                    className="size-5 rounded-full border border-black/5 shadow-inner"
                                                    style={{
                                                        backgroundColor:
                                                            color.hexCode ??
                                                            "#dbe4ee",
                                                    }}
                                                />
                                                <span className="font-medium">
                                                    {color.name}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                <FieldError message={fieldErrors.colorOptionIds} />
                                <textarea
                                    className="mt-4 min-h-24 w-full rounded-[24px] border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition focus:border-[#5B9BD5]"
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
                        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] md:p-7">
                            <StepHeader
                                icon={Palette}
                                eyebrow="Step 3"
                                title="Branding, placement, and artwork"
                                description="Select exactly where the logo should appear. The live garment preview on the right updates based on front and back placements."
                            />
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Logo placement
                                </p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {config.logoLocations.map((location) => {
                                        const checked = selectedLogoLocationIds.has(
                                            location.id
                                        );
                                        return (
                                            <motion.button
                                                type="button"
                                                key={location.id}
                                                whileHover={{ y: -2, scale: 1.01 }}
                                                whileTap={{ scale: 0.99 }}
                                                transition={{ type: "spring", stiffness: 450, damping: 18 }}
                                                className={cn(
                                                    "rounded-[22px] border px-4 py-3 text-left text-sm transition-all duration-200",
                                                    checked
                                                        ? "border-[#5B9BD5] bg-[#eff7ff] text-[#20476c] shadow-[0_12px_24px_-16px_rgba(91,155,213,0.6)] ring-2 ring-[#5B9BD5]/30"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-350"
                                                )}
                                                onClick={() =>
                                                    {
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
                                                        }));
                                                        setFieldErrors((current) => {
                                                            if (!current.logoLocationIds) return current;
                                                            const next = { ...current };
                                                            delete next.logoLocationIds;
                                                            return next;
                                                        });
                                                    }
                                                }
                                            >
                                                <p className="font-semibold">
                                                    {location.name}
                                                </p>
                                                <p className="mt-1 text-xs opacity-75">
                                                    {isBackPlacement(location.name)
                                                        ? "Visible on the back view"
                                                        : "Visible on the front view"}
                                                </p>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                <FieldError message={fieldErrors.logoLocationIds} />
                            </div>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div>
                                    <select
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-4 text-sm"
                                        value={form.printMethodId}
                                        onChange={(e) =>
                                            setFieldValue("printMethodId", e.target.value)
                                        }
                                    >
                                        <option value="">Select Printing Method</option>
                                        {config.printMethods.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                    <FieldError message={fieldErrors.printMethodId} />
                                </div>
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
                                                        "rounded-full border px-3 py-2 text-sm transition-all",
                                                        checked
                                                            ? "border-[#5B9BD5] bg-[#eff7ff] text-[#20476c]"
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
                            <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    Payment choice
                                </p>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <button
                                        type="button"
                                        className={cn(
                                            "rounded-[22px] border p-4 text-left transition-all",
                                            form.paymentPreference ===
                                                "partial_advance"
                                                ? "border-[#5B9BD5] bg-[#eff7ff] shadow-[0_16px_32px_-24px_rgba(91,155,213,0.72)]"
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
                                            "rounded-[22px] border p-4 text-left transition-all",
                                            form.paymentPreference ===
                                                "full_upfront"
                                                ? "border-[#5B9BD5] bg-[#eff7ff] shadow-[0_16px_32px_-24px_rgba(91,155,213,0.72)]"
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
                            <div className="mt-5 rounded-[26px] border border-dashed border-slate-300 bg-slate-50/70 p-5">
                                <label className="block text-sm font-semibold text-slate-900">
                                    Upload company logo or artwork
                                </label>
                                <p className="mt-1 text-sm text-slate-500">
                                    PNG and JPG files show directly on the live
                                    garment preview. Vector or PDF files remain
                                    attached for production.
                                </p>
                                <input
                                    className="mt-2 block w-full text-sm"
                                    type="file"
                                    accept=".ai,.eps,.pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setArtworkLocalFile(file);
                                        setArtworkUploaded(null);
                                        setFieldErrors((current) => {
                                            if (!current.artworkFile) return current;
                                            const next = { ...current };
                                            delete next.artworkFile;
                                            return next;
                                        });
                                    }}
                                />
                                {artworkLocalFile && (
                                    <p className="mt-2 text-xs text-slate-600">
                                        {artworkLocalFile.name}
                                    </p>
                                )}
                                <FieldError message={fieldErrors.artworkFile} />
                            </div>
                        </section>
                    )}

                    {step === 3 && (
                        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] md:p-7">
                            <StepHeader
                                icon={FileSpreadsheet}
                                eyebrow="Step 4"
                                title="Upload employee sizes"
                                description="Use the employee sizing sheet so the quantity and garment mix match your final distribution list."
                            />
                            <div className="mt-4 rounded-[26px] border border-dashed border-slate-300 bg-slate-50/70 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Upload employee details sheet
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
                                            setFieldErrors((current) => {
                                                if (!current.employeeSheetFile) return current;
                                                const next = { ...current };
                                                delete next.employeeSheetFile;
                                                return next;
                                            });
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
                                <FieldError message={fieldErrors.employeeSheetFile} />
                            </div>

                            <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200">
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
                        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] md:p-7">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <StepHeader
                                        icon={Sparkles}
                                        eyebrow="Step 5"
                                        title="Final quote and payment"
                                        description={`Review the quote and complete your ${initialPaymentLabel.toLowerCase()}.`}
                                    />
                                </div>
                                <div className="pt-5">
                                    <p className="text-sm text-slate-500">
                                        Pricing refresh checks every selected
                                        option before generating the final
                                        payment summary.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="rounded-2xl"
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
                                <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                                    Refresh the quote to generate the final pricing
                                    summary.
                                </div>
                            )}
                            <textarea
                                className="mt-5 min-h-28 w-full rounded-[24px] border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition focus:border-[#5B9BD5]"
                                placeholder="Customer notes, dispatch instructions, or packaging details (optional)"
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
                                className="rounded-2xl"
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
                                    className="rounded-2xl"
                                    onClick={() => {
                                        const validation = validateStepBeforeNext(step);
                                        if (!validation.valid) {
                                            setFieldErrors(validation.errors);
                                            return;
                                        }

                                        setFieldErrors({});
                                        setStep((current) =>
                                            Math.min(STEPS.length - 1, current + 1)
                                        );
                                    }}
                                    disabled={isPaying}
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            ) : (
                                <Button
                                    className="rounded-2xl bg-[#5B9BD5] text-white hover:bg-[#4A8BC5]"
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

                    <aside className="space-y-5 xl:sticky xl:top-6 xl:h-fit">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="overflow-hidden rounded-[30px] border border-[#dbe5f0] bg-[linear-gradient(180deg,#fdfefe_0%,#f5f9ff_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-[#5B9BD5]">
                                        <Upload className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                                            Live Preview
                                        </p>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            Branded garment mockup
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex rounded-full border border-slate-200 bg-white p-1">
                                    <button
                                        type="button"
                                        className={cn(
                                            "rounded-full px-3 py-1 text-xs font-semibold transition",
                                            previewSide === "front"
                                                ? "bg-[#1f3b17] text-white"
                                                : "text-slate-500"
                                        )}
                                        onClick={() => setPreviewSide("front")}
                                    >
                                        Front
                                    </button>
                                    <button
                                        type="button"
                                        className={cn(
                                            "rounded-full px-3 py-1 text-xs font-semibold transition",
                                            previewSide === "back"
                                                ? "bg-[#1f3b17] text-white"
                                                : "text-slate-500"
                                        )}
                                        onClick={() => setPreviewSide("back")}
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>

                            <CorporateGarmentPreview
                                side={previewSide}
                                artworkPreviewUrl={artworkPreviewUrl}
                                artworkName={artworkLocalFile?.name}
                                productName={selectedProductType?.name}
                                colorHex={selectedColors?.[0]?.hexCode ?? undefined}
                                colorName={selectedColors?.[0]?.name}
                                productTone={selectedFabricComposition?.name}
                                logoLocations={selectedLogoLocations?.map((item) => ({
                                    id: item.id,
                                    name: item.name,
                                }))}
                            />

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <StudioMiniCard
                                    label="Garment"
                                    value={selectedProductType?.name ?? "Waiting for selection"}
                                />
                                <StudioMiniCard
                                    label="Primary color"
                                    value={selectedColors?.[0]?.name ?? "No color selected"}
                                />
                                <StudioMiniCard
                                    label="Print method"
                                    value={
                                        selectedPrintMethod?.name ??
                                        "Choose a printing method"
                                    }
                                />
                                <StudioMiniCard
                                    label="Branding coverage"
                                    value={
                                        selectedLogoLocations?.length
                                            ? `${selectedLogoLocations.length} placement(s)`
                                            : "No placement selected"
                                    }
                                />
                            </div>
                        </motion.div>

                        <div className="rounded-[30px] border border-[#dbe5f0] bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.3)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                                Quote Snapshot
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-slate-900">
                                Corporate order summary
                            </h3>
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
                                <InfoRow
                                    label="Selected fabric"
                                    value={
                                        selectedFabricComposition?.name ??
                                        "Fabric not selected"
                                    }
                                />
                                <InfoRow
                                    label="Selected GSM"
                                    value={selectedGsm?.label ?? "GSM not selected"}
                                />
                            </div>

                            {quote && (
                                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                                        Payment snapshot
                                    </p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                                        <InfoRow
                                            label="Total order value"
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
                                            label="Balance due later"
                                            value={formatINR(quote.balanceDuePaise)}
                                        />
                                    </div>
                                </div>
                            )}

                            {!!selectedExtraCharges?.length && (
                                <div className="mt-5 rounded-[24px] border border-[#dbe5f0] bg-[#f8fbff] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                                        Add-ons selected
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedExtraCharges.map((item) => (
                                            <span
                                                key={item.id}
                                                className="rounded-full border border-[#cfe1f5] bg-white px-3 py-1 text-xs font-medium text-[#315f8a]"
                                            >
                                                {item.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-5 space-y-2">
                                <Checkline label="Signed-in corporate checkout" />
                                <Checkline label="Visual logo placement preview" />
                                <Checkline label="Live pricing with slabs and extras" />
                                <Checkline label="Razorpay payment handoff" />
                            </div>
                        </div>
                    </aside>
                </div>
        </div>
    );
}

function StepHeader({
    icon: Icon,
    eyebrow,
    title,
    description,
}: {
    icon: typeof Building2;
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#5B9BD5]">
                <Icon className="size-5" />
            </div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5B9BD5]">
                    {eyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    {title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return <p className="mt-2 text-sm text-rose-600">{message}</p>;
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

function StudioMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-[20px] border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-right text-sm font-semibold text-slate-900">
                {value}
            </span>
        </div>
    );
}

function StudioMiniCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function CorporateGarmentPreview({
    side,
    artworkPreviewUrl,
    artworkName,
    productName,
    colorHex,
    colorName,
    productTone,
    logoLocations = [],
}: {
    side: "front" | "back";
    artworkPreviewUrl: string | null;
    artworkName?: string;
    productName?: string;
    colorHex?: string;
    colorName?: string;
    productTone?: string;
    logoLocations?: Array<{ id: string; name: string }>;
}) {
    const figureId = useId();
    const placements = logoLocations
        .filter((location) => isPlacementVisibleOnSide(location.name, side))
        .map((location) => ({
            ...location,
            style: getPlacementStyle(location.name, side),
        }))
        .filter(
            (
                location
            ): location is {
                id: string;
                name: string;
                style: CSSProperties;
            } => Boolean(location.style)
        );

    return (
        <div className="mt-5 rounded-[28px] border border-[#dce8f4] bg-[radial-gradient(circle_at_top,#fefefe_0%,#eef5fd_100%)] p-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5B9BD5]">
                        {side === "front" ? "Front mockup" : "Back mockup"}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                        {productName ?? "Corporate garment"} in{" "}
                        {colorName ?? "selected color"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {productTone
                            ? `${productTone} finish with placement-aware logo zones`
                            : "Sleeve, chest, and back placements update with your selections"}
                    </p>
                </div>
                <div className="rounded-full border border-white bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    {placements.length} logo zone{placements.length === 1 ? "" : "s"}
                </div>
            </div>

            <div className="relative mt-5 flex min-h-[440px] items-center justify-center overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,#ffffff_0%,#edf3fa_62%,#dce6f3_100%)] px-6 py-8">
                <div className="absolute inset-x-8 bottom-8 h-12 rounded-full bg-[#b7c9de]/55 blur-2xl" />
                <div className="absolute inset-x-10 top-8 h-24 rounded-full bg-white/70 blur-3xl" />
                <motion.div
                    key={side}
                    initial={{ opacity: 0, rotateY: side === "front" ? -90 : 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ duration: 0.55, ease: "easeInOut" }}
                    style={{ transformStyle: "preserve-3d", perspective: 1200 }}
                    className="relative w-full max-w-[340px]"
                >
                    <GarmentFigure
                        side={side}
                        colorHex={colorHex ?? "#5B9BD5"}
                        figureId={figureId}
                    />

                    <div className="pointer-events-none absolute inset-0">
                        {placements.map((placement) => (
                            <div
                                key={placement.id}
                                className="absolute flex items-center justify-center"
                                style={placement.style}
                            >
                                <div className="bg-white/12 relative flex size-full items-center justify-center rounded-[18px] border border-white/60 shadow-[0_8px_22px_rgba(15,23,42,0.16)] backdrop-blur-[2px]">
                                    {artworkPreviewUrl ? (
                                        <Image
                                            src={artworkPreviewUrl}
                                            alt="Uploaded logo preview"
                                            fill
                                            unoptimized
                                            className="object-contain p-2 drop-shadow-[0_6px_10px_rgba(15,23,42,0.18)]"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <span className="rounded-full border border-white/50 bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                                                Logo
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {logoLocations.length > 0 ? (
                    logoLocations.map((location) => (
                        <span
                            key={location.id}
                            className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium",
                                isPlacementVisibleOnSide(location.name, side)
                                    ? "border-[#cfe1f5] bg-white text-[#315f8a]"
                                    : "border-slate-200 bg-slate-50 text-slate-400"
                            )}
                        >
                            {location.name}
                        </span>
                    ))
                ) : (
                    <span className="text-sm text-slate-600">
                        Choose logo placement options to activate the live mockup.
                    </span>
                )}
            </div>

            <p className="mt-3 text-xs text-slate-600">
                {artworkPreviewUrl
                    ? `Previewing uploaded artwork: ${artworkName ?? "logo file"}`
                    : "Upload a PNG or JPG logo to see it rendered directly on the garment preview."}
            </p>
        </div>
    );
}

function GarmentFigure({
    side,
    colorHex,
    figureId,
}: {
    side: "front" | "back";
    colorHex: string;
    figureId: string;
}) {
    const baseColor = colorHex ?? "#5B9BD5";
    const darkShadow = darken(baseColor, 20);
    const extremeDark = darken(baseColor, 35);
    const brightHighlight = lighten(baseColor, 28);
    const softHighlight = lighten(baseColor, 15);

    return (
        <svg
            viewBox="0 0 420 500"
            className="w-full drop-shadow-[0_32px_52px_rgba(35,49,71,0.24)]"
        >
            <defs>
                <linearGradient
                    id={`garment-fill-${figureId}`}
                    x1="12%"
                    y1="2%"
                    x2="88%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor={brightHighlight} />
                    <stop offset="28%" stopColor={softHighlight} />
                    <stop offset="62%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={darkShadow} />
                </linearGradient>
                <linearGradient
                    id={`garment-highlight-${figureId}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient
                    id={`garment-shadow-${figureId}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="rgba(25,35,55,0.02)" />
                    <stop offset="100%" stopColor="rgba(25,35,55,0.22)" />
                </linearGradient>
                <filter id={`garment-soft-blur-${figureId}`}>
                    <feGaussianBlur stdDeviation="8" />
                </filter>
            </defs>

            {/* Inner neck (Front view only) */}
            {side === "front" && (
                <path
                    d="M 152 82 Q 210 96 268 82 Q 210 120 152 82 Z"
                    fill={extremeDark}
                    opacity="0.85"
                />
            )}

            {/* Main T-Shirt Body Shape */}
            <path
                d={
                    side === "front"
                        ? "M 152 82 L 92 100 C 78 112, 60 135, 42 160 L 78 185 C 90 180, 102 175, 108 172 C 118 240, 122 290, 112 440 Q 210 452, 308 440 C 298 290, 302 240, 312 172 C 318 175, 330 180, 342 185 L 378 160 C 360 135, 342 112, 328 100 L 268 82 Q 210 120, 152 82 Z"
                        : "M 152 82 L 92 100 C 78 112, 60 135, 42 160 L 78 185 C 90 180, 102 175, 108 172 C 118 240, 122 290, 112 440 Q 210 452, 308 440 C 298 290, 302 240, 312 172 C 318 175, 330 180, 342 185 L 378 160 C 360 135, 342 112, 328 100 L 268 82 Q 210 98, 152 82 Z"
                }
                fill={`url(#garment-fill-${figureId})`}
                stroke={darken(baseColor, 20)}
                strokeWidth="2.5"
                strokeLinejoin="round"
            />

            {/* Left and Right Shoulder Seam Stitching */}
            <line x1="152" y1="83" x2="92" y2="101" stroke="rgba(0,0,0,0.12)" strokeDasharray="3 2" strokeWidth="1" />
            <line x1="152" y1="84" x2="92" y2="102" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 2" strokeWidth="1" />
            <line x1="268" y1="83" x2="328" y2="101" stroke="rgba(0,0,0,0.12)" strokeDasharray="3 2" strokeWidth="1" />
            <line x1="268" y1="84" x2="328" y2="102" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 2" strokeWidth="1" />

            {/* Collar Band / Ribbing */}
            <path
                d={
                    side === "front"
                        ? "M 152 82 Q 210 120 268 82 Q 268 90 268 90 Q 210 128 152 90 Z"
                        : "M 152 82 Q 210 98 268 82 Q 268 90 268 90 Q 210 106 152 90 Z"
                }
                fill={baseColor}
                stroke={darkShadow}
                strokeWidth="1.5"
            />
            {/* Collar Highlight */}
            <path
                d={
                    side === "front"
                        ? "M 155 87 Q 210 122 265 87"
                        : "M 155 87 Q 210 102 265 87"
                }
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
            />
            {/* Collar Inner Top shadow */}
            <path
                d={
                    side === "front"
                        ? "M 152 82 Q 210 120 268 82"
                        : "M 152 82 Q 210 98 268 82"
                }
                fill="none"
                stroke={extremeDark}
                strokeWidth="1"
                opacity="0.5"
            />

            {/* Sleeve Cuff Stitching */}
            {/* Left sleeve cuff stitching */}
            <line x1="45" y1="162" x2="77" y2="184" stroke="rgba(0,0,0,0.12)" strokeDasharray="3 2" strokeWidth="1" />
            <line x1="47" y1="164" x2="79" y2="186" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 2" strokeWidth="1" />
            {/* Right sleeve cuff stitching */}
            <line x1="375" y1="162" x2="343" y2="184" stroke="rgba(0,0,0,0.12)" strokeDasharray="3 2" strokeWidth="1" />
            <line x1="373" y1="164" x2="341" y2="186" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 2" strokeWidth="1" />

            {/* Bottom Hem Stitching */}
            <path
                d="M 116 432 Q 210 444 304 432"
                fill="none"
                stroke="rgba(0,0,0,0.12)"
                strokeDasharray="3 2"
                strokeWidth="1"
            />
            <path
                d="M 116 435 Q 210 447 304 435"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="3 2"
                strokeWidth="1"
            />

            {/* 3D Soft Highlights and Shadows (Fabric Draping) */}
            <g opacity="0.3">
                {/* Underarm Shadow Left */}
                <path
                    d="M 108 172 Q 135 205 145 220"
                    fill="none"
                    stroke={darkShadow}
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter={`url(#garment-soft-blur-${figureId})`}
                />
                {/* Underarm Shadow Right */}
                <path
                    d="M 312 172 Q 285 205 275 220"
                    fill="none"
                    stroke={darkShadow}
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter={`url(#garment-soft-blur-${figureId})`}
                />
                {/* Side body shading left */}
                <path
                    d="M 112 440 C 122 350 120 230 108 172"
                    fill="none"
                    stroke={darkShadow}
                    strokeWidth="12"
                    strokeLinecap="round"
                    filter={`url(#garment-soft-blur-${figureId})`}
                />
                {/* Side body shading right */}
                <path
                    d="M 308 440 C 298 350 300 230 312 172"
                    fill="none"
                    stroke={darkShadow}
                    strokeWidth="12"
                    strokeLinecap="round"
                    filter={`url(#garment-soft-blur-${figureId})`}
                />
            </g>

            {/* Chest & Body Highlight overlays */}
            <path
                d="M 185 130 Q 170 260 178 390"
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="20"
                strokeLinecap="round"
                filter={`url(#garment-soft-blur-${figureId})`}
            />
            <path
                d="M 235 140 Q 245 270 238 380"
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="16"
                strokeLinecap="round"
                filter={`url(#garment-soft-blur-${figureId})`}
            />

            {/* Subtle organic wrinkles/folds near the waist */}
            <path
                d="M 125 310 Q 160 325 210 320"
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter={`url(#garment-soft-blur-${figureId})`}
            />
            <path
                d="M 128 312 Q 160 327 210 322"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter={`url(#garment-soft-blur-${figureId})`}
            />

            <path
                d="M 295 340 Q 250 355 210 350"
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter={`url(#garment-soft-blur-${figureId})`}
            />
            <path
                d="M 292 342 Q 250 357 210 352"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter={`url(#garment-soft-blur-${figureId})`}
            />

            {/* Bottom Hem crease depth */}
            <path
                d="M 112 440 Q 210 452 308 440"
                fill="none"
                stroke={extremeDark}
                strokeWidth="1.5"
                opacity="0.35"
            />
        </svg>
    );
}

function isBackPlacement(name: string) {
    const normalized = name.toLowerCase();
    return (
        normalized.includes("back") ||
        normalized.includes("rear") ||
        normalized.includes("nape")
    );
}

function isPlacementVisibleOnSide(name: string, side: "front" | "back") {
    return side === "back" ? isBackPlacement(name) : !isBackPlacement(name);
}

function getPlacementStyle(
    name: string,
    side: "front" | "back"
): CSSProperties | null {
    const normalized = name.toLowerCase();

    if (normalized.includes("left sleeve")) {
        return side === "front"
            ? { top: "25%", left: "71%", width: "11.5%", height: "10.5%" }
            : { top: "25%", left: "17.5%", width: "11.5%", height: "10.5%" };
    }

    if (normalized.includes("right sleeve")) {
        return side === "front"
            ? { top: "25%", left: "17.5%", width: "11.5%", height: "10.5%" }
            : { top: "25%", left: "71%", width: "11.5%", height: "10.5%" };
    }

    if (normalized.includes("sleeve")) {
        return side === "front"
            ? { top: "25%", left: "71%", width: "11.5%", height: "10.5%" }
            : { top: "25%", left: "17.5%", width: "11.5%", height: "10.5%" };
    }

    if (normalized.includes("left chest")) {
        return side === "front"
            ? { top: "29%", left: "55%", width: "14%", height: "10.5%" }
            : null;
    }

    if (normalized.includes("right chest")) {
        return side === "front"
            ? { top: "29%", left: "31%", width: "14%", height: "10.5%" }
            : null;
    }

    if (normalized.includes("full back")) {
        return { top: "24%", left: "26%", width: "48%", height: "25%" };
    }

    if (normalized.includes("upper back")) {
        return { top: "21%", left: "31%", width: "38%", height: "11%" };
    }

    if (normalized.includes("back")) {
        return { top: "26.5%", left: "33%", width: "34%", height: "15%" };
    }

    if (normalized.includes("left")) {
        return side === "front"
            ? { top: "31%", left: "56%", width: "15%", height: "11%" }
            : { top: "29%", left: "56%", width: "15%", height: "11%" };
    }

    if (normalized.includes("right")) {
        return side === "front"
            ? { top: "31%", left: "29%", width: "15%", height: "11%" }
            : { top: "29%", left: "29%", width: "15%", height: "11%" };
    }

    if (normalized.includes("center") || normalized.includes("front")) {
        return { top: "28.5%", left: "39%", width: "22%", height: "13%" };
    }

    return { top: "28.5%", left: "39%", width: "22%", height: "13%" };
}

function lighten(hex: string, amount: number) {
    return shiftHex(hex, amount);
}

function darken(hex: string, amount: number) {
    return shiftHex(hex, -amount);
}

function shiftHex(hex: string, amount: number) {
    const safeHex = hex.startsWith("#") ? hex.slice(1) : hex;
    const normalized = safeHex.length === 3
        ? safeHex
              .split("")
              .map((char) => `${char}${char}`)
              .join("")
        : safeHex;

    if (normalized.length !== 6) return "#5B9BD5";

    const num = Number.parseInt(normalized, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)}`;
}
